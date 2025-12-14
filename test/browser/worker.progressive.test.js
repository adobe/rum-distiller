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

/* global describe, it */

import { expect } from '@esm-bundle/chai';

function mkBundle(id, url, weight, lcp = 1200) {
  return {
    id: String(id),
    host: new URL(url).hostname,
    url,
    userAgent: 'desktop:macos',
    time: new Date(2025, 0, 1, 12, 0, id % 60).toISOString(),
    timeSlot: '2025-01-01T12:00:00Z',
    weight,
    events: [
      { checkpoint: 'enter', source: 'https://example.com/ref' },
      { checkpoint: 'cwv-lcp', value: lcp },
    ],
  };
}

function mkChunks() {
  // 2 chunks, ~200 bundles, 20 URLs skewed
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

describe('streaming wrapper', () => {
  it('streams 12/25/50/100 with approx->exact quantiles and topK facets', async () => {
    const { createStreamingDataChunks } = await import('../../worker/streaming.js');
    const dc = createStreamingDataChunks(new URL('../../worker/analysis.worker.js', import.meta.url));
    dc.addDistillerSeries('pageViews');
    dc.addDistillerSeries('lcp');
    dc.addDistillerFacet('plainURL');
    dc.setThresholds(4); // [0.12,0.59,0.82,1] – final 1 guaranteed
    dc.prepareQuantiles(0.5, 0.9);
    dc.defaultTopK = 5;
    const phases = [];
    const results = [];
    let doneResolve;
    const doneP = new Promise((res) => {
      doneResolve = res;
    });
    dc.onSnap((snap) => {
      phases.push(snap.phase);
      results.push(snap);
      if (snap.progress >= 1 - 1e-9) {
        doneResolve();
      }
    });

    const chunks = mkChunks();
    dc.expectChunks = chunks.length;
    await dc.load(chunks[0]);
    await dc.load(chunks[1]);
    await dc.load(); // finalize expected count
    await doneP; // wait until auto‑progress reaches completion

    // last snap should be complete (progress = 1)
    const last = results[results.length - 1];
    expect(last.progress).to.equal(1);
    // early approx quantiles
    expect(results[0].quantiles.lcp).to.have.property(50);
    // TopK facets present
    expect(last.facets.plainURL.length).to.be.at.most(5);
    expect(last.facets.plainURL[0]).to.have.keys(['value', 'count', 'weight']);
  });
});
