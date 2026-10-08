/*
 * Copyright 2026 Adobe. All rights reserved.
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
 * Columnar representation of facet values. Each facet function is evaluated
 * once per bundle; the results are dictionary-encoded into typed arrays (CSR layout)
 * so that filtering and grouping become integer kernels over typed arrays.
 */

/** filter modes, see `matchMode` */
export const MODE_SOME = 0;
export const MODE_NONE = 1;
export const MODE_EVERY = 2;
export const MODE_NEVER = 3;

/**
 * @param {string} combiner facet combiner ('some', 'none', 'every', 'never')
 * @returns {number} the kernel mode
 */
export function matchMode(combiner) {
  switch (combiner) {
    case 'none': return MODE_NONE;
    case 'every': return MODE_EVERY;
    case 'never': return MODE_NEVER;
    default: return MODE_SOME;
  }
}

const ARRAY_INDEX = /^(?:0|[1-9]\d*)$/;
// Object.entries() lists array-index-like keys first (ascending), then others
// in insertion order. Facet ordering must replicate this for ties in weight.
function isArrayIndex(key) {
  return ARRAY_INDEX.test(key) && Number(key) < 4294967295;
}

/**
 * Dictionary-encoded, CSR-layout facet values for all bundles.
 */
export class FacetColumn {
  /**
   * @param {object[]} bundles all bundles
   * @param {function} facetFn the facet value function
   * @param {Float64Array} weights bundle weights
   */
  constructor(bundles, facetFn, weights) {
    const n = bundles.length;
    // raw value -> value id. Map uses SameValueZero, like the Set lookups in applyFilter
    const valueIndex = new Map();
    // String(value) -> group id, like object keys in groupBundlesOptimized
    const groupIndex = new Map();
    const groupKeys = [];
    let valueGroup = new Uint32Array(64);
    let ids = new Uint32Array(Math.max(64, n * 2));
    let len = 0;
    const offsets = new Uint32Array(n + 1);
    const groupable = new Uint8Array(n);
    const scalars = [];

    const idOf = (value) => {
      let id = valueIndex.get(value);
      if (id === undefined) {
        id = valueIndex.size;
        valueIndex.set(value, id);
        const key = String(value);
        let gid = groupIndex.get(key);
        if (gid === undefined) {
          gid = groupKeys.length;
          groupIndex.set(key, gid);
          groupKeys.push(key);
        }
        if (id >= valueGroup.length) {
          const grown = new Uint32Array(valueGroup.length * 2);
          grown.set(valueGroup);
          valueGroup = grown;
        }
        valueGroup[id] = gid;
      }
      return id;
    };
    const push = (id) => {
      if (len === ids.length) {
        const grown = new Uint32Array(ids.length * 2);
        grown.set(ids);
        ids = grown;
      }
      ids[len] = id;
      len += 1;
    };

    for (let i = 0; i < n; i += 1) {
      const raw = facetFn(bundles[i]);
      if (Array.isArray(raw)) {
        groupable[i] = 1;
        for (let j = 0; j < raw.length; j += 1) {
          push(idOf(raw[j]));
        }
      } else {
        // groupBundlesOptimized skips falsy scalar keys, but filters still see [raw]
        groupable[i] = raw ? 1 : 0;
        scalars.push(i);
        push(idOf(raw));
      }
      offsets[i + 1] = len;
    }

    this.n = n;
    this.values = Array.from(valueIndex.keys());
    // facet functions that return a scalar, so that rawValue() can reproduce it
    this.scalar = new Uint8Array(n);
    scalars.forEach((i) => {
      this.scalar[i] = 1;
    });
    this.offsets = offsets;
    this.ids = ids.slice(0, len);
    this.gids = new Uint32Array(len);
    for (let j = 0; j < len; j += 1) {
      this.gids[j] = valueGroup[this.ids[j]];
    }
    this.groupable = groupable;
    this.weights = weights;
    this.valueIndex = valueIndex;
    this.groupKeys = groupKeys;
    this.groupKeyIsIndex = groupKeys.map(isArrayIndex);
    this.nValues = valueIndex.size;
    this.nGroups = groupKeys.length;
  }

  /**
   * @param {number} i bundle index
   * @returns {*} the value originally returned by the facet function (arrays are copies)
   */
  rawValue(i) {
    const start = this.offsets[i];
    if (this.scalar[i]) {
      return this.values[this.ids[start]];
    }
    const out = new Array(this.offsets[i + 1] - start);
    for (let j = 0; j < out.length; j += 1) {
      out[j] = this.values[this.ids[start + j]];
    }
    return out;
  }

  /**
   * @param {Array} desiredValues filter values
   * @returns {{flags: Uint8Array, distinct: number}} per-value-id match flags and the
   * number of distinct desired values
   */
  desiredFlags(desiredValues) {
    const flags = new Uint8Array(Math.max(1, this.nValues));
    const distinct = new Set(desiredValues);
    distinct.forEach((value) => {
      const id = this.valueIndex.get(value);
      if (id !== undefined) {
        flags[id] = 1;
      }
    });
    return { flags, distinct: distinct.size };
  }

  /**
   * Turns the output of the group kernel into ordered facet descriptors.
   * @param {Uint32Array} counts per-group entry counts
   * @param {Float64Array} wsum per-group weight sums
   * @param {Int32Array} first per-group first-occurrence sequence number
   * @returns {{key: string, gid: number, count: number, weight: number}[]} groups,
   * sorted by weight, descending
   */
  orderGroups(counts, wsum, first) {
    const indexKeys = [];
    const otherKeys = [];
    for (let g = 0; g < this.nGroups; g += 1) {
      if (counts[g] > 0) {
        (this.groupKeyIsIndex[g] ? indexKeys : otherKeys).push(g);
      }
    }
    indexKeys.sort((a, b) => Number(this.groupKeys[a]) - Number(this.groupKeys[b]));
    otherKeys.sort((a, b) => first[a] - first[b]);
    return indexKeys.concat(otherKeys)
      .map((gid) => ({
        key: this.groupKeys[gid], gid, count: counts[gid], weight: wsum[gid],
      }))
      .sort((left, right) => right.weight - left.weight);
  }

  /**
   * Materializes the bundle lists for the given groups.
   * @param {object[]} bundles all bundles
   * @param {Uint8Array} mask bundles that pass the filter
   * @param {{gid: number, count: number}[]} groups groups to materialize
   * @returns {Map<number, object[]>} gid -> bundles
   */
  materialize(bundles, mask, groups) {
    const lists = new Array(this.nGroups);
    const fill = new Uint32Array(this.nGroups);
    groups.forEach(({ gid, count }) => {
      lists[gid] = new Array(count);
    });
    const {
      offsets, gids, groupable, n,
    } = this;
    for (let i = 0; i < n; i += 1) {
      if (mask[i] && groupable[i]) {
        for (let j = offsets[i]; j < offsets[i + 1]; j += 1) {
          const g = gids[j];
          lists[g][fill[g]] = bundles[i];
          fill[g] += 1;
        }
      }
    }
    return lists;
  }
}

/**
 * Plain JavaScript implementation of the columnar kernels.
 */
export const jsKernels = {
  name: 'js',

  /**
   * @param {FacetColumn} col the column
   * @param {Uint8Array} flags per-value-id desired flags
   * @param {number} mode one of the MODE_ constants
   * @param {number} distinct number of distinct desired values
   * @returns {Uint8Array} per-bundle pass mask
   */
  match(col, flags, mode, distinct) {
    const {
      n, offsets, ids, nValues,
    } = col;
    const out = new Uint8Array(n);
    if (mode === MODE_SOME) {
      for (let i = 0; i < n; i += 1) {
        for (let j = offsets[i], end = offsets[i + 1]; j < end; j += 1) {
          if (flags[ids[j]]) {
            out[i] = 1;
            break;
          }
        }
      }
      return out;
    }
    const stamp = new Uint32Array(Math.max(1, nValues));
    for (let i = 0; i < n; i += 1) {
      const s = i + 1;
      let k = 0;
      for (let j = offsets[i], end = offsets[i + 1]; j < end; j += 1) {
        const id = ids[j];
        if (flags[id] && stamp[id] !== s) {
          stamp[id] = s;
          k += 1;
        }
      }
      if (mode === MODE_NONE) {
        out[i] = k < distinct ? 1 : 0;
      } else if (mode === MODE_EVERY) {
        out[i] = k === distinct ? 1 : 0;
      } else {
        out[i] = k === 0 ? 1 : 0;
      }
    }
    return out;
  },

  /**
   * @param {FacetColumn} col the column
   * @param {Uint8Array} mask per-bundle pass mask
   * @returns {{counts: Uint32Array, wsum: Float64Array, first: Int32Array}} group stats
   */
  group(col, mask) {
    const {
      n, offsets, gids, groupable, weights, nGroups,
    } = col;
    const counts = new Uint32Array(nGroups);
    const wsum = new Float64Array(nGroups);
    const first = new Int32Array(nGroups);
    let seq = 0;
    for (let i = 0; i < n; i += 1) {
      if (mask[i] && groupable[i]) {
        const w = weights[i];
        for (let j = offsets[i], end = offsets[i + 1]; j < end; j += 1) {
          const g = gids[j];
          if (counts[g] === 0) {
            first[g] = seq;
            seq += 1;
          }
          counts[g] += 1;
          wsum[g] += w;
        }
      }
    }
    return { counts, wsum, first };
  },

  release() {},
};
