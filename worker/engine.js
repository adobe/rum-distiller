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
 * Progressive analysis engine used by the web worker and unit tests (Node).
 * Pure ESM without DOM globals.
 */

import { DataChunks } from '../distiller.js';
import * as seriesMod from '../series.js';
import { facets as builtInFacets } from '../facets.js';
import { hashToUnit } from '../src/hash.js';
import { P2Multi } from '../src/quantiles/p2.js';
import { SpaceSaving } from '../src/topk/space_saving.js';

/** Tolerance for floating-point comparison when checking threshold === 1 */
export const PHASE_EPSILON = 1e-9;
/** Default number of membership bins used by streaming runs */
export const DEFAULT_BINS = 1024;
/** Default interval for auto-advancing streaming phase (ms) */
export const AUTO_ADVANCE_INTERVAL_MS = 140;

export function keyForBundle(bundle) {
  const id = bundle.id ?? '';
  const t = bundle.time ?? '';
  const u = bundle.url ?? '';
  return `${id}|${t}|${u}`;
}

export function membership(bundle) {
  return hashToUnit(keyForBundle(bundle));
}

export function sampleChunksAt(loadedChunks, threshold) {
  const out = new Array(loadedChunks.length);
  for (let i = 0; i < loadedChunks.length; i += 1) {
    const chunk = loadedChunks[i];
    const sub = [];
    const src = chunk.rumBundles || [];
    for (let j = 0; j < src.length; j += 1) {
      const b = src[j];
      if (membership(b) < threshold) sub.push(b);
    }
    out[i] = { date: chunk.date, rumBundles: sub };
  }
  return out;
}

export async function scanTotalsAndQuantiles(
  bundles,
  seriesNames,
  quantilePs,
  { yieldEvery = 0, cancelCheck } = {},
) {
  const totals = Object.fromEntries(seriesNames.map((n) => [n, {
    count: 0, sum: 0, min: Infinity, max: -Infinity,
  }]));
  const q = Object.fromEntries(seriesNames.map((n) => [n, new P2Multi(quantilePs)]));
  for (let i = 0; i < bundles.length; i += 1) {
    if (yieldEvery && i % yieldEvery === 0) {
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
      await new Promise((r) => setTimeout(r, 0));
      cancelCheck?.();
    }
    const b = bundles[i];
    for (let k = 0; k < seriesNames.length; k += 1) {
      const name = seriesNames[k];
      const v = seriesMod[name](b);
      if (v === undefined || v === null) continue; // eslint-disable-line no-continue
      const t = totals[name];
      t.count += 1;
      t.sum += v;
      if (v < t.min) t.min = v;
      if (v > t.max) t.max = v;
      q[name].push(v);
    }
  }
  const outTotals = {};
  const outQuantiles = {};
  seriesNames.forEach((name) => {
    const t = totals[name];
    const mean = t.count > 0 ? t.sum / t.count : 0;
    outTotals[name] = {
      count: t.count,
      sum: t.sum,
      min: Number.isFinite(t.min) ? t.min : 0,
      max: Number.isFinite(t.max) ? t.max : 0,
      mean,
    };
    const vals = q[name].values();
    const qMap = {};
    quantilePs.forEach((p) => {
      qMap[Math.round(p * 100)] = vals[p];
    });
    outQuantiles[name] = qMap;
  });
  return { totals: outTotals, quantiles: outQuantiles };
}

export function exactQuantilesFromValues(arr, ps) {
  if (!arr.length) return Object.fromEntries(ps.map((p) => [Math.round(p * 100), undefined]));
  const a = [...arr].sort((x, y) => x - y);
  const out = {};
  for (let i = 0; i < ps.length; i += 1) {
    const p = ps[i];
    const idx = Math.floor(p * (a.length - 1));
    out[Math.round(p * 100)] = a[idx];
  }
  return out;
}

export async function computePhaseEngine(
  loadedChunks,
  config,
  threshold,
  filterSpec = {},
  { yieldEvery = 0, cancelCheck } = {},
) {
  const sampled = sampleChunksAt(loadedChunks, threshold);
  const dc = new DataChunks();
  dc.load(sampled);
  const seriesFns = { ...seriesMod, ...(config.customSeries || {}) };
  const facetFns = { ...builtInFacets, ...(config.customFacets || {}) };
  (config.series || []).forEach((name) => {
    const fn = seriesFns[name];
    if (typeof fn === 'function') dc.addSeries(name, fn);
  });
  (config.facets || []).forEach((name) => {
    const fn = facetFns[name];
    if (typeof fn === 'function') dc.addFacet(name, fn);
  });
  if (filterSpec) dc.filter = filterSpec;

  const bundles = dc.filtered;
  const { totals, quantiles } = await scanTotalsAndQuantiles(
    bundles,
    config.series,
    config.quantiles,
    { yieldEvery, cancelCheck },
  );

  // Streaming Top-K with refinement
  const facets = {};
  const names = config.facets || [];
  const capacity = Math.max((config.topK || 50) * 8, (config.topK || 50) + 5);
  const hh = Object.fromEntries(names.map((n) => [n, new SpaceSaving(capacity)]));
  for (let i = 0; i < bundles.length; i += 1) {
    if (yieldEvery && i % yieldEvery === 0) {
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
      await new Promise((r) => setTimeout(r, 0));
      cancelCheck?.();
    }
    const b = bundles[i];
    for (let f = 0; f < names.length; f += 1) {
      const name = names[f];
      const fn = facetFns[name];
      if (!fn) continue; // eslint-disable-line no-continue
      const vals = fn(b);
      // eslint-disable-next-line no-nested-ternary
      const arr = Array.isArray(vals) ? vals : (vals ? [vals] : []);
      for (let j = 0; j < arr.length; j += 1) hh[name].offer(arr[j], b.weight || 1);
    }
  }
  for (let f = 0; f < names.length; f += 1) {
    const name = names[f];
    const fn = builtInFacets[name];
    if (!fn) continue; // eslint-disable-line no-continue
    const candidates = new Set(hh[name].top(config.topK).map((e) => e.key));
    const counts = new Map();
    for (let i = 0; i < bundles.length; i += 1) {
      if (yieldEvery && i % yieldEvery === 0) {
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
        await new Promise((r) => setTimeout(r, 0));
        cancelCheck?.();
      }
      const b = bundles[i];
      const vals = fn(b);
      // eslint-disable-next-line no-nested-ternary
      const arr = Array.isArray(vals) ? vals : (vals ? [vals] : []);
      for (let j = 0; j < arr.length; j += 1) {
        const v = arr[j];
        if (!candidates.has(v)) continue; // eslint-disable-line no-continue
        const cur = counts.get(v) || { count: 0, weight: 0 };
        cur.count += 1;
        cur.weight += (b.weight || 1);
        counts.set(v, cur);
      }
    }
    const k = (typeof config.topK === 'object' && config.topK)
      ? (config.topK[name] || config.defaultTopK || 50)
      : (config.topK || config.defaultTopK || 50);
    const top = Array.from(counts.entries())
      .map(([value, data]) => ({ value, count: data.count, weight: data.weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, k);
    if (threshold < 1 - PHASE_EPSILON) {
      const d = threshold || PHASE_EPSILON;
      for (let i = 0; i < top.length; i += 1) {
        const o = top[i];
        top[i] = { value: o.value, count: (o.count ?? 0) / d, weight: (o.weight ?? 0) / d };
      }
    }
    facets[name] = top;
  }

  const payload = {
    phase: threshold,
    counts: { bundlesIncluded: bundles.length },
    totals,
    approxQuantiles: quantiles,
    facets,
  };
  // For phases < 1, provide converging estimates and replace totals' count/sum.
  if (threshold > 0 && threshold < 1) {
    const sampleTotals = payload.totals;
    const scaledTotals = {};
    (config.series || []).forEach((name) => {
      const t = sampleTotals[name] || {};
      scaledTotals[name] = {
        ...t,
        count: (t.count ?? 0) / threshold,
        sum: (t.sum ?? 0) / threshold,
      };
    });
    payload.sampleTotals = sampleTotals;
    payload.totals = scaledTotals;
  }
  // Add explicit estimates (sum/count/mean) for convenience.
  if (threshold > 0) {
    const estimates = {};
    const base = (payload.sampleTotals || payload.totals) || {};
    (config.series || []).forEach((name) => {
      const t = base[name] || {};
      estimates[name] = {
        sum: (t.sum ?? 0) / threshold,
        count: (t.count ?? 0) / threshold,
        mean: (payload.totals[name]?.mean ?? t.mean),
      };
    });
    payload.estimates = estimates;
  }
  // Attach estimated weights/counts for facets
  if (threshold > 0) {
    Object.keys(payload.facets || {}).forEach((fname) => {
      payload.facets[fname] = (payload.facets[fname] || []).map((e) => ({
        ...e,
        estWeight: (e.weight ?? 0) / threshold,
        estCount: (e.count ?? 0) / threshold,
      }));
    });
  }
  if (Math.abs(threshold - 1) < PHASE_EPSILON) {
    const exact = {};
    const values = Object.fromEntries((config.series || []).map((n) => [n, []]));
    for (let i = 0; i < bundles.length; i += 1) {
      if (yieldEvery && i % yieldEvery === 0) {
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
        await new Promise((r) => setTimeout(r, 0));
        cancelCheck?.();
      }
      const b = bundles[i];
      for (let k = 0; k < (config.series || []).length; k += 1) {
        const name = config.series[k];
        const v = seriesMod[name](b);
        if (v === undefined || v === null) continue; // eslint-disable-line no-continue
        values[name].push(v);
      }
    }
    (config.series || []).forEach((name) => {
      exact[name] = exactQuantilesFromValues(values[name], config.quantiles || [0.5]);
    });
    payload.exactQuantiles = exact;
  }
  return payload;
}
