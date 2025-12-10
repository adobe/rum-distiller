#!/usr/bin/env node
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
/* eslint-disable no-console */
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import { DataChunks } from '../distiller.js';
import { facets } from '../facets.js';

function hrtime(fn, iters = 1) {
  const t0 = performance.now();
  let last;
  for (let i = 0; i < iters; i += 1) last = fn();
  const t1 = performance.now();
  return { ms: t1 - t0, last };
}

const chunks = JSON.parse(fs.readFileSync(new URL('../test/cruncher.fixture.json', import.meta.url)));

const d = new DataChunks();
d.load(chunks);

// Base facet roughly matching real usage
d.addFacet('plainURL', facets.plainURL);

// Warm up facet computation to populate caches
// eslint-disable-next-line no-unused-expressions
d.facets;

// Measure addClusterFacet and access of facets
const N = Number(process.env.BENCH_ITERS || 5);
const r1 = hrtime(() => {
  const local = new DataChunks();
  local.load(chunks);
  local.addFacet('plainURL', facets.plainURL);
  local.addClusterFacet('urlCluster', 'plainURL', { count: Math.floor(Math.log10(local.facets.plainURL.length)) });
  return local.facets.urlCluster.length;
}, N);

console.log(`addClusterFacet(urlCluster <- plainURL) x${N}: ${(r1.ms).toFixed(2)}ms (last len=${r1.last})`);
