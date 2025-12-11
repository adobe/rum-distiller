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
 * Thin browser-side client for analysis.worker.js
 */

export function createAnalysisSession(workerUrl) {
  const w = new Worker(workerUrl, { type: 'module' });
  let seq = 0;
  const inflight = new Map();

  w.onmessage = (ev) => {
    const {
      id, ok, result, partial,
    } = ev.data || {};
    const entry = inflight.get(id);
    if (!entry) {
      // eslint-disable-next-line no-console
      if (typeof console !== 'undefined' && console.warn) console.warn('[session] Unknown message id:', id);
      return;
    }
    if (partial && entry.onPartial) entry.onPartial(result);
    if (!partial) {
      inflight.delete(id);
      if (ok) entry.resolve(result);
      else entry.reject(result);
    }
  };

  function request(cmd, payload, { onPartial } = {}) {
    seq += 1;
    const id = seq;
    const promise = new Promise((resolve, reject) => {
      inflight.set(id, { resolve, reject, onPartial });
    });
    w.postMessage({ id, cmd, payload });
    const cancel = () => {
      seq += 1;
      w.postMessage({ id: seq, cmd: 'cancel', payload: { targetId: id } });
    };
    return { id, promise, cancel };
  }

  return {
    init: (options) => request('init', options).promise,
    load: (chunks) => request('load', { chunks }).promise,
    addData: (chunks) => request('addData', { chunks }).promise,
    computeProgressive: (options, handlers = {}) => request('computeProgressive', options, handlers),
    // Streaming API
    streamInit: (options) => request('stream:init', options),
    streamAdd: (options, handlers = {}) => request('stream:add', options, handlers),
    streamPhase: (options) => request('stream:phase', options),
    streamEnd: (options) => request('stream:end', options),
    streamFinalize: (options) => request('stream:finalize', options),
    // Module registration API (for custom facets/series in the worker)
    registerFacetModule: ({ name, url }) => request('facet:import', { name, url }).promise,
    registerSeriesModule: ({ name, url }) => request('series:import', { name, url }).promise,
    terminate: () => w.terminate(),
  };
}

/**
 * High-level StreamingDataChunks helper that provides a DataChunks-like API
 * with streaming ingestion and auto-progression.
 */
export function createStreamingDataChunks(workerUrl) {
  const session = createAnalysisSession(workerUrl);
  const cfg = {
    series: [],
    facets: [],
    thresholds: [0.12, 0.25, 0.5, 1],
    quantiles: [0.5, 0.9, 0.99],
    defaultTopK: 50,
    topK: {},
    filter: {},
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

  async function ensureInit() {
    if (reqId != null) return;
    // Register ESM modules for custom facets/series before init
    for (let i = 0; i < moduleFacets.length; i += 1) {
      const { name, url } = moduleFacets[i];
      await session.registerFacetModule({ name, url });
    }
    for (let i = 0; i < moduleSeries.length; i += 1) {
      const { name, url } = moduleSeries[i];
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
    const init = session.streamInit({ expectedRequests: expectChunks > 0 ? expectChunks : 1, filter: cfg.filter || {} });
    await init.promise;
    reqId = init.id;
    // start auto-progression
    const th = cfg.thresholds;
    ticker = setInterval(async () => {
      const cov = lastSnap?.ingestion?.coverage || 0;
      const current = lastSnap?.phase || 0;
      const minDesired = 0.5 * cov;
      const nextT = th.find((t) => t > current) ?? 1;
      const nudgeStep = 0.02;
      const desired = Math.max(current + nudgeStep, minDesired);
      const target = (cov < 1) ? Math.min(nextT, desired) : ((current + 1e-9 < nextT) ? nextT : Math.min(1, desired));
      if (target > current + 1e-6) {
        try {
          const p = await session.streamPhase({ reqId, phase: Number(target.toFixed(6)) }).promise;
          lastSnap = p;
          if (snapHandler) {
            const enriched = { ...p, progress: api.progress, quantiles: p.exactQuantiles || p.approxQuantiles };
            snapHandler(enriched);
            if (enriched.progress >= 1 - 1e-9 && doneHandler) doneHandler(enriched);
          }
        } catch (_) { /* ignore */ }
      }
      if (cov >= 1 && (lastSnap?.phase || 0) >= 1 - 1e-9) { clearInterval(ticker); ticker = null; }
    }, 140);
  }

  const api = {
    addSeries() { throw new Error('addSeries is not supported in StreamingDataChunks. Use addDistillerSeries(name) or addModuleSeries(name, url).'); },
    addDistillerSeries(name) { if (Array.isArray(name)) throw new Error('addDistillerSeries expects a string. Call it multiple times for multiple series.'); cfg.series.push(name); return this; },
    addModuleSeries(name, url) { moduleSeries.push({ name, url: String(url) }); cfg.series.push(name); return this; },
    addFacet() { throw new Error('addFacet is not supported in StreamingDataChunks. Use addDistillerFacet(name) or addModuleFacet(name, url).'); },
    addDistillerFacet(name) { cfg.facets.push(name); return this; },
    addModuleFacet(name, url) { moduleFacets.push({ name, url: String(url) }); cfg.facets.push(name); return this; },
    setThresholds(...args) {
      if (args.length === 1 && Number.isFinite(args[0])) {
        const n = Math.max(1, Number(args[0]));
        const start = 0.12; const arr = [];
        for (let i = 1; i <= n; i += 1) { const t = start + (1 - start) * (i / n); arr.push(Number(Math.min(1, t).toFixed(6))); }
        arr[arr.length - 1] = 1; cfg.thresholds = arr; return this;
      }
      const arr = args.map(Number).filter((x) => Number.isFinite(x) && x > 0 && x <= 1);
      if (arr[arr.length - 1] !== 1) arr.push(1);
      cfg.thresholds = arr; return this;
    },
    prepareQuantiles(...ps) { cfg.quantiles = ps.length ? ps : cfg.quantiles; return this; },
    set defaultTopK(v) { cfg.defaultTopK = Number(v) || 50; },
    get defaultTopK() { return cfg.defaultTopK; },
    topK: cfg.topK,
    set expectChunks(v) { expectChunks = Math.max(0, Number(v) || 0); },
    get expectChunks() { return expectChunks; },
    onSnap(fn) { snapHandler = fn; return this; },
    onDone(fn) { doneHandler = fn; return this; },
    setFilter(filterSpec) { cfg.filter = filterSpec || {}; return this; },
    set filter(filterSpec) {
      cfg.filter = filterSpec || {};
      // Restart run with the new filter; replay already-loaded slices
      // Fire-and-forget to keep setter synchronous
      this.restartWithCurrentFilter()?.catch?.(() => {});
    },
    get filter() { return cfg.filter; },
    get progress() { const f = (lastSnap?.phase || 0) * (lastSnap?.ingestion?.coverage || 0); return Number(f.toFixed(6)); },
    async load(chunks) {
      await ensureInit();
      if (chunks && (Array.isArray(chunks) ? chunks.length : true)) {
        const arr = Array.isArray(chunks) ? chunks : [chunks];
        loadedSlices.push(...arr);
        const add = session.streamAdd({ reqId, chunks: arr, requestsDelta: 1 });
        const snap = await add.promise; lastSnap = snap; if (snapHandler) {
          const enriched = { ...snap, progress: api.progress, quantiles: snap.exactQuantiles || snap.approxQuantiles };
          snapHandler(enriched);
          if (enriched.progress >= 1 - 1e-9 && doneHandler) doneHandler(enriched);
        }
        return snap;
      }
      // finalize expected count based on what has arrived
      const fin = await session.streamFinalize({ reqId }).promise;
      lastSnap = fin; if (snapHandler) {
        const enriched = { ...fin, progress: api.progress, quantiles: fin.exactQuantiles || fin.approxQuantiles };
        snapHandler(enriched);
        if (enriched.progress >= 1 - 1e-9 && doneHandler) doneHandler(enriched);
      }
      return fin;
    },
    async restartWithCurrentFilter() {
      if (ticker) { clearInterval(ticker); ticker = null; }
      if (reqId != null) { try { await session.streamEnd({ reqId }).promise; } catch (_) { /* ignore */ } }
      // Preserve original expected request count; do NOT reset ingestion
      const savedExpect = expectChunks || loadedSlices.length;
      reqId = null; lastSnap = null; expectChunks = savedExpect;
      await ensureInit();
      for (let i = 0; i < loadedSlices.length; i += 1) {
        // Replay already-received slices and increment received accordingly
        const add = session.streamAdd({ reqId, chunks: [loadedSlices[i]], requestsDelta: 1 });
        const snap = await add.promise; lastSnap = snap; if (snapHandler) {
          const enriched = { ...snap, progress: api.progress, quantiles: snap.exactQuantiles || snap.approxQuantiles };
          snapHandler(enriched);
        }
      }
    },
    async close() {
      if (ticker) { clearInterval(ticker); ticker = null; }
      if (reqId != null) {
        try { await session.streamEnd({ reqId }).promise; } catch (_) { /* ignore */ }
      }
      reqId = null;
    },
  };

  return api;
}
