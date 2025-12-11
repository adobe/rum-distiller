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
 * Incremental progressive analysis (O(delta) per phase).
 */
import { DataChunks } from '../distiller.js';
import * as seriesMod from '../series.js';
import { facets as builtInFacets } from '../facets.js';
import { membership, exactQuantilesFromValues } from './engine.js';
import { P2Multi } from '../src/quantiles/p2.js';

/** Tolerance for floating-point comparison when checking phase === 1 */
const PHASE_EPSILON = 1e-9;

export class ProgressiveRun {
  constructor(loadedChunks, config, filterSpec = {}, { yieldEvery = 0, cancelCheck } = {}) {
    this.cfg = config;
    this.filter = filterSpec || {};
    this.yieldEvery = yieldEvery;
    this.cancelCheck = cancelCheck;

    // Lookup tables (built-ins + custom)
    this.seriesFns = { ...seriesMod, ...(config.customSeries || {}) };
    this.facets = { ...builtInFacets, ...(config.customFacets || {}) };

    // Build filtered bundle list once
    const dc = new DataChunks();
    dc.load(loadedChunks);
    const facetNames = Array.from(
      new Set([...(this.cfg.facets || []), ...Object.keys(this.filter || {})]),
    );
    facetNames.forEach((n) => {
      const fn = this.facets[n];
      if (typeof fn === 'function') dc.addFacet(n, fn);
    });
    if (this.filter && Object.keys(this.filter).length) dc.filter = this.filter;
    this.filtered = dc.filtered;

    // Precompute membership and sort by it
    this.items = new Array(this.filtered.length);
    for (let i = 0; i < this.filtered.length; i += 1) {
      const b = this.filtered[i];
      this.items[i] = { b, h: membership(b) };
    }
    this.items.sort((a, b) => a.h - b.h);
    this.cursor = 0;

    // Series aggregators
    this.seriesAgg = {};
    (this.cfg.series || []).forEach((name) => {
      this.seriesAgg[name] = {
        sum: 0,
        count: 0,
        min: Infinity,
        max: -Infinity,
        p2: new P2Multi(this.cfg.quantiles || [0.5, 0.9, 0.99]),
        values: [], // for exact at 100%
      };
    });
    // Facet counts (exact so far)
    this.facetCounts = {};
    (this.cfg.facets || []).forEach((name) => {
      this.facetCounts[name] = new Map();
    });
  }

  async advanceTo(phase) {
    if (typeof phase !== 'number' || phase <= 0 || phase > 1) {
      throw new Error(`phase must be in (0, 1], got: ${phase}`);
    }
    const target = phase;
    const n = this.items.length;
    // Find boundary index (first index with h >= phase)
    let hi = this.cursor;
    while (hi < n && this.items[hi].h < target) hi += 1;
    // Process delta [cursor, hi)
    for (let i = this.cursor; i < hi; i += 1) {
      if (this.yieldEvery && i % this.yieldEvery === 0) {
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
        await new Promise((r) => setTimeout(r, 0));
        this.cancelCheck?.();
      }
      const { b } = this.items[i];
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
        // eslint-disable-next-line no-nested-ternary
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
    this.cursor = hi;

    // Build snapshot
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

    // Facets topK
    const facets = {};
    (this.cfg.facets || []).forEach((fname) => {
      const m = this.facetCounts[fname];
      const arr = Array.from(m.entries())
        .map(([value, data]) => ({ value, count: data.count, weight: data.weight }));
      arr.sort((a, b) => b.weight - a.weight);
      const k = (typeof this.cfg.topK === 'object' && this.cfg.topK)
        ? (this.cfg.topK[fname] || this.cfg.defaultTopK || 50)
        : (this.cfg.topK || this.cfg.defaultTopK || 50);
      let out = arr.slice(0, k).map((e) => ({ ...e }));
      if (phase < 1 - 1e-9) {
        const d = phase || 1e-9;
        out = out.map((o) => ({
          value: o.value,
          count: (o.count ?? 0) / d,
          weight: (o.weight ?? 0) / d,
        }));
      }
      facets[fname] = out;
    });

    const snapshot = {
      phase,
      counts: { bundlesIncluded: this.cursor },
      totals,
      approxQuantiles,
      facets,
    };
    // Scale totals for phases < 1 and add estimates
    if (phase > 0 && phase < 1) {
      snapshot.sampleTotals = snapshot.totals;
      const scaled = {};
      (this.cfg.series || []).forEach((name) => {
        const t = snapshot.sampleTotals[name] || {};
        scaled[name] = { ...t, count: (t.count ?? 0) / phase, sum: (t.sum ?? 0) / phase };
      });
      snapshot.totals = scaled;
    }
    if (phase > 0) {
      const base = snapshot.sampleTotals || snapshot.totals;
      const estimates = {};
      (this.cfg.series || []).forEach((name) => {
        const t = base[name] || {};
        estimates[name] = {
          sum: (t.sum ?? 0) / phase,
          count: (t.count ?? 0) / phase,
          mean: snapshot.totals[name]?.mean ?? t.mean,
        };
      });
      snapshot.estimates = estimates;
    }

    // Exact quantiles at 100%
    if (Math.abs(phase - 1) < PHASE_EPSILON) {
      const exact = {};
      (this.cfg.series || []).forEach((name) => {
        exact[name] = exactQuantilesFromValues(
          this.seriesAgg[name].values,
          this.cfg.quantiles || [0.5],
        );
      });
      snapshot.exactQuantiles = exact;
    }

    return snapshot;
  }
}
