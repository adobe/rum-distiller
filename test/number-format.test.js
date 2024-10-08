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
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { roundToConfidenceInterval, samplingError } from '../stats.js';

describe('samplingError', () => {
  it('computes the sampling error', () => {
    assert.strictEqual(samplingError(60, 10), 37);
    assert.strictEqual(samplingError(600, 100), 118);
    assert.strictEqual(samplingError(300, 100), 59);
    assert.strictEqual(samplingError(30, 10), 19);
  });
});

describe('number-format', () => {
  it('uses exponents', () => {
    assert.strictEqual(roundToConfidenceInterval(100), '100');
    assert.strictEqual(roundToConfidenceInterval(1000), '1k');
    assert.strictEqual(roundToConfidenceInterval(10000), '10k');
    assert.strictEqual(roundToConfidenceInterval(100000), '100k');
    assert.strictEqual(roundToConfidenceInterval(1000000), '1m');
    assert.strictEqual(roundToConfidenceInterval(10000000), '10m');
    assert.strictEqual(roundToConfidenceInterval(100000000), '100m');
    assert.strictEqual(roundToConfidenceInterval(1000000000), '1b');
    assert.strictEqual(roundToConfidenceInterval(10000000000), '10b');
    assert.strictEqual(roundToConfidenceInterval(100000000000), '100b');
    assert.strictEqual(roundToConfidenceInterval(1000000000000), '1t');
    assert.strictEqual(roundToConfidenceInterval(10000000000000), '10t');
    assert.strictEqual(roundToConfidenceInterval(100000000000000), '100t');
    assert.strictEqual(roundToConfidenceInterval(1000000000000000), '1000t');
    assert.strictEqual(roundToConfidenceInterval(10000000000000000), '10,000t');
    assert.strictEqual(roundToConfidenceInterval(100000000000000000), '100,000t');
    assert.strictEqual(roundToConfidenceInterval(1000000000000000000), '1,000,000t');
    assert.strictEqual(roundToConfidenceInterval(10000000000000000000), '10,000,000t');
  });

  it('supports decimal places', () => {
    assert.strictEqual(roundToConfidenceInterval(1500), '1.5k');
    assert.strictEqual(roundToConfidenceInterval(15000), '15k');
    assert.strictEqual(roundToConfidenceInterval(150000), '150k');
    assert.strictEqual(roundToConfidenceInterval(1500000), '1.5m');
  });

  it('curbs precision according to sample size', () => {
    assert.strictEqual(roundToConfidenceInterval(31415, 30), '31k');
    assert.strictEqual(roundToConfidenceInterval(3141592, 300), '3.1m');
    assert.strictEqual(roundToConfidenceInterval(314159265, 3000), '310m');
    // when accuracy is getting fuzzy, we switch to fractional notation
    assert.strictEqual(roundToConfidenceInterval(3141592653, 30), '3.1b');
    assert.strictEqual(roundToConfidenceInterval(
      3141592653,
      300000,
    ), '3.142b');
    assert.strictEqual(roundToConfidenceInterval(
      3141592653,
      3000,
    ), '3.1b');
  });
});
