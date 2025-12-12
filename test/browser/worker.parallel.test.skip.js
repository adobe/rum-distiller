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

function mkChunks(nChunks = 4, per = 100) {
  const urls = Array.from({ length: 20 }, (_, i) => `https://example.com/p/${i}`);
  const bundles = [];
  let id = 1;
  for (let c = 0; c < nChunks; c += 1) {
    const rumBundles = [];
    for (let i = 0; i < per; i += 1) {
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

describe('parallel streaming wrapper (orchestrator)', () => {
  it('runs shards in parallel and merges snapshots with mergeable quantiles', async () => {
    const { createStreamingDataChunks } = await import('../../worker/streaming.js');
    // Use default worker selection; wrapper will pick orchestrator when shards > 1
    const dc = createStreamingDataChunks();
    dc.shards = 3;
    dc.addDistillerSeries('pageViews');
    dc.addDistillerSeries('lcp');
    dc.addDistillerFacet('plainURL');
    dc.setThresholds(4);
    dc.prepareQuantiles(0.5, 0.9);
    dc.defaultTopK = 5;

    const results = [];
    let doneResolve;
    const doneP = new Promise((res) => { doneResolve = res; });
    dc.onSnap((snap) => {
      results.push(snap);
      if (snap.progress >= 1 - 1e-9) doneResolve();
    });

    const chunks = mkChunks(4, 120);
    dc.expectChunks = chunks.length;
    for (let i = 0; i < chunks.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await dc.load(chunks[i]);
    }
    await dc.load();
    await doneP;

    const first = results[0];
    const last = results[results.length - 1];
    expect(first.quantiles.lcp).to.have.property(50);
    expect(last.progress).to.equal(1);
    expect(last.facets.plainURL.length).to.be.at.most(5);
  });
});

