/*
 * Streaming ingestion progressive analysis.
 * Accepts chunks incrementally and maintains streaming aggregates.
 */
import { DataChunks } from '../distiller.js';
import * as seriesMod from '../series.js';
import { facets as builtInFacets } from '../facets.js';
import { membership, exactQuantilesFromValues, keyForBundle } from './engine.js';
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
    this.BINS = 1024;
    this.bins = Array.from({ length: this.BINS }, () => []);

    // Series aggregators
    this.seriesAgg = {};
    (this.cfg.series || []).forEach((name) => {
      this.seriesAgg[name] = {
        sum: 0, count: 0, min: Infinity, max: -Infinity,
        p2: new P2Multi(this.cfg.quantiles || [0.5, 0.9, 0.99]),
        values: [], // for exact quantiles at 100%
      };
    });

    // Facet counts (exact so far)
    this.facetCounts = {};
    (this.cfg.facets || []).forEach((name) => { this.facetCounts[name] = new Map(); });
  }

  async finalize() {
    this.expected = Math.max(this.expected, this.received);
    return this.snapshot();
  }

  coverage() { return Math.min(1, this.received / this.expected); }

  async ingest(chunks, requestsDelta = 1) {
    this.received += Number(requestsDelta) || 0;
    if (!chunks || chunks.length === 0) return;

    // Use a temporary DataChunks to filter just this delta
    const dc = new DataChunks();
    dc.load(chunks);
    const facetNames = Array.from(new Set([...(this.cfg.facets || []), ...Object.keys(this.filter || {})]));
    facetNames.forEach((n) => { const fn = this.facets[n]; if (typeof fn === 'function') dc.addFacet(n, fn); });
    if (this.filter && Object.keys(this.filter).length) dc.filter = this.filter;
    const filtered = dc.filtered;

    // For each filtered bundle: compute membership and either process (<= phase) or queue in bins
    for (let i = 0; i < filtered.length; i += 1) {
      if (this.yieldEvery && i % this.yieldEvery === 0) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 0));
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
          await new Promise((r) => setTimeout(r, 0));
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
      const arr = Array.isArray(vals) ? vals : (vals ? [vals] : []);
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
      (this.cfg.quantiles || [0.5, 0.9, 0.99]).forEach((p) => { qMap[Math.round(p * 100)] = q[p]; });
      totals[name] = { count: s.count, sum: s.sum, min: Number.isFinite(s.min) ? s.min : 0, max: Number.isFinite(s.max) ? s.max : 0, mean };
      approxQuantiles[name] = qMap;
    });

    const facets = {};
    (this.cfg.facets || []).forEach((fname) => {
      const m = this.facetCounts[fname];
      const arr = Array.from(m.entries()).map(([value, data]) => ({ value, count: data.count, weight: data.weight }));
      arr.sort((a, b) => b.weight - a.weight);
      const k = (typeof this.cfg.topK === 'object' && this.cfg.topK)
        ? (this.cfg.topK[fname] || this.cfg.defaultTopK || 50)
        : (this.cfg.topK || this.cfg.defaultTopK || 50);
      const out = arr.slice(0, k).map((e) => ({ ...e }));
      const f = Math.max(1e-9, (this.phase || 0) * this.coverage() || 0);
      if (this.phase < 1 - 1e-9 || this.coverage() < 1 - 1e-9) {
        out.forEach((o) => { o.weight = (o.weight ?? 0) / f; o.count = (o.count ?? 0) / f; });
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
    if (denom > 0 && (this.phase < 1 - 1e-9 || cov < 1 - 1e-9)) {
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
        const d = denom || 1e-9;
        estimates[name] = { sum: (t.sum ?? 0) / d, count: (t.count ?? 0) / d, mean: snap.totals[name]?.mean ?? t.mean };
      });
      snap.estimates = estimates;
    }
    // Only compute exact quantiles when BOTH phase and coverage are complete
    if (Math.abs(this.phase - 1) < 1e-9 && Math.abs(cov - 1) < 1e-9) {
      const exact = {};
      (this.cfg.series || []).forEach((name) => {
        exact[name] = exactQuantilesFromValues(this.seriesAgg[name].values, this.cfg.quantiles || [0.5]);
      });
      snap.exactQuantiles = exact;
    }
    return snap;
  }
}
