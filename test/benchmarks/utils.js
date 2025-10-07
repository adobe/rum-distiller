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
 * Utility functions for benchmarking
 */

/**
 * Formats benchmark results as a table
 */
export function formatResults(results) {
  if (results.length === 0) return 'No results to display';

  const lines = ['=== Benchmark Results ===\n'];

  // Table header
  lines.push('Name'.padEnd(35) + 'Avg (ms)'.padEnd(12) + 'Min (ms)'.padEnd(12) + 'Max (ms)'.padEnd(12) + 'Median (ms)');
  lines.push('-'.repeat(85));

  // Table rows
  results.forEach((result) => {
    const name = result.name.padEnd(35);
    const avg = (result.avg || 0).toFixed(2).padEnd(12);
    const min = (result.min || 0).toFixed(2).padEnd(12);
    const max = (result.max || 0).toFixed(2).padEnd(12);
    const median = (result.median || result.avg || 0).toFixed(2);

    lines.push(`${name}${avg}${min}${max}${median}`);
  });

  return lines.join('\n');
}

/**
 * Creates a performance budget validator
 */
export function createPerformanceBudget(results, budgets) {
  const violations = [];
  const passes = [];

  results.forEach((result) => {
    const budget = budgets[result.name];
    if (budget !== undefined) {
      const avgMs = result.avg || 0;
      const withinBudget = avgMs <= budget;

      if (withinBudget) {
        passes.push({
          name: result.name,
          actual: avgMs,
          budget,
          margin: budget - avgMs,
        });
      } else {
        violations.push({
          name: result.name,
          actual: avgMs,
          budget,
          overage: avgMs - budget,
          percentage: ((avgMs - budget) / budget * 100).toFixed(1),
        });
      }
    }
  });

  const summary = ['=== Performance Budget Results ===\n'];

  if (violations.length > 0) {
    summary.push('VIOLATIONS:');
    violations.forEach((v) => {
      summary.push(
        `  ❌ ${v.name.padEnd(30)} ${v.actual.toFixed(2)}ms > ${v.budget}ms (+${v.overage.toFixed(2)}ms, +${v.percentage}%)`
      );
    });
    summary.push('');
  }

  if (passes.length > 0) {
    summary.push('PASSES:');
    passes.forEach((p) => {
      summary.push(
        `  ✅ ${p.name.padEnd(30)} ${p.actual.toFixed(2)}ms ≤ ${p.budget}ms (${p.margin.toFixed(2)}ms margin)`
      );
    });
  }

  summary.push('');
  summary.push(`Total: ${passes.length} passed, ${violations.length} failed`);

  return {
    violations,
    passes,
    summary: summary.join('\n'),
    allPassed: violations.length === 0,
  };
}

/**
 * Calculates statistics from an array of numbers
 */
export function calculateStats(values) {
  if (values.length === 0) {
    return { avg: 0, min: 0, max: 0, median: 0, p95: 0, p99: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    avg: sum / values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

/**
 * Formats duration in human-readable format
 */
export function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Generates a markdown report from benchmark results
 */
export function generateMarkdownReport(results, budgets) {
  const lines = ['# Performance Benchmark Report\n'];
  lines.push(`Generated: ${new Date().toISOString()}\n`);

  lines.push('## Summary\n');
  lines.push('| Benchmark | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Budget (ms) | Status |');
  lines.push('|-----------|----------|----------|----------|-------------|-------------|--------|');

  results.forEach((result) => {
    const budget = budgets[result.name];
    const avg = result.avg !== undefined ? result.avg : 0;
    const min = result.min !== undefined ? result.min : 0;
    const max = result.max !== undefined ? result.max : 0;
    const median = result.median !== undefined ? result.median : avg;
    const status = budget && avg <= budget ? '✅ PASS' : budget ? '❌ FAIL' : 'N/A';

    lines.push(
      `| ${result.name} | ${avg.toFixed(2)} | ${min.toFixed(2)} | ${max.toFixed(2)} | ${median.toFixed(2)} | ${budget || 'N/A'} | ${status} |`
    );
  });

  return lines.join('\n');
}

/**
 * Exports results to JSON
 */
export function exportResultsJSON(results, filename = 'benchmark-results.json') {
  const data = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalBenchmarks: results.length,
      avgDuration: results.reduce((acc, r) => acc + r.avg, 0) / results.length,
    },
  };

  return JSON.stringify(data, null, 2);
}
