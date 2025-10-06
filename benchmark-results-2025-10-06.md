# Performance Benchmark Report

Generated: 2025-10-06T12:11:51.871Z

## Summary

| Benchmark | Avg (ms) | Min (ms) | Max (ms) | Median (ms) | Budget (ms) | Status |
|-----------|----------|----------|----------|-------------|-------------|--------|
| 1k_1filter | 9.09 | 3.70 | 17.29 | 4.56 | 10 | ✅ PASS |
| 1k_3filters | 9.31 | 6.15 | 13.13 | 9.41 | 15 | ✅ PASS |
| 1k_5filters | 6.90 | 4.94 | 8.00 | 7.55 | 20 | ✅ PASS |
| 10k_1filter | 29.19 | 19.00 | 55.99 | 23.85 | 50 | ✅ PASS |
| 10k_3filters | 34.25 | 32.79 | 36.34 | 34.29 | 75 | ✅ PASS |
| 10k_5filters | 33.10 | 31.77 | 34.34 | 33.39 | 100 | ✅ PASS |
| 50k_1filter | 105.53 | 98.74 | 127.65 | 100.55 | 200 | ✅ PASS |
| 50k_3filters | 174.85 | 170.82 | 185.31 | 172.73 | 300 | ✅ PASS |
| 50k_5filters | 174.60 | 164.45 | 192.84 | 171.76 | 400 | ✅ PASS |
| 10k_90%_match | 23.90 | 18.59 | 42.69 | 19.19 | 50 | ✅ PASS |
| 10k_10%_match | 23.12 | 17.59 | 42.24 | 18.39 | 50 | ✅ PASS |
| simple_userAgent | 15.30 | 7.01 | 28.86 | 9.95 | N/A | N/A |
| simple_checkpoint | 26.44 | 23.59 | 28.67 | 26.56 | N/A | N/A |
| simple_plainURL | 36.34 | 27.56 | 44.77 | 35.96 | N/A | N/A |
| complex_url | 24.95 | 22.10 | 29.02 | 24.90 | N/A | N/A |
| complex_vitals | 4.36 | 3.51 | 5.75 | 3.72 | N/A | N/A |
| complex_enterSource | 113.55 | 102.01 | 130.17 | 112.93 | N/A | N/A |
| complex_acquisitionSource | 32.95 | 24.76 | 44.50 | 30.42 | N/A | N/A |
| cached_url_3x | 0.00 | 0.00 | 0.00 | 0.00 | N/A | N/A |
| cached_vitals_3x | 0.00 | 0.00 | 0.00 | 0.00 | N/A | N/A |
| repeated_url_skewed | 36.88 | 21.27 | 89.05 | 24.79 | N/A | N/A |
| 2_groups | 1.45 | 0.72 | 2.84 | 1.07 | N/A | N/A |
| 10_groups | 1.52 | 1.01 | 2.69 | 1.09 | N/A | N/A |
| 100_groups | 1.51 | 1.07 | 1.70 | 1.64 | N/A | N/A |
| 1000_groups | 1.16 | 0.96 | 1.79 | 1.04 | N/A | N/A |
| balanced_10 | 1.19 | 0.97 | 1.66 | 1.05 | N/A | N/A |
| skewed_10 | 4.45 | 1.00 | 15.19 | 1.35 | N/A | N/A |
| by_userAgent | 4.01 | 0.85 | 15.60 | 1.05 | N/A | N/A |
| by_checkpoint | 17.16 | 11.85 | 21.27 | 18.09 | N/A | N/A |
| multikey_2 | 5.24 | 4.48 | 6.98 | 4.75 | N/A | N/A |
| multikey_3 | 23.75 | 19.01 | 30.75 | 24.79 | N/A | N/A |
| filter_group_aggregate | 32.99 | 27.88 | 49.01 | 29.74 | 150 | ✅ PASS |
| complex_pipeline | 30.21 | 28.59 | 31.35 | 30.30 | 250 | ✅ PASS |
| facets_simple | 69.60 | 62.28 | 75.38 | 69.80 | N/A | N/A |
| facets_complex | 200.93 | 181.86 | 224.64 | 197.92 | N/A | N/A |
| facets_all | 276.32 | 269.13 | 283.09 | 275.86 | N/A | N/A |
| conversion_checks | 130.58 | 103.44 | 218.98 | 110.99 | N/A | N/A |
| real_world_pipeline | 71.63 | 0.00 | 0.00 | 71.63 | N/A | N/A |