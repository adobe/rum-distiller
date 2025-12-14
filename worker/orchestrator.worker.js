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

/* eslint-disable no-restricted-globals */

import { MergeableHistMulti } from '../src/quantiles/mergeable_hist.js';

const ctx = /** @type {WorkerGlobalScope} */ (self);

function respond(id, ok, result) {
  ctx.postMessage({ id, ok, result });
}

function createSubWorker() {
  const w = new Worker(new URL('./analysis.worker.js', import.meta.url), { type: 'module' });
  // Prevent subworker errors from bubbling to the main page; record locally instead.
  const swallow = (e) => { try { e.preventDefault?.(); } catch (_) { /* ignore */ } };
  w.addEventListener('error', swallow);
  w.addEventListener('messageerror', swallow);
  return w;
}

class SessionGroup {
  constructor(config, shards) {
    this.config = config;
    this.shards = Math.max(1, Number(shards) || 1);
    this.workers = [];
    this.inflight = new Map();
    this.seq = 0;
    this.last = new Array(this.shards).fill(null);
    this.rr = 0;
    this.expected = 0;
    this.received = 0;
    this.runIds = new Array(this.shards).fill(null);
  }

  _request(w, cmd, payload, { onPartial } = {}) {
    this.seq += 1;
    const id = this.seq;
    return new Promise((resolve, reject) => {
      const handler = (ev) => {
        const {
          id: rid,
          ok,
          result,
          partial,
        } = ev.data || {};
        if (rid !== id) return;
        if (partial && onPartial) onPartial(result);
        if (!partial) {
          w.removeEventListener('message', handler);
          if (ok) resolve(result);
          else reject(result);
        }
      };
      w.addEventListener('message', handler);
      w.postMessage({ id, cmd, payload });
    });
  }

  async init() {
    // spawn
    for (let i = 0; i < this.shards; i += 1) this.workers.push(createSubWorker());
    // propagate config to each
    await Promise.all(this.workers.map((w) => this._request(
      w,
      'init',
      {
        thresholds: this.config.thresholds,
        series: this.config.series,
        facets: this.config.facets,
        quantiles: this.config.quantiles,
        topK: this.config.topK,
        defaultTopK: this.config.defaultTopK,
      },
    )));
    // register any dynamic modules
    const facetNames = Object.keys(this.config.customFacets || {});
    const seriesNames = Object.keys(this.config.customSeries || {});
    await Promise.all(facetNames.map((name) => Promise.all(this.workers.map((w) => this._request(
      w,
      'facet:import',
      { name, url: this.config.customFacets[name] },
    )))));
    await Promise.all(seriesNames.map((name) => Promise.all(this.workers.map((w) => this._request(
      w,
      'series:import',
      { name, url: this.config.customSeries[name] },
    )))));
  }

  async streamInit({ expectedRequests, filter }) {
    this.expected = Math.max(0, Number(expectedRequests) || 0);
    // Initialize a separate streaming run on each subworker and record its reqId
    for (let i = 0; i < this.workers.length; i += 1) {
      const w = this.workers[i];
      this.seq += 1;
      const id = this.seq;
      // eslint-disable-next-line no-loop-func
      const promise = new Promise((resolve, reject) => {
        const handler = (ev) => {
          const { id: rid, ok, result } = ev.data || {};
          if (rid !== id) return;
          w.removeEventListener('message', handler);
          if (ok) resolve(result);
          else reject(result);
        };
        w.addEventListener('message', handler);
        w.postMessage({ id, cmd: 'stream:init', payload: { expectedRequests: 1, filter: filter || {} } });
      });
      // wait init and store req id used for this worker
      // eslint-disable-next-line no-await-in-loop
      await promise;
      this.runIds[i] = id;
    }
    return { ok: true };
  }

  async streamAdd({ chunks, requestsDelta }) {
    this.received += Number(requestsDelta) || 0;
    const idx = (this.rr += 1) % this.shards;
    const w = this.workers[idx];
    const snap = await this._request(w, 'stream:add', { reqId: this.runIds[idx], chunks, requestsDelta: 1 });
    this.last[idx] = snap;
    return this._merged();
  }

  async streamPhase({ phase }) {
    const snaps = await Promise.all(
      this.workers.map((w, i) => this._request(w, 'stream:phase', { reqId: this.runIds[i], phase })),
    );
    for (let i = 0; i < snaps.length; i += 1) this.last[i] = snaps[i];
    return this._merged();
  }

  async streamFinalize() {
    // align expected with received if needed
    if (!this.expected || this.expected < this.received) this.expected = this.received;
    return this._merged();
  }

  async end() {
    await Promise.all(this.workers.map((w, i) => this._request(w, 'stream:end', { reqId: this.runIds[i] })));
    this.workers.forEach((w) => w.terminate());
  }

  _merged() {
    const snaps = this.last.filter(Boolean);
    const names = this.config.series || [];
    const facetNames = this.config.facets || [];
    if (!snaps.length) {
      return {
        phase: 0,
        totals: {},
        approxQuantiles: {},
        facets: {},
        ingestion: { received: this.received, expected: this.expected, coverage: this._coverage() },
      };
    }
    const minPhase = snaps.reduce((m, s) => Math.min(m, s.phase || 0), 1);
    const totalsSum = {};
    const samplesSum = {};
    const facets = {};
    // merge mergeable histograms from state
    const mh = new MergeableHistMulti(this.config.quantiles || [0.5, 0.9, 0.99], 256);
    for (let i = 0; i < snaps.length; i += 1) {
      const s = snaps[i];
      // totals
      names.forEach((n) => {
        const base = (s.sampleTotals && s.sampleTotals[n])
          ? s.sampleTotals[n]
          : (s.totals[n] || {});
        const cur = samplesSum[n] || {
          count: 0, sum: 0, min: Infinity, max: -Infinity,
        };
        cur.count += base.count || 0;
        cur.sum += base.sum || 0;
        cur.min = Math.min(cur.min, Number.isFinite(base.min) ? base.min : Infinity);
        cur.max = Math.max(cur.max, Number.isFinite(base.max) ? base.max : -Infinity);
        samplesSum[n] = cur;
      });
      // merge facets
      facetNames.forEach((fname) => {
        const list = s.facets?.[fname] || [];
        const m = facets[fname] || new Map();
        for (let j = 0; j < list.length; j += 1) {
          const e = list[j];
          const cur = m.get(e.value) || { count: 0, weight: 0 };
          cur.count += e.count || 0;
          cur.weight += e.weight || 0;
          m.set(e.value, cur);
        }
        facets[fname] = m;
      });
      // merge histogram state
      const ms = s.mergeableState || {};
      Object.entries(ms).forEach(([seriesName, st]) => {
        // construct a histogram from state
        const bins = st?.bins || 256;
        const h = {
          bins, counts: st?.counts || [], min: st?.min, max: st?.max,
        };
        if (!Number.isFinite(h.min) || !Number.isFinite(h.max)) return;
        // feed centers with weights to mh
        const step = (h.max - h.min) / bins;
        for (let b = 0; b < bins; b += 1) {
          const c = h.counts[b] || 0;
          if (!c) continue; // eslint-disable-line no-continue
          const x = h.min + (b + 0.5) * step;
          mh.push(seriesName, x, c);
        }
      });
    }
    // scale totals using combined denom
    const coverage = this._coverage();
    const denom = Math.max(0, Math.min(1, minPhase)) * Math.max(0, Math.min(1, coverage));
    names.forEach((n) => {
      const t = samplesSum[n] || {};
      if (denom > 0 && (minPhase < 1 || coverage < 1)) {
        totalsSum[n] = {
          ...t,
          count: (t.count || 0) / denom,
          sum: (t.sum || 0) / denom,
          mean: t.count ? (t.sum / t.count) : 0,
        };
      } else {
        totalsSum[n] = { ...t, mean: t.count ? (t.sum / t.count) : 0 };
      }
    });
    // finalize facets array with topK
    const outFacets = {};
    facetNames.forEach((fname) => {
      const m = facets[fname] || new Map();
      const k = (typeof this.config.topK === 'object' && this.config.topK)
        ? (this.config.topK[fname] || this.config.defaultTopK || 50)
        : (this.config.topK || this.config.defaultTopK || 50);
      outFacets[fname] = Array.from(m.entries())
        .map(([value, data]) => ({ value, count: data.count, weight: data.weight }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, k);
    });

    return {
      phase: minPhase,
      counts: { bundlesIncluded: snaps.reduce((a, s) => a + (s.counts?.bundlesIncluded || 0), 0) },
      totals: totalsSum,
      approxQuantiles: {},
      mergeableQuantiles: mh.values(),
      facets: outFacets,
      ingestion: { received: this.received, expected: this.expected, coverage },
    };
  }

  _coverage() {
    if (!this.expected) return 0;
    return Math.min(1, this.received / this.expected);
  }
}

let config = {
  thresholds: [0.12, 0.25, 0.5, 1],
  series: [],
  facets: [],
  quantiles: [0.5, 0.9, 0.99],
  topK: 50,
  defaultTopK: 50,
  customFacets: {},
  customSeries: {},
};

// id -> SessionGroup
const groups = new Map();

ctx.onmessage = async (ev) => {
  const { id, cmd, payload } = ev.data || {};
  try {
    switch (cmd) {
      case 'init': {
        config = {
          thresholds: payload?.thresholds || config.thresholds,
          series: payload?.series || config.series,
          facets: payload?.facets || config.facets,
          quantiles: payload?.quantiles || config.quantiles,
          topK: payload?.topK ?? config.topK,
          defaultTopK: payload?.defaultTopK
            ?? payload?.topKDefault
            ?? config.defaultTopK,
          customFacets: config.customFacets || {},
          customSeries: config.customSeries || {},
        };
        respond(id, true, { ok: true });
        break;
      }
      case 'facet:import': {
        const name = payload?.name;
        const url = payload?.url;
        if (!name || !url) {
          respond(id, false, { error: 'name and url required' });
          break;
        }
        config.customFacets[name] = url;
        respond(id, true, { ok: true });
        break;
      }
      case 'series:import': {
        const name = payload?.name;
        const url = payload?.url;
        if (!name || !url) {
          respond(id, false, { error: 'name and url required' });
          break;
        }
        config.customSeries[name] = url;
        respond(id, true, { ok: true });
        break;
      }
      case 'stream:init': {
        const shards = Math.max(1, Number(payload?.shards) || 1);
        const g = new SessionGroup(config, shards);
        await g.init();
        groups.set(id, g);
        await g.streamInit({
          expectedRequests: Number(payload?.expectedRequests) || 0,
          filter: payload?.filter || {},
        });
        respond(id, true, { ok: true });
        break;
      }
      case 'stream:add': {
        const g = groups.get(payload?.reqId || id);
        if (!g) {
          respond(id, false, { error: 'no group' });
          break;
        }
        const snap = await g.streamAdd({
          chunks: payload?.chunks || [],
          requestsDelta: Number(payload?.requestsDelta) || 0,
        });
        respond(id, true, snap);
        break;
      }
      case 'stream:phase': {
        const g = groups.get(payload?.reqId || id);
        if (!g) {
          respond(id, false, { error: 'no group' });
          break;
        }
        const snap = await g.streamPhase({ phase: Number(payload?.phase) || 0 });
        respond(id, true, snap);
        break;
      }
      case 'stream:finalize': {
        const g = groups.get(payload?.reqId || id);
        if (!g) {
          respond(id, false, { error: 'no group' });
          break;
        }
        const snap = await g.streamFinalize();
        respond(id, true, snap);
        break;
      }
      case 'stream:end': {
        const g = groups.get(payload?.reqId || id);
        if (!g) {
          respond(id, false, { error: 'no group' });
          break;
        }
        await g.end();
        groups.delete(payload?.reqId || id);
        respond(id, true, { done: true });
        break;
      }
      default:
        respond(id, false, { error: `Unknown cmd: ${cmd}` });
    }
  } catch (e) {
    respond(id, false, { error: e?.message || String(e) });
  }
};
