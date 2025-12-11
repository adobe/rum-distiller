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
 * Weighted Space-Saving heavy hitters.
 * Maintains at most `capacity` counters, approximating top-K by weight.
 * We also track a separate occurrence `count` alongside the weighted `score`.
 */

export class SpaceSaving {
  constructor(capacity = 100) {
    if (!Number.isFinite(capacity) || capacity <= 0) throw new Error('capacity must be > 0');
    // eslint-disable-next-line no-bitwise
    this.capacity = capacity | 0;
    /** @type {Map<string, { key: string, score: number, count: number, err: number }>} */
    this.map = new Map();
  }

  size() {
    return this.map.size;
  }

  offer(key, weight = 1) {
    if (key == null) return;
    const w = Number.isFinite(weight) ? weight : 1;
    const e = this.map.get(key);
    if (e) {
      e.score += w;
      e.count += 1;
      return;
    }
    if (this.map.size < this.capacity) {
      this.map.set(key, {
        key, score: w, count: 1, err: 0,
      });
      return;
    }
    // Replace the item with minimum score
    let minKey = null;
    let minScore = Infinity;
    // A small map; O(capacity) scan is fine
    this.map.forEach((v, k) => {
      if (v.score < minScore) {
        minScore = v.score;
        minKey = k;
      }
    });
    if (minKey == null) return;
    const victim = this.map.get(minKey);
    this.map.delete(minKey);
    this.map.set(key, {
      key, score: victim.score + w, count: 1, err: victim.score,
    });
  }

  /**
   * Return current candidates sorted by `score` desc.
   * @param {number} k
   */
  top(k = 10) {
    const arr = Array.from(this.map.values());
    arr.sort((a, b) => b.score - a.score);
    return arr.slice(0, k).map((e) => ({
      key: e.key, score: e.score, count: e.count, err: e.err,
    }));
  }
}
