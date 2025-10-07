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
 * Benchmarks for grouping performance (targets line 76 in distiller.js)
 * Tests varying group counts and distribution patterns
 */

import { performance } from 'perf_hooks';
import { DataChunks } from '../../distiller.js';
import { generateDataset } from './data-generator.js';
import { formatResults, createPerformanceBudget } from './utils.js';

// Performance budgets (in ms)
const BUDGETS = {
  few_groups: 30,
  some_groups: 50,
  many_groups: 100,
  massive_groups: 200,
  balanced: 50,
  skewed: 50,
};

/**
 * Benchmark a grouping scenario
 */
function benchmarkGrouping(name, bundles, groupByKey, iterations = 5) {
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const chunks = new DataChunks();
    chunks.addData([{ date: '2024-01-01', rumBundles: bundles }]);

    const start = performance.now();
    const grouped = chunks.group(groupByKey);
    const end = performance.now();

    const groupKeys = Object.keys(grouped);
    const groupSizes = groupKeys.map((key) => grouped[key].length);
    const avgGroupSize = groupSizes.reduce((a, b) => a + b, 0) / groupSizes.length;
    const minGroupSize = Math.min(...groupSizes);
    const maxGroupSize = Math.max(...groupSizes);

    results.push({
      duration: end - start,
      groupCount: groupKeys.length,
      avgGroupSize,
      minGroupSize,
      maxGroupSize,
      skew: maxGroupSize / avgGroupSize, // Distribution skew metric
    });
  }

  const durations = results.map((r) => r.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  return {
    name,
    groupByKey,
    bundleCount: bundles.length,
    groupCount: results[0].groupCount,
    avgGroupSize: results[0].avgGroupSize.toFixed(1),
    minGroupSize: results[0].minGroupSize,
    maxGroupSize: results[0].maxGroupSize,
    distributionSkew: results[0].skew.toFixed(2),
    avg: avgDuration,
    min: Math.min(...durations),
    max: Math.max(...durations),
    median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
    iterations,
  };
}

/**
 * Benchmark multi-key grouping
 */
function benchmarkMultiKeyGrouping(name, bundles, groupByKeys, iterations = 5) {
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const chunks = new DataChunks();
    chunks.addData([{ date: '2024-01-01', rumBundles: bundles }]);

    const start = performance.now();
    // Simulate multi-key grouping by creating composite keys
    const grouped = chunks.group((bundle) => {
      const keys = groupByKeys.map((key) => {
        if (key === 'url') return bundle.url;
        if (key === 'userAgent') return bundle.userAgent;
        if (key === 'checkpoint') {
          return bundle.events.map((e) => e.checkpoint).join(',');
        }
        return bundle[key] || 'unknown';
      });
      return keys.join('::');
    });
    const end = performance.now();

    results.push({
      duration: end - start,
      groupCount: Object.keys(grouped).length,
    });
  }

  const durations = results.map((r) => r.duration);

  return {
    name,
    groupByKeys: groupByKeys.join(' + '),
    bundleCount: bundles.length,
    groupCount: results[0].groupCount,
    keyCount: groupByKeys.length,
    avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
    median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
    iterations,
  };
}

/**
 * Run all grouping benchmarks
 */
export async function runGroupingBenchmarks() {
  console.log('\n=== Grouping Performance Benchmarks ===\n');

  const results = [];

  // Scenario 1: Varying group counts
  console.log('Generating datasets with varying group counts...\n');

  console.log('Benchmarking: 2 groups (few groups)...');
  const fewGroups = generateDataset(10000, { distinctGroups: 2 });
  results.push(benchmarkGrouping('2_groups', fewGroups, (bundle) => bundle.url));

  console.log('Benchmarking: 10 groups (some groups)...');
  const someGroups = generateDataset(10000, { distinctGroups: 10 });
  results.push(benchmarkGrouping('10_groups', someGroups, (bundle) => bundle.url));

  console.log('Benchmarking: 100 groups (many groups)...');
  const manyGroups = generateDataset(10000, { distinctGroups: 100 });
  results.push(benchmarkGrouping('100_groups', manyGroups, (bundle) => bundle.url));

  console.log('Benchmarking: 1000 groups (massive groups)...');
  const massiveGroups = generateDataset(10000, { distinctGroups: 1000 });
  results.push(benchmarkGrouping('1000_groups', massiveGroups, (bundle) => bundle.url));

  // Scenario 2: Distribution patterns
  console.log('\nBenchmarking distribution patterns...\n');

  console.log('Benchmarking: Balanced distribution (10 groups, no skew)...');
  const balanced = generateDataset(10000, { distinctGroups: 10, skew: 0 });
  results.push(benchmarkGrouping('balanced_10', balanced, (bundle) => bundle.url));

  console.log('Benchmarking: Skewed distribution (10 groups, 80% skew)...');
  const skewed = generateDataset(10000, { distinctGroups: 10, skew: 0.8 });
  results.push(benchmarkGrouping('skewed_10', skewed, (bundle) => bundle.url));

  // Scenario 3: Different grouping keys
  console.log('\nBenchmarking different grouping keys...\n');

  const standardDataset = generateDataset(10000, { filterSelectivity: 0.5 });

  console.log('Benchmarking: Group by userAgent...');
  results.push(benchmarkGrouping('by_userAgent', standardDataset, (bundle) => bundle.userAgent));

  console.log('Benchmarking: Group by checkpoint (array facet)...');
  results.push(benchmarkGrouping('by_checkpoint', standardDataset, (bundle) => bundle.events.map((e) => e.checkpoint).join(',')));

  // Scenario 4: Multi-key grouping
  console.log('\nBenchmarking multi-key grouping...\n');

  console.log('Benchmarking: 2-key grouping (url + userAgent)...');
  results.push(benchmarkMultiKeyGrouping(
    'multikey_2',
    standardDataset,
    ['url', 'userAgent'],
  ));

  console.log('Benchmarking: 3-key grouping (url + userAgent + checkpoint)...');
  results.push(benchmarkMultiKeyGrouping(
    'multikey_3',
    standardDataset,
    ['url', 'userAgent', 'checkpoint'],
  ));

  // Display results
  console.log('\n' + formatResults(results));

  // Distribution analysis
  console.log('\n=== Distribution Analysis ===\n');
  results
    .filter((r) => r.distributionSkew !== undefined)
    .forEach((r) => {
      const skewLevel = r.distributionSkew > 2 ? 'SKEWED' : 'BALANCED';
      console.log(`${r.name.padEnd(20)} Groups: ${String(r.groupCount).padEnd(6)} Skew: ${r.distributionSkew.padEnd(6)} [${skewLevel}]`);
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
  runGroupingBenchmarks().catch(console.error);
}
