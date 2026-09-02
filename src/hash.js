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
 * Stable 32-bit non-cryptographic hash utilities for sampling.
 * FNV-1a is simple and fast; good enough for progressive tiering.
 */

/**
 * Compute FNV-1a 32-bit hash of a string.
 * @param {string} str
 * @returns {number} unsigned 32-bit hash
 */
export function fnv1a32(str) {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    h ^= str.charCodeAt(i);
    // FNV prime 16777619: (h * 16777619) with 32-bit overflow
    // eslint-disable-next-line no-bitwise
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  // Convert to unsigned
  // eslint-disable-next-line no-bitwise
  return h >>> 0;
}

/**
 * Map hash to [0, 1).
 * @param {string} str
 * @returns {number}
 */
export function hashToUnit(str) {
  // 2^32 = 4294967296
  return fnv1a32(str) / 4294967296;
}
