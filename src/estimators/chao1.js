/*
 * Copyright 2024 Adobe. All rights reserved.
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
 * Estimate the number of unobserved URLs ("dark matter") using classical
 * unseen-species estimators from abundance data.
 *
 * This module works with the sampling model used in stats.samplingError:
 *   MOE = z * (total / sqrt(samples)), with z ≈ 1.96 for 95% CI.
 *
 * From a displayed pair (total, MOE), we can infer the implied sample
 * count per URL as: samples ≈ (z * total / MOE)^2.
 */

/**
 * Infer the number of samples that produced a scaled `total` and margin of error.
 * Consistent with stats.samplingError: MOE = z * total / sqrt(samples).
 * @param {number} total The scaled total (e.g., estimated page views for the URL).
 * @param {number} moe The 95% margin of error shown next to the total.
 * @param {number} [z=1.96] Z value for confidence level (1.96 ≈ 95%).
 * @returns {number} inferred sample count (integer, >= 0)
 */
export function inferSamplesFromCI(total, moe, z = 1.96) {
  if (!Number.isFinite(total) || total <= 0) return 0;
  if (!Number.isFinite(moe) || moe <= 0) return 0;
  const s = (z * total) / moe;
  const samples = Math.round(s * s);
  return Number.isFinite(samples) && samples > 0 ? samples : 0;
}

/**
 * Build frequency-of-frequencies f_k from per-URL sample counts.
 * @param {number[]} samples Per-URL sample counts (m_i), m_i >= 1 for observed URLs.
 * @returns {Map<number, number>} map of k -> f_k (# of URLs with m = k)
 */
export function countsOfCounts(samples) {
  const f = new Map();
  for (const m of samples) {
    if (!Number.isFinite(m) || m <= 0) continue; // eslint-disable-line no-continue
    const k = Math.trunc(m);
    f.set(k, (f.get(k) || 0) + 1);
  }
  return f;
}

/**
 * Chao1 (abundance-based) estimator for total richness.
 * Uses singletons (f1) and doubletons (f2) from the observed sample counts.
 * - If f2 > 0: S_hat = S_obs + f1^2 / (2 f2)
 * - If f2 = 0: bias-corrected fallback S_hat = S_obs + f1 * (f1 - 1) / 2
 * @param {number[]} perUrlSamples Per-URL sample counts (m_i), m_i >= 1.
 * @returns {{sObs:number,sHat:number,sUnseen:number,f1:number,f2:number}}
 */
export function chao1(perUrlSamples) {
  const sObs = perUrlSamples.filter((m) => Number.isFinite(m) && m > 0).length;
  if (sObs === 0) {
    return {
      sObs: 0, sHat: 0, sUnseen: 0, f1: 0, f2: 0,
    };
  }
  const f = countsOfCounts(perUrlSamples);
  const f1 = f.get(1) || 0;
  const f2 = f.get(2) || 0;

  let sHat;
  if (f2 > 0) {
    sHat = sObs + ((f1 * f1) / (2 * f2));
  } else {
    // Bias-corrected fallback when no doubletons were observed.
    sHat = sObs + (f1 * (f1 - 1)) / 2;
  }
  const sUnseen = Math.max(0, Math.round(sHat - sObs));
  return {
    sObs, sHat, sUnseen, f1, f2,
  };
}

/**
 * Compute a 95% confidence interval for Chao1 via the standard
 * log-normal transform on the "excess" Δ = Ŝ − S_obs.
 * Uses the bias-corrected variance estimator (stable even when f2=0).
 * @param {number[]} perUrlSamples Per-URL sample counts (m_i), m_i >= 1.
 * @param {number} [z=1.96] z-score for the confidence level.
 * @returns {object} Chao1 estimate with fields:
 * - sObs, sHat, sUnseen, f1, f2
 * - variance, ci [lower, upper], darkCI [lower, upper]
 */
export function chao1CI(perUrlSamples, z = 1.96) {
  const {
    sObs, sHat, f1, f2, sUnseen,
  } = chao1(perUrlSamples);
  if (sObs === 0) {
    return {
      sObs,
      sHat,
      sUnseen,
      f1,
      f2,
      variance: 0,
      ci: [0, 0],
      darkCI: [0, 0],
    };
  }
  // Bias-corrected components
  const deltaBC = (f1 * (f1 - 1)) / (2 * (f2 + 1));
  // Variance estimator (bias-corrected, works for all f2)
  const variance = (f1 * (f1 - 1)) / (2 * (f2 + 1))
    + (f1 * ((2 * f1) - 1) ** 2) / (4 * (f2 + 1) ** 2)
    + ((f1 ** 2) * f2 * (f1 - 1) ** 2) / (4 * (f2 + 1) ** 4);

  // Use log-normal interval on Δ; ensure positivity
  const delta = Math.max(Number.EPSILON, sHat - sObs);
  const C = Math.exp(z * Math.sqrt(Math.log(1 + (variance / (delta ** 2)))));
  const lower = sObs + (delta / C);
  const upper = sObs + (C * delta);
  const darkLower = Math.max(0, lower - sObs);
  const darkUpper = Math.max(0, upper - sObs);
  return {
    sObs,
    sHat,
    sUnseen,
    f1,
    f2,
    variance,
    ci: [lower, upper],
    darkCI: [darkLower, darkUpper],
    // expose deltaBC for reference/debugging
    deltaBC,
  };
}

/**
 * Convenience: estimate unseen URLs from displayed (total, MOE) pairs.
 * @param {{total:number, moe:number}[]} items Array of per-URL entries that appear in the table.
 * @returns {{sObs:number,sHat:number,sUnseen:number,f1:number,f2:number,samples:number[]}}
 */
export function estimateDarkMatterFromCI(items) {
  const samples = items
    .map(({ total, moe }) => inferSamplesFromCI(total, moe))
    .filter((m) => m > 0);
  const est = chao1(samples);
  return { ...est, samples };
}

/**
 * Convenience: same as estimateDarkMatterFromCI, but also returns a CI.
 * @param {{total:number, moe:number}[]} items
 * @param {number} [z=1.96]
 * @returns {object} Chao1 estimate (with CI) plus samples array
 */
export function estimateDarkMatterFromCIWithCI(items, z = 1.96) {
  const samples = items
    .map(({ total, moe }) => inferSamplesFromCI(total, moe))
    .filter((m) => m > 0);
  const est = chao1CI(samples, z);
  return { ...est, samples };
}

/**
 * Optionally estimate an overall sampling rate from an aggregate site row.
 * Given site-wide total and MOE, infer total sampled hits and divide by total.
 * @param {number} siteTotal Total page views shown for the site.
 * @param {number} siteMoe Margin of error for the site total.
 * @param {number} [z=1.96] Z for the CI.
 * @returns {{rate:number, sampled:number}} estimated sampling probability and sampled hits.
 */
export function estimateSamplingRate(siteTotal, siteMoe, z = 1.96) {
  const sampled = inferSamplesFromCI(siteTotal, siteMoe, z);
  const rate = sampled > 0 && siteTotal > 0 ? sampled / siteTotal : 0;
  return { rate, sampled };
}
