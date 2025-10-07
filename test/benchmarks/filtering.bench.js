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
 * Benchmarks for filtering performance (targets lines 606-639 in distiller.js)
 * Tests various dataset sizes and filter complexities
 */

import { performance } from 'perf_hooks';
import { DataChunks } from '../../distiller.js';
import { facets } from '../../facets.js';
import { generateDataset } from './data-generator.js';
import { formatResults, createPerformanceBudget } from './utils.js';

// Performance budgets (in ms)
const BUDGETS = {
  '1k_1filter': 10,
  '1k_3filters': 15,
  '1k_5filters': 20,
  '10k_1filter': 50,
  '10k_3filters': 75,
  '10k_5filters': 100,
  '50k_1filter': 200,
  '50k_3filters': 300,
  '50k_5filters': 400,
  '10k_90%_match': 50,
  '10k_10%_match': 50,
};

/**
 * Benchmark a single filtering scenario
 */
function benchmarkFilter(name, bundles, filterSpec, iterations = 5) {
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const chunks = new DataChunks();
    chunks.addData([{ date: '2024-01-01', rumBundles: bundles }]);

    // Add facet functions needed for filtering
    Object.entries(facets).forEach(([name, fn]) => {
      chunks.addFacet(name, fn);
    });

    const start = performance.now();
    chunks.filter = filterSpec;
    const filtered = chunks.filtered;
    const end = performance.now();

    results.push({
      duration: end - start,
      resultCount: filtered.length,
    });
  }

  const durations = results.map((r) => r.duration);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  const median = durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)];

  return {
    name,
    bundleCount: bundles.length,
    filterCount: Object.keys(filterSpec).length,
    matchRate: results[0].resultCount / bundles.length,
    avg,
    min,
    max,
    median,
    iterations,
  };
}

/**
 * Run all filtering benchmarks
 */
export async function runFilteringBenchmarks() {
  console.log('\n=== Filtering Performance Benchmarks ===\n');

  const results = [];

  // Scenario 1: Small dataset (1k bundles) with varying filter counts
  console.log('Generating small dataset (1k bundles)...');
  const small = generateDataset(1000, { filterSelectivity: 0.5 });

  console.log('Benchmarking: 1k bundles, 1 filter...');
  results.push(benchmarkFilter(
    '1k_1filter',
    small,
    { checkpoint: ['enter'] },
  ));

  console.log('Benchmarking: 1k bundles, 3 filters...');
  results.push(benchmarkFilter(
    '1k_3filters',
    small,
    {
      checkpoint: ['enter'],
      userAgent: ['desktop:windows', 'mobile:ios'],
      url: ['https://example.com/'],
    },
  ));

  console.log('Benchmarking: 1k bundles, 5 filters...');
  results.push(benchmarkFilter(
    '1k_5filters',
    small,
    {
      checkpoint: ['enter', 'convert'],
      userAgent: ['desktop:windows', 'mobile:ios'],
      url: ['https://example.com/'],
      vitals: ['goodLCP', 'goodCLS'],
      plainURL: ['https://example.com/'],
    },
  ));

  // Scenario 2: Medium dataset (10k bundles)
  console.log('\nGenerating medium dataset (10k bundles)...');
  const medium = generateDataset(10000, { filterSelectivity: 0.5 });

  console.log('Benchmarking: 10k bundles, 1 filter...');
  results.push(benchmarkFilter(
    '10k_1filter',
    medium,
    { checkpoint: ['enter'] },
  ));

  console.log('Benchmarking: 10k bundles, 3 filters...');
  results.push(benchmarkFilter(
    '10k_3filters',
    medium,
    {
      checkpoint: ['enter'],
      userAgent: ['desktop:windows', 'mobile:ios'],
      url: ['https://example.com/'],
    },
  ));

  console.log('Benchmarking: 10k bundles, 5 filters...');
  results.push(benchmarkFilter(
    '10k_5filters',
    medium,
    {
      checkpoint: ['enter', 'convert'],
      userAgent: ['desktop:windows', 'mobile:ios'],
      url: ['https://example.com/'],
      vitals: ['goodLCP', 'goodCLS'],
      plainURL: ['https://example.com/'],
    },
  ));

  // Scenario 3: Large dataset (50k bundles)
  console.log('\nGenerating large dataset (50k bundles)...');
  const large = generateDataset(50000, { filterSelectivity: 0.5 });

  console.log('Benchmarking: 50k bundles, 1 filter...');
  results.push(benchmarkFilter(
    '50k_1filter',
    large,
    { checkpoint: ['enter'] },
  ));

  console.log('Benchmarking: 50k bundles, 3 filters...');
  results.push(benchmarkFilter(
    '50k_3filters',
    large,
    {
      checkpoint: ['enter'],
      userAgent: ['desktop:windows', 'mobile:ios'],
      url: ['https://example.com/'],
    },
  ));

  console.log('Benchmarking: 50k bundles, 5 filters...');
  results.push(benchmarkFilter(
    '50k_5filters',
    large,
    {
      checkpoint: ['enter', 'convert'],
      userAgent: ['desktop:windows', 'mobile:ios'],
      url: ['https://example.com/'],
      vitals: ['goodLCP', 'goodCLS'],
      plainURL: ['https://example.com/'],
    },
  ));

  // Scenario 4: Filter selectivity tests (10k bundles)
  console.log('\nGenerating high-match dataset (90% match rate)...');
  const highMatch = generateDataset(10000, { filterSelectivity: 0.9 });

  console.log('Benchmarking: 10k bundles, high selectivity (90%)...');
  results.push(benchmarkFilter(
    '10k_90%_match',
    highMatch,
    { checkpoint: ['convert'] },
  ));

  console.log('\nGenerating low-match dataset (10% match rate)...');
  const lowMatch = generateDataset(10000, { filterSelectivity: 0.1 });

  console.log('Benchmarking: 10k bundles, low selectivity (10%)...');
  results.push(benchmarkFilter(
    '10k_10%_match',
    lowMatch,
    { checkpoint: ['convert'] },
  ));

  // Display results
  console.log('\n' + formatResults(results));

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
  runFilteringBenchmarks().catch(console.error);
}
