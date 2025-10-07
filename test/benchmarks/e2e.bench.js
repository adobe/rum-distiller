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
 * End-to-end workflow benchmarks
 * Tests complete pipelines combining filtering, grouping, and aggregation
 */

import { performance } from 'perf_hooks';
import { DataChunks } from '../../distiller.js';
import { facets } from '../../facets.js';
import { generateDataset } from './data-generator.js';
import { formatResults, createPerformanceBudget } from './utils.js';

// Performance budgets (in ms)
const BUDGETS = {
  filter_group_aggregate: 150,
  facet_computation: 100,
  conversion_check: 80,
  complex_pipeline: 250,
};

/**
 * Benchmark Filter → Group → Aggregate pipeline
 */
function benchmarkFilterGroupAggregate(name, bundles, filterSpec, groupBy, iterations = 5) {
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const chunks = new DataChunks();
    chunks.addData([{ date: '2024-01-01', rumBundles: bundles }]);

    // Add facet functions
    Object.entries(facets).forEach(([name, fn]) => {
      chunks.addFacet(name, fn);
    });

    const start = performance.now();

    // Filter
    chunks.filter = filterSpec;
    const filtered = chunks.filtered;

    // Group
    const grouped = {};
    filtered.forEach((bundle) => {
      const key = groupBy(bundle);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(bundle);
    });

    // Aggregate
    const aggregated = Object.entries(grouped).map(([key, group]) => {
      const sum = group.reduce((acc, b) => acc + b.weight, 0);
      const count = group.length;
      return { key, sum, count, avg: sum / count };
    });

    const end = performance.now();

    results.push({
      duration: end - start,
      filteredCount: filtered.length,
      groupCount: Object.keys(grouped).length,
      aggregateCount: aggregated.length,
    });
  }

  const durations = results.map((r) => r.duration);

  return {
    name,
    bundleCount: bundles.length,
    avgFilteredCount: results[0].filteredCount,
    avgGroupCount: results[0].groupCount,
    avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
    median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
    iterations,
  };
}

/**
 * Benchmark facet computation workflow
 */
function benchmarkFacetComputation(name, bundles, facetNames, iterations = 5) {
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const chunks = new DataChunks();
    chunks.addData([{ date: '2024-01-01', rumBundles: bundles }]);

    // Add all facet functions
    Object.entries(facets).forEach(([name, fn]) => {
      chunks.addFacet(name, fn);
    });

    const start = performance.now();

    // Compute all requested facets for all bundles
    const facetValues = bundles.map((bundle) => {
      const values = {};
      facetNames.forEach((facetName) => {
        const facetFn = chunks.facetFns[facetName];
        if (facetFn) {
          values[facetName] = facetFn(bundle);
        }
      });
      return values;
    });

    const end = performance.now();

    results.push({
      duration: end - start,
      bundleCount: bundles.length,
      facetCount: facetNames.length,
      totalComputations: facetValues.length * facetNames.length,
    });
  }

  const durations = results.map((r) => r.duration);

  return {
    name,
    bundleCount: bundles.length,
    facetCount: facetNames.length,
    totalComputations: results[0].totalComputations,
    avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
    median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
    iterations,
  };
}

/**
 * Benchmark hasConversion checks
 */
function benchmarkConversionChecks(name, bundles, conversionSpecs, iterations = 5) {
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const chunks = new DataChunks();
    chunks.addData([{ date: '2024-01-01', rumBundles: bundles }]);

    // Add facet functions
    Object.entries(facets).forEach(([name, fn]) => {
      chunks.addFacet(name, fn);
    });

    const start = performance.now();

    // Check each bundle against all conversion specs
    const conversionResults = bundles.map((bundle) => {
      const conversions = {};
      conversionSpecs.forEach(({ name: specName, spec, combiner }) => {
        conversions[specName] = chunks.hasConversion(bundle, spec, combiner);
      });
      return conversions;
    });

    const end = performance.now();

    const totalConversions = conversionResults.reduce((acc, result) => {
      return acc + Object.values(result).filter((v) => v).length;
    }, 0);

    results.push({
      duration: end - start,
      bundleCount: bundles.length,
      totalConversions,
      conversionRate: totalConversions / (bundles.length * conversionSpecs.length),
    });
  }

  const durations = results.map((r) => r.duration);

  return {
    name,
    bundleCount: bundles.length,
    conversionSpecCount: conversionSpecs.length,
    avgConversions: results[0].totalConversions,
    conversionRate: (results[0].conversionRate * 100).toFixed(1) + '%',
    avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
    median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
    iterations,
  };
}

/**
 * Run all end-to-end benchmarks
 */
export async function runE2EBenchmarks() {
  console.log('\n=== End-to-End Workflow Benchmarks ===\n');

  const results = [];
  const dataset = generateDataset(10000, { filterSelectivity: 0.5 });

  // Scenario 1: Filter → Group → Aggregate
  console.log('Benchmarking: Filter → Group → Aggregate pipeline...');
  results.push(benchmarkFilterGroupAggregate(
    'filter_group_aggregate',
    dataset,
    {
      checkpoint: ['enter'],
      userAgent: ['desktop:windows', 'desktop:mac', 'mobile:ios'],
    },
    (bundle) => bundle.url,
  ));

  console.log('Benchmarking: Complex filter → Multi-level group → Aggregate...');
  results.push(benchmarkFilterGroupAggregate(
    'complex_pipeline',
    dataset,
    {
      checkpoint: ['enter', 'convert'],
      userAgent: ['desktop:windows', 'desktop:mac', 'mobile:ios'],
      vitals: ['goodLCP', 'goodCLS', 'niLCP', 'niCLS'],
    },
    (bundle) => `${bundle.url}::${bundle.userAgent}`,
  ));

  // Scenario 2: Facet computation
  console.log('\nBenchmarking: Facet computation workflows...');

  console.log('  - Simple facets (3 facets)...');
  results.push(benchmarkFacetComputation(
    'facets_simple',
    dataset,
    ['userAgent', 'checkpoint', 'plainURL'],
  ));

  console.log('  - Complex facets (5 facets)...');
  results.push(benchmarkFacetComputation(
    'facets_complex',
    dataset,
    ['url', 'vitals', 'enterSource', 'acquisitionSource', 'checkpoint'],
  ));

  console.log('  - All facets (8 facets)...');
  results.push(benchmarkFacetComputation(
    'facets_all',
    dataset,
    ['userAgent', 'url', 'checkpoint', 'vitals', 'plainURL',
     'enterSource', 'acquisitionSource', 'mediaTarget'],
  ));

  // Scenario 3: Conversion checks
  console.log('\nBenchmarking: Conversion check workflows...');

  const conversionSpecs = [
    {
      name: 'form_submit',
      spec: { checkpoint: ['formsubmit'] },
      combiner: 'every',
    },
    {
      name: 'convert_event',
      spec: { checkpoint: ['convert'] },
      combiner: 'every',
    },
    {
      name: 'good_vitals',
      spec: { vitals: ['goodLCP', 'goodCLS', 'goodINP'] },
      combiner: 'some',
    },
    {
      name: 'desktop_convert',
      spec: {
        checkpoint: ['convert'],
        userAgent: ['desktop:windows', 'desktop:mac'],
      },
      combiner: 'every',
    },
  ];

  console.log('  - Multiple conversion specs (4 specs)...');
  results.push(benchmarkConversionChecks(
    'conversion_checks',
    dataset,
    conversionSpecs,
  ));

  // Scenario 4: Real-world analytics pipeline
  console.log('\nBenchmarking: Real-world analytics pipeline...');

  const pipelineStart = performance.now();

  const chunks = new DataChunks();
  chunks.addData([{ date: '2024-01-01', rumBundles: dataset }]);

  // Add facet functions
  Object.entries(facets).forEach(([name, fn]) => {
    chunks.addFacet(name, fn);
  });

  // Step 1: Filter for visits
  chunks.filter = { checkpoint: ['enter'] };
  const visits = chunks.filtered;

  // Step 2: Compute vitals for all visits
  visits.forEach((bundle) => {
    chunks.facetFns.vitals(bundle);
  });

  // Step 3: Check conversions
  const conversions = visits.filter((bundle) =>
    chunks.hasConversion(bundle, { checkpoint: ['convert'] }, 'every')
  );

  // Step 4: Group by URL
  const grouped = {};
  conversions.forEach((bundle) => {
    const key = bundle.url;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(bundle);
  });

  // Step 5: Compute conversion rates
  const conversionRates = Object.entries(grouped).map(([url, bundles]) => ({
    url,
    conversions: bundles.length,
    rate: bundles.length / visits.length,
  }));

  const pipelineEnd = performance.now();

  results.push({
    name: 'real_world_pipeline',
    bundleCount: dataset.length,
    visits: visits.length,
    conversions: conversions.length,
    uniqueURLs: conversionRates.length,
    avg: pipelineEnd - pipelineStart,
    iterations: 1,
  });

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
  runE2EBenchmarks().catch(console.error);
}
