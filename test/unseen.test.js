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
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  inferSamplesFromCI,
  countsOfCounts,
  chao1,
  chao1CI,
  estimateDarkMatterFromCI,
  estimateDarkMatterFromCIWithCI,
  estimateSamplingRate,
} from '../src/estimators/chao1.js';

test('inferSamplesFromCI roundtrip with stats.samplingError model', () => {
  // Choose total=100, samples=1 => MOE = 1.96 * 100 / sqrt(1) = 196
  const total = 100;
  const moe = 1.96 * (total / Math.sqrt(1));
  assert.equal(inferSamplesFromCI(total, moe), 1);

  // samples = 4 => MOE halves
  const moe4 = 1.96 * (total / Math.sqrt(4));
  assert.equal(inferSamplesFromCI(total, moe4), 4);
});

test('countsOfCounts produces expected f_k', () => {
  const f = countsOfCounts([1, 1, 2, 3, 3, 3]);
  assert.equal(f.get(1), 2);
  assert.equal(f.get(2), 1);
  assert.equal(f.get(3), 3);
});

test('chao1 estimates unseen from singletons and doubletons', () => {
  // 10 singletons, 5 doubletons => S_obs = 15
  const samples = [
    ...Array.from({ length: 10 }, () => 1),
    ...Array.from({ length: 5 }, () => 2),
  ];
  const {
    sObs, sHat, sUnseen, f1, f2,
  } = chao1(samples);
  assert.equal(sObs, 15);
  assert.equal(f1, 10);
  assert.equal(f2, 5);
  // S_hat = 15 + 10^2 / (2*5) = 15 + 100/10 = 25
  assert.equal(Math.round(sHat), 25);
  assert.equal(sUnseen, 10);
});

test('chao1 fallback when f2 = 0', () => {
  const samples = Array.from({ length: 7 }, () => 1); // 7 singletons
  const {
    sObs: sObs2, sHat: sHat2, sUnseen: sUnseen2, f1: f1b, f2: f2b,
  } = chao1(samples);
  assert.equal(sObs2, 7);
  assert.equal(f1b, 7);
  assert.equal(f2b, 0);
  // S_hat = 7 + 7*6/2 = 28
  assert.equal(sHat2, 28);
  assert.equal(sUnseen2, 21);
});

test('chao1 handles empty input', () => {
  const res = chao1([]);
  assert.equal(res.sObs, 0);
  assert.equal(res.sHat, 0);
  assert.equal(res.sUnseen, 0);
});

test('chao1CI handles empty input', () => {
  const res2 = chao1CI([]);
  assert.equal(res2.sObs, 0);
  assert.deepEqual(res2.ci, [0, 0]);
  assert.deepEqual(res2.darkCI, [0, 0]);
});

test('estimateDarkMatterFromCI maps (total, moe) -> samples -> chao1', () => {
  // Construct three URLs with implied samples [1,1,2]
  const rows = [
    { total: 100, moe: 1.96 * (100 / 1) },
    { total: 120, moe: 1.96 * (120 / 1) },
    { total: 200, moe: 1.96 * (200 / Math.sqrt(2)) },
  ];
  const res = estimateDarkMatterFromCI(rows);
  assert.deepEqual(res.samples.sort((a, b) => a - b), [1, 1, 2]);
  assert.equal(res.f1, 2);
  assert.equal(res.f2, 1);
  assert.equal(Math.round(res.sHat), 5);
  assert.equal(res.sUnseen, 2);
});

test('estimateDarkMatterFromCIWithCI returns CI fields', () => {
  const rows = [
    { total: 100, moe: 1.96 * (100 / 1) },
    { total: 120, moe: 1.96 * (120 / 1) },
    { total: 200, moe: 1.96 * (200 / Math.sqrt(2)) },
  ];
  const res3 = estimateDarkMatterFromCIWithCI(rows);
  assert.ok(Array.isArray(res3.ci));
  assert.ok(Array.isArray(res3.darkCI));
});

test('estimateSamplingRate from site aggregate', () => {
  // Site total T, samples M -> MOE = 1.96*T/sqrt(M)
  const T = 3_700_000;
  const M = 12_950; // pretend
  const moe = 1.96 * (T / Math.sqrt(M));
  const { rate, sampled } = estimateSamplingRate(T, moe);
  assert.equal(sampled, Math.round(M));
  assert.ok(Math.abs(rate - (M / T)) < 1e-6);
});

test('chao1CI returns sensible CI bounds', () => {
  // Construct a mix with many singletons and some doubletons
  const samples = [
    ...Array.from({ length: 30 }, () => 1),
    ...Array.from({ length: 10 }, () => 2),
    ...Array.from({ length: 5 }, () => 3),
  ];
  const { sHat, ci, darkCI } = chao1CI(samples);
  assert.ok(ci[0] < sHat && sHat < ci[1]);
  assert.ok(darkCI[0] >= 0 && darkCI[1] >= darkCI[0]);
});

test('chao1CI handles case with f2 = 0', () => {
  const samples = Array.from({ length: 7 }, () => 1); // only singletons
  const { ci, darkCI } = chao1CI(samples);
  assert.ok(ci[0] > 0 && ci[1] > ci[0]);
  assert.ok(darkCI[0] >= 0);
});
