/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/*
 * Streaming ingestion progressive analysis.
 * Accepts chunks incrementally and maintains streaming aggregates.
 *
 * This module also exposes a high‑level browser wrapper
 * `createStreamingDataChunks(workerUrl)` that talks to the worker.
 */
import { DataChunks } from '../distiller.js';
import * as seriesMod from '../series.js';
import { facets as builtInFacets } from '../facets.js';
import {
  membership,
  exactQuantilesFromValues,
  keyForBundle,
  PHASE_EPSILON,
  DEFAULT_BINS,
  AUTO_ADVANCE_INTERVAL_MS,
} from './engine.js';
import { P2Multi } from '../src/quantiles/p2.js';

export class StreamingRun {
  constructor(expectedRequests, config, filterSpec = {}, { yieldEvery = 0, cancelCheck } = {}) {
    this.expected = Math.max(1, Number(expectedRequests) || 1);
    this.received = 0;
    this.cfg = config;
    this.filter = filterSpec || {};
    this.yieldEvery = yieldEvery;
    this.cancelCheck = cancelCheck;

    // Lookup tables (built-ins + custom)
    this.seriesFns = { ...seriesMod, ...(config.customSeries || {}) };
    this.facets = { ...builtInFacets, ...(config.customFacets || {}) };

    // Phase state
    this.phase = 0;
    this.processed = 0; // number of bundles seen up to current phase

    // Membership bins for queued items (> current phase)
    this.BINS = Number(config?.bins) || DEFAULT_BINS;
    this.bins = Array.from({ length: this.BINS }, () => []);

    // Reusable DataChunks instance for filtering deltas
    this.dc = new DataChunks();

    // Series aggregators
    this.seriesAgg = {};
    (this.cfg.series || []).forEach((name) => {
      this.seriesAgg[name] = {
        sum: 0,
        count: 0,
        min: Infinity,
        max: -Infinity,
        p2: new P2Multi(this.cfg.quantiles || [0.5, 0.9, 0.99]),
        values: [], // for exact quantiles at 100%
      };
    });

    // Facet counts (exact so far)
    this.facetCounts = {};
    (this.cfg.facets || []).forEach((name) => {
      this.facetCounts[name] = new Map();
    });
  }

  async finalize() {
    this.expected = Math.max(this.expected, this.received);
    return this.snapshot();
  }

  coverage() { return Math.min(1, this.received / this.expected); }

  async ingest(chunks, requestsDelta = 1) {
    this.received += Number(requestsDelta) || 0;
    if (!chunks || chunks.length === 0) {
      return;
    }

    // Use a reusable DataChunks to filter just this delta
    const { dc } = this;
    dc.load(chunks);
    const facetNames = Array.from(
      new Set([...(this.cfg.facets || []), ...Object.keys(this.filter || {})]),
    );
    facetNames.forEach((n) => {
      const fn = this.facets[n];
      if (typeof fn === 'function') dc.addFacet(n, fn);
    });
    if (this.filter && Object.keys(this.filter).length) dc.filter = this.filter;
    const { filtered } = dc; // prefer-destructuring

    // For each filtered bundle: compute membership and either process (<= phase) or queue in bins
    for (let i = 0; i < filtered.length; i += 1) {
      if (this.yieldEvery && i % this.yieldEvery === 0) {
        // eslint-disable-next-line no-await-in-loop
        const tick = new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
        // eslint-disable-next-line no-await-in-loop
        await tick;
        this.cancelCheck?.();
      }
      const b = filtered[i];
      const h = membership(b, keyForBundle(b));
      if (h <= this.phase) {
        this._processBundle(b);
      } else {
        const bin = Math.min(this.BINS - 1, Math.floor(h * this.BINS));
        this.bins[bin].push(b);
      }
    }
  }

  async advanceTo(newPhase) {
    const target = Math.max(this.phase, Math.min(1, Number(newPhase) || 0));
    if (target <= this.phase) return this.snapshot();
    const endBin = Math.min(this.BINS - 1, Math.floor(target * this.BINS));
    const startBin = Math.min(this.BINS - 1, Math.floor(this.phase * this.BINS));
    for (let bin = startBin; bin <= endBin; bin += 1) {
      const list = this.bins[bin];
      for (let i = 0; i < list.length; i += 1) {
        if (this.yieldEvery && i % this.yieldEvery === 0) {
          // eslint-disable-next-line no-await-in-loop
          const tick = new Promise((resolve) => {
            setTimeout(resolve, 0);
          });
          // eslint-disable-next-line no-await-in-loop
          await tick;
          this.cancelCheck?.();
        }
        this._processBundle(list[i]);
      }
      // Clear processed bin to free memory
      this.bins[bin] = [];
    }
    this.phase = target;
    return this.snapshot();
  }

  _processBundle(b) {
    this.processed += 1;
    // Series
    for (let k = 0; k < (this.cfg.series || []).length; k += 1) {
      const name = this.cfg.series[k];
      const v = this.seriesFns[name](b);
      if (v === undefined || v === null) continue; // eslint-disable-line no-continue
      const s = this.seriesAgg[name];
      s.count += 1;
      s.sum += v;
      if (v < s.min) s.min = v;
      if (v > s.max) s.max = v;
      s.p2.push(v);
      s.values.push(v);
    }
    // Facets
    for (let f = 0; f < (this.cfg.facets || []).length; f += 1) {
      const fname = this.cfg.facets[f];
      const fn = this.facets[fname];
      if (!fn) continue; // eslint-disable-line no-continue
      const vals = fn(b);
      let arr = [];
      if (Array.isArray(vals)) arr = vals;
      else if (vals) arr = [vals];
      for (let j = 0; j < arr.length; j += 1) {
        const v = arr[j];
        const m = this.facetCounts[fname];
        const cur = m.get(v) || { count: 0, weight: 0 };
        cur.count += 1;
        cur.weight += (b.weight || 1);
        m.set(v, cur);
      }
    }
  }

  snapshot() {
    const totals = {};
    const approxQuantiles = {};
    (this.cfg.series || []).forEach((name) => {
      const s = this.seriesAgg[name];
      const mean = s.count > 0 ? s.sum / s.count : 0;
      const q = s.p2.values();
      const qMap = {};
      (this.cfg.quantiles || [0.5, 0.9, 0.99]).forEach((p) => {
        qMap[Math.round(p * 100)] = q[p];
      });
      totals[name] = {
        count: s.count,
        sum: s.sum,
        min: Number.isFinite(s.min) ? s.min : 0,
        max: Number.isFinite(s.max) ? s.max : 0,
        mean,
      };
      approxQuantiles[name] = qMap;
    });

    const facets = {};
    (this.cfg.facets || []).forEach((fname) => {
      const m = this.facetCounts[fname];
      const arr = Array.from(m.entries())
        .map(([value, data]) => ({ value, count: data.count, weight: data.weight }));
      arr.sort((a, b) => b.weight - a.weight);
      const k = (typeof this.cfg.topK === 'object' && this.cfg.topK)
        ? (this.cfg.topK[fname] || this.cfg.defaultTopK || 50)
        : (this.cfg.topK || this.cfg.defaultTopK || 50);
      const out = arr.slice(0, k).map((e) => ({ ...e }));
      const f = Math.max(PHASE_EPSILON, (this.phase || 0) * this.coverage() || 0);
      if (this.phase < 1 - PHASE_EPSILON || this.coverage() < 1 - PHASE_EPSILON) {
        // avoid param-reassign by creating new objects with scaled fields
        for (let i = 0; i < out.length; i += 1) {
          const o = out[i];
          out[i] = {
            value: o.value,
            count: (o.count ?? 0) / f,
            weight: (o.weight ?? 0) / f,
          };
        }
      }
      facets[fname] = out;
    });

    const snap = {
      phase: this.phase,
      counts: { bundlesIncluded: this.processed },
      totals,
      approxQuantiles,
      facets,
      ingestion: { received: this.received, expected: this.expected, coverage: this.coverage() },
    };
    // Determine completeness: for streaming, both phase and coverage must reach 1 to be complete
    const cov = this.coverage();
    const denom = Math.max(0, Math.min(1, this.phase)) * Math.max(0, Math.min(1, cov));

    // When incomplete (phase < 1 or coverage < 1), expose scaled totals as estimates
    if (denom > 0 && (this.phase < 1 - PHASE_EPSILON || cov < 1 - PHASE_EPSILON)) {
      snap.sampleTotals = snap.totals;
      const scaled = {};
      (this.cfg.series || []).forEach((name) => {
        const t = snap.sampleTotals[name] || {};
        scaled[name] = { ...t, count: (t.count ?? 0) / denom, sum: (t.sum ?? 0) / denom };
      });
      snap.totals = scaled;
    }
    if (this.phase > 0) {
      const base = snap.sampleTotals || snap.totals;
      const estimates = {};
      (this.cfg.series || []).forEach((name) => {
        const t = base[name] || {};
        const d = denom || PHASE_EPSILON;
        estimates[name] = {
          sum: (t.sum ?? 0) / d,
          count: (t.count ?? 0) / d,
          // eslint-disable-next-line object-curly-newline
          mean: snap.totals[name]?.mean ?? t.mean,
        };
      });
      snap.estimates = estimates;
    }
    // Only compute exact quantiles when BOTH phase and coverage are complete
    if (Math.abs(this.phase - 1) < PHASE_EPSILON && Math.abs(cov - 1) < PHASE_EPSILON) {
      const exact = {};
      (this.cfg.series || []).forEach((name) => {
        exact[name] = exactQuantilesFromValues(
          this.seriesAgg[name].values,
          this.cfg.quantiles || [0.5],
        );
      });
      snap.exactQuantiles = exact;
    }
    return snap;
  }
}

// ---------------------------------------------
// Browser wrapper: createStreamingDataChunks()
// ---------------------------------------------

/**
 * Create a DataChunks-like streaming client that talks to the analysis worker.
 * @param {URL|string|any} workerInput URL to analysis.worker.js (module worker).
 *   If omitted, resolves relative to this module.
 */
export function createStreamingDataChunks(workerInput) {
  // Minimal session client (inlined; replaced previous worker/session.js)
  function createSession(wi) {
    const workerUrl = wi || new URL('./analysis.worker.js', import.meta.url);
    const w = (typeof workerUrl === 'object'
      && workerUrl
      && typeof workerUrl.postMessage === 'function')
      ? workerUrl
      : new Worker(workerUrl, { type: 'module', name: 'rum-distiller-analysis' });
    let seq = 0;
    const inflight = new Map();
    const rejectAll = (err) => {
      const arr = Array.from(inflight.values());
      inflight.clear();
      arr.forEach((e) => e.reject?.(err));
    };
    w.onmessage = (ev) => {
      const {
        id,
        ok,
        result,
        partial,
      } = ev.data || {};
      const entry = inflight.get(id);
      if (!entry) return;
      if (partial && entry.onPartial) entry.onPartial(result);
      if (!partial) {
        inflight.delete(id);
        if (ok) entry.resolve(result);
        else entry.reject(result);
      }
    };
    w.onerror = (e) => {
      rejectAll(new Error(e?.message || 'Worker error'));
    };
    w.onmessageerror = () => {
      rejectAll(new Error('Worker message error'));
    };
    function request(cmd, payload, options = {}) {
      const {
        onPartial,
        signal,
        timeout,
        transfer,
      } = options;
      seq += 1;
      const id = seq;
      let to = null;
      let onAbort = null;
      const promise = new Promise((resolve, reject) => {
        inflight.set(id, { resolve, reject, onPartial });
        const hasTimeout = timeout && Number.isFinite(timeout) && timeout > 0;
        if (hasTimeout) {
          to = setTimeout(() => {
            inflight.delete(id);
            reject(Object.assign(new Error('Operation timed out'), { name: 'TimeoutError' }));
            try {
              // eslint-disable-next-line no-plusplus
              w.postMessage({ id: ++seq, cmd: 'cancel', payload: { targetId: id } });
            } catch (_) { /* ignore */ }
          }, timeout);
        }
        if (signal) {
          if (signal.aborted) {
            inflight.delete(id);
            reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));
            return;
          }
          onAbort = () => {
            inflight.delete(id);
            reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));
            try {
              // eslint-disable-next-line no-plusplus
              w.postMessage({ id: ++seq, cmd: 'cancel', payload: { targetId: id } });
            } catch (_) { /* ignore */ }
          };
          signal.addEventListener('abort', onAbort, { once: true });
        }
      });
      try {
        const hasTransfer = transfer && Array.isArray(transfer) && transfer.length;
        if (hasTransfer) w.postMessage({ id, cmd, payload }, transfer);
        else w.postMessage({ id, cmd, payload });
      } catch (e) {
        inflight.delete(id);
        if (signal && onAbort) signal.removeEventListener('abort', onAbort);
        if (to) clearTimeout(to);
        throw e;
      }
      const cancel = () => {
        if (signal && onAbort) signal.removeEventListener('abort', onAbort);
        if (to) clearTimeout(to);
        // eslint-disable-next-line no-plusplus
        seq += 1;
        w.postMessage({ id: seq, cmd: 'cancel', payload: { targetId: id } });
      };
      promise.finally(() => {
        if (signal && onAbort) signal.removeEventListener('abort', onAbort);
        if (to) clearTimeout(to);
      });
      return { id, promise, cancel };
    }
    return {
      init: (opts) => request('init', opts).promise,
      streamInit: (opts) => request('stream:init', opts),
      streamAdd: (opts, handlers = {}) => request('stream:add', opts, handlers),
      streamPhase: (opts) => request('stream:phase', opts),
      streamEnd: (opts) => request('stream:end', opts),
      streamFinalize: (opts) => request('stream:finalize', opts),
      registerFacetModule: ({ name, url }) => request(
        'facet:import',
        { name, url },
      ).promise,
      registerSeriesModule: ({ name, url }) => request(
        'series:import',
        { name, url },
      ).promise,
      terminate: () => {
        try {
          w.terminate();
        } finally {
          rejectAll(new Error('Worker terminated'));
        }
      },
    };
  }

  const session = createSession(workerInput);
  const cfg = {
    series: [],
    facets: [],
    thresholds: [0.12, 0.25, 0.5, 1],
    quantiles: [0.5, 0.9, 0.99],
    defaultTopK: 50,
    topK: {},
    filter: {},
    autoAdvanceIntervalMs: AUTO_ADVANCE_INTERVAL_MS,
    maxSlices: Infinity,
  };
  const moduleFacets = [];
  const moduleSeries = [];
  let expectChunks = 0;
  let snapHandler = null;
  let doneHandler = null;
  let reqId = null;
  let ticker = null;
  let lastSnap = null;
  const loadedSlices = [];
  let errorHandler = null;
  // Restart coordination
  let restarting = false;
  let restartSeq = 0;

  function computeProgress(snap) {
    const phase = snap?.phase || 0;
    const cov = snap?.ingestion?.coverage || 0;
    const f = phase * cov;
    return Number(f.toFixed(6));
  }

  function enrich(snap) {
    return {
      ...snap,
      progress: computeProgress(snap),
      quantiles: snap.exactQuantiles || snap.approxQuantiles,
    };
  }

  async function ensureInit() {
    if (reqId != null) return;
    for (let i = 0; i < moduleFacets.length; i += 1) {
      const { name, url } = moduleFacets[i];
      // eslint-disable-next-line no-await-in-loop
      await session.registerFacetModule({ name, url });
    }
    for (let i = 0; i < moduleSeries.length; i += 1) {
      const { name, url } = moduleSeries[i];
      // eslint-disable-next-line no-await-in-loop
      await session.registerSeriesModule({ name, url });
    }
    await session.init({
      series: cfg.series,
      facets: cfg.facets,
      thresholds: cfg.thresholds,
      quantiles: cfg.quantiles,
      topK: cfg.topK,
      defaultTopK: cfg.defaultTopK,
    });
    const init = session.streamInit({
      expectedRequests: expectChunks > 0 ? expectChunks : 1,
      filter: cfg.filter || {},
    });
    await init.promise;
    reqId = init.id;
    const th = cfg.thresholds;
    ticker = setInterval(async () => {
      const cov = lastSnap?.ingestion?.coverage || 0;
      const current = lastSnap?.phase || 0;
      const minDesired = 0.5 * cov;
      const nextT = th.find((t) => t > current) ?? 1;
      const nudgeStep = 0.02;
      const desired = Math.max(current + nudgeStep, minDesired);
      let target = 0;
      if (cov < 1) {
        target = Math.min(nextT, desired);
      } else if (current + PHASE_EPSILON < nextT) {
        target = nextT;
      } else {
        target = Math.min(1, desired);
      }
      if (target > current + 1e-6) {
        try {
          const req = session.streamPhase({
            reqId,
            phase: Number(target.toFixed(6)),
          });
          const p = await req.promise;
          lastSnap = p;
          if (snapHandler) {
            const enriched = enrich(p);
            snapHandler(enriched);
            if (enriched.progress >= 1 - PHASE_EPSILON && doneHandler) {
              doneHandler(enriched);
            }
          }
        } catch (_) { /* ignore */ }
      }
      if (cov >= 1 && (lastSnap?.phase || 0) >= 1 - PHASE_EPSILON) {
        clearInterval(ticker);
        ticker = null;
      }
    }, Number(cfg.autoAdvanceIntervalMs) || AUTO_ADVANCE_INTERVAL_MS);
  }

  const api = {
    addSeries() {
      throw new Error(
        'addSeries is not supported in StreamingDataChunks. '
        + 'Use addDistillerSeries(name) or addModuleSeries(name, url).',
      );
    },
    addDistillerSeries(name) {
      if (Array.isArray(name)) {
        throw new Error('addDistillerSeries expects a string.');
      }
      cfg.series.push(name);
      return this;
    },
    addModuleSeries(name, url) {
      moduleSeries.push({ name, url: String(url) });
      cfg.series.push(name);
      return this;
    },
    addFacet() {
      throw new Error(
        'addFacet is not supported in StreamingDataChunks. '
        + 'Use addDistillerFacet(name) or addModuleFacet(name, url).',
      );
    },
    addDistillerFacet(name) {
      cfg.facets.push(name);
      return this;
    },
    addModuleFacet(name, url) {
      moduleFacets.push({ name, url: String(url) });
      cfg.facets.push(name);
      return this;
    },
    setThresholds(...args) {
      if (args.length === 1 && Number.isFinite(args[0])) {
        const n = Math.max(1, Number(args[0]));
        const start = 0.12;
        const arr = [];
        for (let i = 1; i <= n; i += 1) {
          const t = start + (1 - start) * (i / n);
          arr.push(Number(Math.min(1, t).toFixed(6)));
        }
        arr[arr.length - 1] = 1;
        cfg.thresholds = arr;
        return this;
      }
      const arr = args
        .map(Number)
        .filter((x) => Number.isFinite(x) && x > 0 && x <= 1);
      if (arr[arr.length - 1] !== 1) arr.push(1);
      cfg.thresholds = arr;
      return this;
    },
    prepareQuantiles(...ps) {
      cfg.quantiles = ps.length ? ps : cfg.quantiles;
      return this;
    },
    set autoAdvanceIntervalMs(v) {
      cfg.autoAdvanceIntervalMs = Number(v) || AUTO_ADVANCE_INTERVAL_MS;
    },
    get autoAdvanceIntervalMs() { return cfg.autoAdvanceIntervalMs; },
    set defaultTopK(v) {
      cfg.defaultTopK = Number(v) || 50;
    },
    get defaultTopK() {
      return cfg.defaultTopK;
    },
    topK: cfg.topK,
    set maxSlices(v) { cfg.maxSlices = Number.isFinite(v) ? Number(v) : Infinity; },
    get maxSlices() { return cfg.maxSlices; },
    set expectChunks(v) {
      expectChunks = Math.max(0, Number(v) || 0);
    },
    get expectChunks() {
      return expectChunks;
    },
    onSnap(fn) {
      snapHandler = fn;
      return this;
    },
    onDone(fn) {
      doneHandler = fn;
      return this;
    },
    onError(fn) {
      errorHandler = fn;
      return this;
    },
    setFilter(filterSpec) {
      cfg.filter = filterSpec || {};
      return this;
    },
    set filter(filterSpec) {
      cfg.filter = filterSpec || {};
      // Fire-and-forget to keep setter synchronous
      const r = this.restartWithCurrentFilter();
      r?.catch?.((e) => errorHandler?.(e));
    },
    get filter() { return cfg.filter; },
    get progress() { return computeProgress(lastSnap); },
    async load(chunks) {
      await ensureInit();
      const hasData = chunks && (Array.isArray(chunks) ? chunks.length : true);
      if (hasData) {
        const arr = Array.isArray(chunks) ? chunks : [chunks];
        loadedSlices.push(...arr);
        // Enforce optional maxSlices to bound memory growth
        if (
          Number.isFinite(cfg.maxSlices)
          && cfg.maxSlices >= 0
          && loadedSlices.length > cfg.maxSlices
        ) {
          loadedSlices.splice(0, loadedSlices.length - cfg.maxSlices);
        }
        const add = session.streamAdd({ reqId, chunks: arr, requestsDelta: 1 });
        const snap = await add.promise;
        lastSnap = snap;
        if (snapHandler) {
          const enriched = enrich(snap);
          snapHandler(enriched);
          if (enriched.progress >= 1 - PHASE_EPSILON && doneHandler) {
            doneHandler(enriched);
          }
        }
        return snap;
      }
      const fin = await session.streamFinalize({ reqId }).promise;
      lastSnap = fin;
      if (snapHandler) {
        const enriched = enrich(fin);
        snapHandler(enriched);
        if (enriched.progress >= 1 - PHASE_EPSILON && doneHandler) {
          doneHandler(enriched);
        }
      }
      return fin;
    },
    async restartWithCurrentFilter() {
      restartSeq += 1;
      const mySeq = restartSeq;
      if (restarting) {
        // Mark previous restart as obsolete; it will observe seq change
      }
      restarting = true;
      if (ticker) {
        clearInterval(ticker);
        ticker = null;
      }
      if (reqId != null) {
        try {
          await session.streamEnd({ reqId }).promise;
        } catch (_) { /* ignore */ }
      }
      const savedExpect = expectChunks || loadedSlices.length;
      reqId = null;
      lastSnap = null;
      expectChunks = savedExpect;
      try {
        await ensureInit();
        for (let i = 0; i < loadedSlices.length; i += 1) {
          if (mySeq !== restartSeq) return; // another restart superseded this one
          const add = session.streamAdd({
            reqId,
            chunks: [loadedSlices[i]],
            requestsDelta: 1,
          });
          // eslint-disable-next-line no-await-in-loop
          const snap = await add.promise;
          lastSnap = snap;
          if (snapHandler) {
            snapHandler(enrich(snap));
          }
        }
      } catch (e) {
        errorHandler?.(e);
        throw e;
      } finally {
        if (mySeq === restartSeq) restarting = false;
      }
    },
    async close() {
      if (ticker) {
        clearInterval(ticker);
        ticker = null;
      }
      if (reqId != null) {
        try {
          await session.streamEnd({ reqId }).promise;
        } catch (_) { /* ignore */ }
      }
      reqId = null;
    },
  };

  return api;
}
