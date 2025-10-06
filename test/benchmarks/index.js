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

/**
 * Main benchmark runner - executes all benchmark suites
 *
 * Usage:
 *   npm run benchmark                    # Run all benchmarks
 *   npm run benchmark -- --suite=filtering   # Run specific suite
 *   npm run benchmark -- --report=json   # Export results as JSON
 *   npm run benchmark -- --report=md     # Export results as Markdown
 */

import { writeFileSync } from 'fs';
import { runFilteringBenchmarks } from './filtering.bench.js';
import { runFacetBenchmarks } from './facets.bench.js';
import { runGroupingBenchmarks } from './grouping.bench.js';
import { runE2EBenchmarks } from './e2e.bench.js';
import { generateMarkdownReport, exportResultsJSON } from './utils.js';

/**
 * Parses command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const suiteArg = args.find((arg) => arg.startsWith('--suite='));
  const reportArg = args.find((arg) => arg.startsWith('--report='));

  return {
    suite: suiteArg ? suiteArg.split('=')[1] : 'all',
    report: reportArg ? reportArg.split('=')[1] : null,
  };
}

/**
 * Runs all benchmark suites
 */
async function runAllBenchmarks() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   RUM Distiller Performance Benchmark Suite                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  const allResults = {
    filtering: null,
    facets: null,
    grouping: null,
    e2e: null,
  };

  const { suite, report } = parseArgs();

  try {
    // Run requested benchmark suites
    if (suite === 'all' || suite === 'filtering') {
      allResults.filtering = await runFilteringBenchmarks();
    }

    if (suite === 'all' || suite === 'facets') {
      allResults.facets = await runFacetBenchmarks();
    }

    if (suite === 'all' || suite === 'grouping') {
      allResults.grouping = await runGroupingBenchmarks();
    }

    if (suite === 'all' || suite === 'e2e') {
      allResults.e2e = await runE2EBenchmarks();
    }

    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   Benchmark Summary                                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const suites = Object.entries(allResults).filter(([, data]) => data !== null);
    let totalBenchmarks = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    suites.forEach(([suiteName, data]) => {
      const count = data.results.length;
      const passed = data.budgets?.passes?.length || 0;
      const failed = data.budgets?.violations?.length || 0;

      totalBenchmarks += count;
      totalPassed += passed;
      totalFailed += failed;

      console.log(`${suiteName.toUpperCase()}`);
      console.log(`  Benchmarks: ${count}`);
      console.log(`  Budget checks: ${passed} passed, ${failed} failed`);
      console.log('');
    });

    console.log(`Total benchmarks: ${totalBenchmarks}`);
    console.log(`Total time: ${totalTime}s`);
    console.log(`Budget checks: ${totalPassed} passed, ${totalFailed} failed\n`);

    if (totalFailed > 0) {
      console.log('⚠️  Some benchmarks exceeded their performance budgets.');
      console.log('   Review the results above for details.\n');
    } else if (totalPassed > 0) {
      console.log('✅ All benchmarks met their performance budgets!\n');
    }

    // Export results if requested
    if (report) {
      const allBenchmarkResults = suites.flatMap(([, data]) => data.results);
      const allBudgets = {};

      suites.forEach(([suiteName, data]) => {
        data.results.forEach((result) => {
          // Try to find budget from the specific benchmark file
          const budgetKey = result.name;
          if (data.budgets?.passes?.find((p) => p.name === budgetKey)) {
            const pass = data.budgets.passes.find((p) => p.name === budgetKey);
            allBudgets[budgetKey] = pass.budget;
          } else if (data.budgets?.violations?.find((v) => v.name === budgetKey)) {
            const violation = data.budgets.violations.find((v) => v.name === budgetKey);
            allBudgets[budgetKey] = violation.budget;
          }
        });
      });

      if (report === 'json') {
        const json = exportResultsJSON(allBenchmarkResults);
        const filename = `benchmark-results-${new Date().toISOString().split('T')[0]}.json`;
        writeFileSync(filename, json);
        console.log(`📊 Results exported to: ${filename}\n`);
      } else if (report === 'md' || report === 'markdown') {
        const markdown = generateMarkdownReport(allBenchmarkResults, allBudgets);
        const filename = `benchmark-results-${new Date().toISOString().split('T')[0]}.md`;
        writeFileSync(filename, markdown);
        console.log(`📊 Results exported to: ${filename}\n`);
      }
    }

    // Exit with appropriate code
    if (totalFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Benchmark suite failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run benchmarks
runAllBenchmarks().catch((error) => {
  console.error(error);
  process.exit(1);
});
