# RUM Distiller Performance Benchmark Suite

Comprehensive performance baseline and regression testing for all identified hotspots in the RUM Distiller.

## Overview

This benchmark suite provides:
- **Baseline performance metrics** for filtering, faceting, grouping, and end-to-end workflows
- **Performance budget validation** to detect regressions
- **CPU profiling integration** with flamegraph generation
- **Realistic synthetic datasets** matching production patterns

## Quick Start

```bash
# Run all benchmarks
npm run benchmark

# Run specific benchmark suite
npm run benchmark -- --suite=filtering
npm run benchmark -- --suite=facets
npm run benchmark -- --suite=grouping
npm run benchmark -- --suite=e2e

# Export results
npm run benchmark -- --report=json
npm run benchmark -- --report=md
```

## Benchmark Suites

### 1. Filtering Performance (`filtering.bench.js`)

Targets: `distiller.js:606-639`

Tests filtering performance across:
- **Dataset sizes**: 1k, 10k, 50k bundles
- **Filter counts**: 1, 3, 5, 10 active filters
- **Filter selectivity**: 10%, 50%, 90% match rates

**Performance Budgets:**
- 1k bundles, 1 filter: 10ms
- 10k bundles, 5 filters: 100ms
- 50k bundles, 5 filters: 400ms

### 2. Facet Extraction (`facets.bench.js`)

Targets: `distiller.js:583, 666`, `facets.js`

Tests facet value extraction with:
- **Simple facets**: `userAgent`, `checkpoint`, `plainURL`
- **Complex facets**: `url` (PII removal), `vitals` (scoring), `enterSource` (classification)
- **Cache hit rate tracking**
- **Repeated vs unique computations**

**Performance Budgets:**
- Simple facets, 10k bundles: 50ms
- Complex facets, 10k bundles: 150ms
- Cached operations, 10k bundles: 30ms

### 3. Grouping Performance (`grouping.bench.js`)

Targets: `distiller.js:76`

Tests grouping with:
- **Group counts**: 2, 10, 100, 1000 groups
- **Distribution patterns**: Balanced vs skewed (80% skew)
- **Grouping keys**: Single-key vs multi-key grouping

**Performance Budgets:**
- 10 groups: 50ms
- 100 groups: 100ms
- 1000 groups: 200ms

### 4. End-to-End Workflows (`e2e.bench.js`)

Tests complete pipelines:
- **Filter → Group → Aggregate**
- **Facet computation** (3-8 facets)
- **hasConversion checks** (multiple specs)
- **Real-world analytics pipeline**

**Performance Budgets:**
- Filter + Group + Aggregate: 150ms
- Facet computation (8 facets): 100ms
- Conversion checks (4 specs): 80ms
- Complex pipeline: 250ms

## Profiling

### CPU Profiling with Flamegraphs

```bash
# Profile all benchmarks (native profiler)
npm run profile

# Profile specific suite
npm run profile filtering
npm run profile facets

# Use advanced profiling tools
npm run profile -- --tool=0x        # Interactive flamegraph (requires: npm i -g 0x)
npm run profile -- --tool=clinic    # Clinic.js (requires: npm i -g clinic)
```

### Interpreting Flamegraphs

1. **Width**: Total time spent in function (including children)
2. **Color**: Different stack frames (no semantic meaning)
3. **Hot paths**: Wide bars at the top of the stack
4. **Look for**:
   - Functions with high self-time
   - Unexpected function calls
   - Deep call stacks (recursion issues)

## Performance Budgets

Performance budgets are defined per operation to catch regressions:

- **PASS** ✅: Execution time ≤ budget
- **FAIL** ❌: Execution time > budget (regression detected)

When a budget fails, the output shows:
- Actual duration vs budget
- Overage in ms and percentage
- Actionable insights for optimization

## Dataset Generation

Synthetic datasets are generated with production-like characteristics:

```javascript
import { generateDataset } from './data-generator.js';

// Generate 10k bundles with 50% filter match rate
const dataset = generateDataset(10000, {
  filterSelectivity: 0.5,  // 50% of bundles match common filters
  distinctGroups: 10,       // 10 unique URL groups
  skew: 0.3,                // 30% distribution skew
});
```

### Dataset Features

- Realistic checkpoint distributions
- Varied user agents (desktop/mobile, OS)
- CWV metrics with proper scoring
- Acquisition/conversion events
- URL patterns with PII handling

## CI Integration

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npm run benchmark -- --suite=filtering
if [ $? -ne 0 ]; then
  echo "⚠️  Performance regression detected!"
  exit 1
fi
```

### GitHub Actions

```yaml
- name: Run performance benchmarks
  run: npm run benchmark -- --report=json

- name: Upload benchmark results
  uses: actions/upload-artifact@v3
  with:
    name: benchmark-results
    path: benchmark-results-*.json
```

## Baseline Performance Report

Run benchmarks and generate a baseline report:

```bash
npm run benchmark -- --report=md > BASELINE.md
```

This creates a markdown report with:
- All benchmark results
- Performance budget status
- Timestamp for comparison

## Optimization Workflow

1. **Establish Baseline**
   ```bash
   npm run benchmark -- --report=json
   mv benchmark-results-*.json baseline.json
   ```

2. **Make Optimizations**
   - Implement performance improvements
   - Target specific hotspots identified in profiling

3. **Profile Changes**
   ```bash
   npm run profile -- --tool=0x
   ```

4. **Validate Improvements**
   ```bash
   npm run benchmark
   # Compare against baseline.json
   ```

5. **Commit if Successful**
   - Ensure all budgets pass
   - Document improvements in commit message

## Expected Outcomes

Based on the benchmark suite, optimizations should achieve:

- **50-70% total improvement** across all operations
- **Filtering**: 40-60% faster for large datasets (50k bundles)
- **Faceting**: 50-70% faster with better caching
- **Grouping**: 30-50% faster for high group counts
- **E2E pipelines**: 50-70% faster overall

## Files

```
test/benchmarks/
├── README.md              # This file
├── index.js               # Main benchmark runner
├── data-generator.js      # Synthetic dataset generation
├── utils.js               # Utilities (formatting, budgets)
├── profile.js             # CPU profiling script
├── filtering.bench.js     # Filtering benchmarks
├── facets.bench.js        # Facet extraction benchmarks
├── grouping.bench.js      # Grouping benchmarks
├── e2e.bench.js           # End-to-end workflow benchmarks
└── profiles/              # Generated profiling data
```

## Contributing

When adding new benchmarks:

1. Use the existing data generator for consistency
2. Define realistic performance budgets
3. Include multiple scenarios (best/average/worst case)
4. Document expected outcomes
5. Test with `npm run benchmark -- --suite=yourSuite`

## References

- [Node.js Performance Timing](https://nodejs.org/api/perf_hooks.html)
- [0x Flamegraph Tool](https://github.com/davidmarkclements/0x)
- [Clinic.js Performance Suite](https://clinicjs.org/)
- [Performance Budget Methodology](https://web.dev/performance-budgets-101/)
