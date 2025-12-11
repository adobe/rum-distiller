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

async function importSession() {
  const { createAnalysisSession } = await import('../../worker/session.js');
  return createAnalysisSession;
}

function workerUrlFromModule() {
  return new URL('../../worker/analysis.worker.js', import.meta.url);
}

describe('progressive worker', () => {
  it('streams 12/25/50/100 with approx->exact quantiles and topK facets', async () => {
    const createAnalysisSession = await importSession();
    const session = createAnalysisSession(workerUrlFromModule());
    const chunks = mkChunks();

    await session.init({
      series: ['pageViews', 'lcp'],
      facets: ['plainURL'],
      thresholds: [0.12, 0.25, 0.5, 1],
      quantiles: [0.5, 0.9],
      topK: 5,
    });
    await session.load(chunks);

    const phases = [];
    const results = [];
    const { promise } = session.computeProgressive(
      { filter: {} },
      {
        onPartial: (snap) => {
          phases.push(snap.phase);
          results.push(snap);
        },
      },
    );
    const done = await promise;
    expect(done.done).to.equal(true);
    expect(done.cancelled).to.not.equal(true);
    expect(phases).to.deep.equal([0.12, 0.25, 0.5, 1]);
    // Approx quantiles present in early phases
    expect(results[0].approxQuantiles.lcp).to.have.property(50);
    expect(results[0]).to.not.have.property('exactQuantiles');
    // Exact quantiles present at the end
    const last = results[results.length - 1];
    expect(last.exactQuantiles.lcp).to.have.property(50);
    // TopK facets
    expect(last.facets.plainURL.length).to.be.at.most(5);
    expect(last.facets.plainURL[0]).to.have.keys(['value', 'count', 'weight']);
  });

  it('cancels an in-flight computation', async () => {
    const createAnalysisSession = await importSession();
    const session = createAnalysisSession(workerUrlFromModule());
    const chunks = mkChunks();
    await session.init({
      series: ['pageViews'],
      facets: ['plainURL'],
      thresholds: [0.12, 0.25, 0.5, 1],
    });
    await session.load(chunks);

    let partials = 0;
    const req = session.computeProgressive(
      {},
      {
        onPartial: () => {
          partials += 1;
          if (partials === 1) req.cancel();
        },
      },
    );
    const done = await req.promise;
    expect(done.done).to.equal(true);
    expect(done.cancelled).to.equal(true);
    expect(partials).to.equal(1);
  });
});
