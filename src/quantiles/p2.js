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
 * P² (P-squared) online quantile estimator.
 * Maintains 5 markers per quantile; low memory and fast.
 * This implementation tracks a single quantile in (0,1).
 */

/* eslint-disable max-classes-per-file */

export class P2Quantile {
  constructor(p) {
    if (!(p > 0 && p < 1)) throw new Error('p must be in (0,1)');
    this.p = p;
    this.n = 0;
    this.initial = [];
    // Marker heights (q[0..4]), positions (n_[0..4]),
    // desired positions (np[0..4]), increments (dn[0..4])
    this.q = new Array(5).fill(0);
    this.np = new Array(5).fill(0);
    this.n_ = new Array(5).fill(0);
    this.dn = [0, p / 2, p, (1 + p) / 2, 1];
  }

  push(x) {
    if (!Number.isFinite(x)) return;
    this.n += 1;
    if (this.n <= 5) {
      this.initial.push(x);
      if (this.n === 5) {
        this.initial.sort((a, b) => a - b);
        for (let i = 0; i < 5; i += 1) {
          this.q[i] = this.initial[i];
          this.n_[i] = i + 1;
        }
        this.np = [1, 1 + 2 * this.p, 1 + 4 * this.p, 3 + 2 * this.p, 5];
        this.initial = null; // Free memory; no longer needed
      }
      return;
    }

    // Find k: bucket index where x lies relative to marker heights
    let k;
    if (x < this.q[0]) {
      this.q[0] = x;
      k = 0;
    } else if (x < this.q[1]) {
      k = 0;
    } else if (x < this.q[2]) {
      k = 1;
    } else if (x < this.q[3]) {
      k = 2;
    } else if (x < this.q[4]) {
      k = 3;
    } else {
      this.q[4] = x;
      k = 3;
    }

    // Increment positions of markers k+1..4
    for (let i = k + 1; i < 5; i += 1) this.n_[i] += 1;
    // Update desired positions
    for (let i = 0; i < 5; i += 1) this.np[i] += this.dn[i];

    // Adjust marker heights 1..3
    for (let i = 1; i <= 3; i += 1) {
      const d = this.np[i] - this.n_[i];
      const cond1 = d >= 1 && this.n_[i + 1] - this.n_[i] > 1;
      const cond2 = d <= -1 && this.n_[i - 1] - this.n_[i] < -1;
      if (cond1 || cond2) {
        const s = Math.sign(d);
        const qi = this._parabolic(i, s);
        if (this.q[i - 1] < qi && qi < this.q[i + 1]) {
          this.q[i] = qi;
        } else {
          this.q[i] = this._linear(i, s);
        }
        this.n_[i] += s;
      }
    }
  }

  value() {
    if (this.n === 0) return undefined;
    if (this.n < 5) {
      const arr = [...this.initial].sort((a, b) => a - b);
      const idx = Math.floor(this.p * (arr.length - 1));
      return arr[idx];
    }
    // For n >= 5, markers are initialized and q[2] holds the p-quantile estimate
    return this.q[2];
  }

  _parabolic(i, d) {
    const qi = this.q[i];
    const qim1 = this.q[i - 1];
    const qip1 = this.q[i + 1];
    const ni = this.n_[i];
    const nim1 = this.n_[i - 1];
    const nip1 = this.n_[i + 1];
    const term1 = ((ni - nim1 + d) * (qip1 - qi)) / (nip1 - ni);
    const term2 = ((nip1 - ni - d) * (qi - qim1)) / (ni - nim1);
    return qi + (d / (nip1 - nim1)) * (term1 + term2);
  }

  _linear(i, d) {
    return this.q[i] + (d * (this.q[i + d] - this.q[i])) / (this.n_[i + d] - this.n_[i]);
  }
}

export class P2Multi {
  constructor(ps) {
    this.map = new Map(ps.map((p) => [p, new P2Quantile(p)]));
  }

  push(x) {
    this.map.forEach((q) => q.push(x));
  }

  get(p) {
    return this.map.get(p)?.value();
  }

  values() {
    const out = {};
    this.map.forEach((q, p) => {
      out[p] = q.value();
    });
    return out;
  }
}
