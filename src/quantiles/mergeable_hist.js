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
 * MergeableHistogram: simple fixed-size linear histogram with on-the-fly
 * rebinning when the observed range expands. Designed for mergeability
 * across shards and cheap quantile approximation.
 */
/* eslint-disable max-classes-per-file, no-underscore-dangle */
export class MergeableHistogram {
  constructor(bins = 256) {
    this.bins = Math.max(16, Math.floor(bins));
    this.counts = new Float64Array(this.bins);
    this.total = 0;
    this.min = Infinity;
    this.max = -Infinity;
  }

  push(x, w = 1) {
    if (!Number.isFinite(x)) return;
    const weight = Number.isFinite(w) && w > 0 ? w : 1;
    if (x < this.min || x > this.max) {
      const newMin = Math.min(this.min, x);
      const newMax = Math.max(this.max, x);
      this._rebinTo(newMin, newMax);
    }
    const idx = this._indexOf(x);
    this.counts[idx] += weight;
    this.total += weight;
  }

  merge(other) {
    if (!other || other.total === 0) return this;
    const newMin = Math.min(this.min, other.min);
    const newMax = Math.max(this.max, other.max);
    this._rebinTo(newMin, newMax);
    // Add other's counts mapped into our bins
    if (other.total > 0 && other.counts && other.counts.length) {
      const oBins = other.counts.length;
      for (let i = 0; i < oBins; i += 1) {
        const c = other.counts[i];
        if (c === 0) continue; // eslint-disable-line no-continue
        const x0 = other._valueAtBin(i + 0.0);
        const x1 = other._valueAtBin(i + 1.0);
        // deposit at center
        const xm = (x0 + x1) / 2;
        const idx = this._indexOf(xm);
        this.counts[idx] += c;
        this.total += c;
      }
    }
    return this;
  }

  values(ps = [0.5]) {
    const out = {};
    if (this.total <= 0) {
      for (let i = 0; i < ps.length; i += 1) {
        const p = ps[i];
        out[Math.round(p * 100)] = undefined;
      }
      return out;
    }
    const sorted = [...ps].sort((a, b) => a - b);
    let j = 0;
    let acc = 0;
    for (let i = 0; i < this.bins && j < sorted.length; i += 1) {
      acc += this.counts[i];
      const q = acc / this.total;
      while (j < sorted.length && q >= sorted[j]) {
        const p = sorted[j];
        out[Math.round(p * 100)] = this._valueAtBin(i + 0.5);
        j += 1;
      }
    }
    // Fill any remaining with max
    while (j < sorted.length) {
      const p = sorted[j];
      out[Math.round(p * 100)] = this.max;
      j += 1;
    }
    return out;
  }

  /* eslint-disable no-underscore-dangle */
  _indexOf(x) {
    if (!(this.max > this.min)) return 0;
    const t = (x - this.min) / (this.max - this.min);
    const idx = Math.floor(t * this.bins);
    return Math.min(this.bins - 1, Math.max(0, idx));
  }

  _valueAtBin(binPos) {
    if (!(this.max > this.min)) return this.min;
    const t = binPos / this.bins;
    return this.min + t * (this.max - this.min);
  }

  _rebinTo(newMin, newMax) {
    if (!Number.isFinite(newMin) || !Number.isFinite(newMax)) return;
    if (newMin === Infinity && newMax === -Infinity) return;
    if (this.total === 0) {
      this.min = newMin;
      this.max = newMax;
      return;
    }
    // Map old counts into new range
    const oldCounts = this.counts;
    const oldBins = this.bins;
    const oldMin = this.min;
    const oldMax = this.max;
    this.counts = new Float64Array(this.bins);
    this.min = newMin;
    this.max = newMax;
    for (let i = 0; i < oldBins; i += 1) {
      const c = oldCounts[i];
      if (c === 0) continue; // eslint-disable-line no-continue
      const x0 = oldMin === oldMax ? oldMin : oldMin + (i / oldBins) * (oldMax - oldMin);
      const x1 = oldMin === oldMax ? oldMax : oldMin + ((i + 1) / oldBins) * (oldMax - oldMin);
      const xm = (x0 + x1) / 2;
      const idx = this._indexOf(xm);
      this.counts[idx] += c;
    }
  }
}

export class MergeableHistMulti {
  constructor(ps, bins = 256) {
    this.ps = ps;
    this.bins = bins;
    this.map = new Map();
  }

  ensure(name) {
    if (!this.map.has(name)) this.map.set(name, new MergeableHistogram(this.bins));
    return this.map.get(name);
  }

  push(name, x, w = 1) {
    this.ensure(name).push(x, w);
  }

  mergeFrom(otherMulti) {
    if (!otherMulti) return this;
    otherMulti.map.forEach((oh, name) => {
      this.ensure(name).merge(oh);
    });
    return this;
  }

  values() {
    const out = {};
    this.map.forEach((h, name) => {
      out[name] = h.values(this.ps);
    });
    return out;
  }
}
