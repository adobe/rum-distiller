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

/**
 * Benchmarks for facet value extraction (targets lines 583, 666 in distiller.js)
 * Tests cache hit rates and simple vs complex facet functions
 */

import { performance } from 'perf_hooks';
import { DataChunks } from '../../distiller.js';
import { facets } from '../../facets.js';
import { generateDataset } from './data-generator.js';
import { formatResults, createPerformanceBudget } from './utils.js';

// Performance budgets (in ms)
const BUDGETS = {
  simple_10k: 50,
  complex_10k: 150,
  cached_10k: 30,
  repeated_10k: 40,
};

/**
 * Tracks cache statistics for memoized facet functions
 */
class CacheTracker {
  constructor() {
    this.hits = 0;
    this.misses = 0;
  }

  get hitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * Wraps a facet function to track cache behavior
 */
function trackCacheBehavior(facetFn, tracker) {
  const cache = new Map();

  return (bundle) => {
    const key = bundle.id;
    if (cache.has(key)) {
      tracker.hits++;
      return cache.get(key);
    }

    tracker.misses++;
    const result = facetFn(bundle);
    cache.set(key, result);
    return result;
  };
}

/**
 * Benchmark a facet extraction scenario
 */
function benchmarkFacet(name, bundles, facetName, iterations = 5) {
  const results = [];
  const tracker = new CacheTracker();

  for (let i = 0; i < iterations; i++) {
    const chunks = new DataChunks();
    chunks.addData([{ date: '2024-01-01', rumBundles: bundles }]);

    tracker.reset();
    const facetFn = trackCacheBehavior(facets[facetName], tracker);

    const start = performance.now();
    bundles.forEach((bundle) => facetFn(bundle));
    const end = performance.now();

    results.push({
      duration: end - start,
      cacheHitRate: tracker.hitRate,
      cacheHits: tracker.hits,
      cacheMisses: tracker.misses,
    });
  }

  const durations = results.map((r) => r.duration);
  const hitRates = results.map((r) => r.cacheHitRate);

  return {
    name,
    facetName,
    bundleCount: bundles.length,
    avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
    median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
    avgCacheHitRate: hitRates.reduce((a, b) => a + b, 0) / hitRates.length,
    iterations,
  };
}

/**
 * Benchmark repeated facet computation on same dataset
 */
function benchmarkRepeatedFacet(name, bundles, facetName, repetitions = 3) {
  const tracker = new CacheTracker();
  const facetFn = trackCacheBehavior(facets[facetName], tracker);

  const start = performance.now();
  for (let i = 0; i < repetitions; i++) {
    bundles.forEach((bundle) => facetFn(bundle));
  }
  const end = performance.now();

  return {
    name,
    facetName,
    bundleCount: bundles.length,
    repetitions,
    totalDuration: end - start,
    avgPerRepetition: (end - start) / repetitions,
    cacheHitRate: tracker.hitRate,
    cacheHits: tracker.hits,
    cacheMisses: tracker.misses,
  };
}

/**
 * Run all facet benchmarks
 */
export async function runFacetBenchmarks() {
  console.log('\n=== Facet Extraction Performance Benchmarks ===\n');

  const results = [];
  const dataset = generateDataset(10000, { filterSelectivity: 0.5 });

  // Simple facets (fast, minimal computation)
  console.log('Benchmarking simple facets...');

  console.log('  - userAgent facet...');
  results.push(benchmarkFacet('simple_userAgent', dataset, 'userAgent'));

  console.log('  - checkpoint facet...');
  results.push(benchmarkFacet('simple_checkpoint', dataset, 'checkpoint'));

  console.log('  - plainURL facet...');
  results.push(benchmarkFacet('simple_plainURL', dataset, 'plainURL'));

  // Complex facets (slower, more computation)
  console.log('\nBenchmarking complex facets...');

  console.log('  - url facet (with PII removal)...');
  results.push(benchmarkFacet('complex_url', dataset, 'url'));

  console.log('  - vitals facet (with scoring)...');
  results.push(benchmarkFacet('complex_vitals', dataset, 'vitals'));

  console.log('  - enterSource facet (with classification)...');
  results.push(benchmarkFacet('complex_enterSource', dataset, 'enterSource'));

  console.log('  - acquisitionSource facet...');
  results.push(benchmarkFacet('complex_acquisitionSource', dataset, 'acquisitionSource'));

  // Cache effectiveness tests
  console.log('\nBenchmarking cache effectiveness...');

  console.log('  - Repeated url computation (3x)...');
  const repeatedUrl = benchmarkRepeatedFacet('cached_url_3x', dataset, 'url', 3);
  results.push(repeatedUrl);

  console.log('  - Repeated vitals computation (3x)...');
  const repeatedVitals = benchmarkRepeatedFacet('cached_vitals_3x', dataset, 'vitals', 3);
  results.push(repeatedVitals);

  // Unique vs repeated facet values
  console.log('\nBenchmarking unique vs repeated values...');

  // Dataset with many repeated URLs (high cache hit potential)
  const repeatedDataset = generateDataset(10000, { distinctGroups: 10, skew: 0.8 });
  console.log('  - url facet on skewed dataset (80% repeated)...');
  results.push(benchmarkFacet('repeated_url_skewed', repeatedDataset, 'url'));

  // Display results
  console.log('\n' + formatResults(results));

  // Cache hit rate analysis
  console.log('\n=== Cache Hit Rate Analysis ===\n');
  results
    .filter((r) => r.avgCacheHitRate !== undefined)
    .forEach((r) => {
      console.log(`${r.name.padEnd(30)} ${(r.avgCacheHitRate * 100).toFixed(1)}%`);
    });

  // Check performance budgets
  const budgetResults = createPerformanceBudget(results, BUDGETS);
  console.log('\n' + budgetResults.summary);

  return {
    results,
    budgets: budgetResults,
  };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFacetBenchmarks().catch(console.error);
}
