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
 * Unit tests for the progressive engine powering the worker.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  sampleChunksAt,
  computePhaseEngine,
} from '../worker/engine.js';

function mkBundle(id, url, weight, lcp = 1200) {
  return {
    id: String(id),
    host: new URL(url).hostname,
    url,
    userAgent: 'desktop:macos',
    time: new Date(2025, 0, 1, 12, 0, id % 60).toISOString(),
    timeSlot: '2025-01-01T12:00:00Z',
    weight,
    cwvLCP: lcp,
    events: [
      { checkpoint: 'enter', source: 'https://example.com/ref' },
      { checkpoint: 'cwv-lcp', value: lcp },
    ],
  };
}

function mkChunks() {
  const urls = Array.from({ length: 20 }, (_, i) => `https://example.com/p/${i}`);
  const bundles = [];
  let id = 1;
  for (let c = 0; c < 2; c += 1) {
    const rumBundles = [];
    for (let i = 0; i < 120; i += 1) {
      const ui = (i + c * 7) % urls.length;
      const w = 1 + ((i % 5) * 2);
      const lcp = 600 + ((i * 37) % 1800);
      id += 1;
      rumBundles.push(mkBundle(id, urls[ui], w, lcp));
    }
    bundles.push({ date: '2025-01-01', rumBundles });
  }
  return bundles;
}

describe('engine: sampling tiers', () => {
  it('12% ⊂ 25% ⊂ 50% ⊂ 100%', () => {
    const chunks = mkChunks();
    const ids = (ch) => new Set(ch.flatMap((chunk) => chunk.rumBundles.map((b) => b.id)));
    const a = ids(sampleChunksAt(chunks, 0.12));
    const b = ids(sampleChunksAt(chunks, 0.25));
    const c = ids(sampleChunksAt(chunks, 0.5));
    const d = ids(sampleChunksAt(chunks, 1));
    // subset checks
    a.forEach((x) => assert.ok(b.has(x)));
    b.forEach((x) => assert.ok(c.has(x)));
    c.forEach((x) => assert.ok(d.has(x)));
    assert.ok(d.size >= c.size && c.size >= b.size && b.size >= a.size);
  });
});

describe('engine: progressive compute', () => {
  it('approx quantiles early, exact at 100%; Top-K bounded', async () => {
    const chunks = mkChunks();
    const cfg = {
      thresholds: [0.12, 0.25, 0.5, 1],
      series: ['pageViews', 'lcp'],
      facets: ['plainURL'],
      quantiles: [0.5, 0.9],
      topK: 5,
    };
    const p12 = await computePhaseEngine(chunks, cfg, 0.12, {}, { yieldEvery: 0 });
    assert.ok(p12.approxQuantiles.lcp[50] != null);
    assert.equal(p12.exactQuantiles, undefined);
    const p100 = await computePhaseEngine(chunks, cfg, 1, {}, { yieldEvery: 0 });
    assert.ok(p100.exactQuantiles.lcp[50] != null);
    assert.ok(Array.isArray(p100.facets.plainURL));
    assert.ok(p100.facets.plainURL.length <= 5);
  });

  it('Top-K contains the true heavy URLs', async () => {
    const chunks = mkChunks();
    const cfg = {
      thresholds: [1],
      series: ['pageViews'],
      facets: ['plainURL'],
      quantiles: [0.5],
      topK: 3,
    };
    // ground truth counts by URL (weight-based)
    const counts = new Map();
    chunks.forEach((chunk) => chunk.rumBundles.forEach((b) => {
      const u = new URL(b.url);
      u.search = '';
      u.hash = '';
      u.username = '';
      u.password = '';
      const key = u.toString();
      const cur = counts.get(key) || 0;
      counts.set(key, cur + (b.weight || 1));
    }));
    const truth = Array.from(counts.entries())
      .sort((x, y) => y[1] - x[1])
      .slice(0, 3)
      .map(([k]) => k);
    const p100 = await computePhaseEngine(chunks, cfg, 1, {}, { yieldEvery: 0 });
    const got = p100.facets.plainURL.slice(0, 3).map((e) => e.value);
    truth.forEach((v) => assert.ok(got.includes(v)));
  });
});
