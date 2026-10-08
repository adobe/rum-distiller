#!/usr/bin/env node
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
/* eslint-disable no-console */
// Measures the cost of the initial facet computation and of an interactive filter
// change (filtered + all facets). Set SCALE to replicate the fixture.
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import { DataChunks } from '../distiller.js';
import { facets, facetFns } from '../facets.js';

const fixture = JSON.parse(fs.readFileSync(new URL('../test/cruncher.fixture.json', import.meta.url)));
const SCALE = Number(process.env.SCALE || 20);
const chunks = [];
for (let s = 0; s < SCALE; s += 1) {
  fixture.forEach((chunk) => chunks.push({
    ...chunk,
    rumBundles: chunk.rumBundles.map((b) => ({ ...b, id: `${b.id}-${s}` })),
  }));
}

const FACETS = {
  userAgent: facets.userAgent,
  url: facets.url,
  checkpoint: facets.checkpoint,
  vitals: facets.vitals,
  lcpTarget: facets.lcpTarget,
  acquisitionSource: facets.acquisitionSource,
  enterSource: facets.enterSource,
  'click.source': facetFns.checkpointSource('click'),
};
const FILTERS = [
  { userAgent: ['desktop'] },
  { userAgent: ['desktop'], checkpoint: ['click'] },
  { 'checkpoint!': ['click'] },
  { userAgent: ['mobile'], 'vitals!': ['goodLCP'] },
  {},
  { checkpoint: ['enter', 'click'] },
];

function run() {
  const d = new DataChunks();
  d.load(chunks);
  Object.entries(FACETS).forEach(([facetName, fn]) => d.addFacet(facetName, fn, 'some', 'none'));
  let t0 = performance.now();
  // eslint-disable-next-line no-unused-expressions
  d.facets;
  const initial = performance.now() - t0;
  const R = 10;
  // warm up
  FILTERS.forEach((filter) => {
    d.filter = filter;
    // eslint-disable-next-line no-unused-expressions
    d.facets && d.filtered;
  });
  t0 = performance.now();
  for (let r = 0; r < R; r += 1) {
    FILTERS.forEach((filter) => {
      d.filter = filter;
      // eslint-disable-next-line no-unused-expressions
      d.facets && d.filtered;
    });
  }
  const perChange = (performance.now() - t0) / (R * FILTERS.length);
  console.log(`bundles=${d.bundles.length} initial facets: ${initial.toFixed(1)}ms, per filter change: ${perChange.toFixed(2)}ms`);
}

run();
