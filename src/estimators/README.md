Chao1 URL Richness Estimator
============================

Purpose
- Estimate how many distinct URLs received ≥ 1 visit in a period (“total richness”), even if sampling hides low‑traffic URLs.
- Report the “dark matter” = (estimated total − observed URLs), plus a 95% confidence interval.

Input models
1) Per‑URL sample counts (preferred): For each URL i, `m_i =` number of sampled page‑view bundles observed in the period (after filters). In RUM distiller you can get this via:
   - `DataChunks.estimators('plainURL', 'pageViews').chao1` — counts bundles where `pageViews(bundle) > 0`.
2) Per‑URL totals with ±MOE (from the explorer UI): Each row shows `(total, ±moe)` where the MOE comes from `stats.samplingError(total, samples)` with MOE = 1.96 × total / sqrt(samples). We invert this to infer `m_i`.

Estimator
- Observed richness: `sObs = #{ i : m_i > 0 }`.
- Singletons/doubletons: `f1 = #{ i : m_i = 1 }`, `f2 = #{ i : m_i = 2 }`.
- Chao1 point estimate (abundance‑based):
  - Classic (f2 > 0): `sHat = sObs + f1^2 / (2 f2)`
  - Bias‑corrected fallback (f2 = 0): `sHat = sObs + f1 (f1 − 1) / 2`
- Dark matter: `sHat − sObs`.

Uncertainty (95% CI)
- Bias‑corrected variance:
  `Var = f1(f1−1)/(2(f2+1)) + f1(2f1−1)^2/(4(f2+1)^2) + f1^2 f2 (f1−1)^2/(4(f2+1)^4)`
- Log‑normal transform on `Δ = sHat − sObs`:
  - `C = exp(z * sqrt( ln(1 + Var/Δ^2) ))`, with `z = 1.96` for 95%.
  - CI for total: `[sObs + Δ/C, sObs + CΔ]`.
  - CI for dark matter: subtract `sObs` and floor at 0.

API
- `import { chao1, chao1CI, inferSamplesFromCI, estimateDarkMatterFromCI, estimateDarkMatterFromCIWithCI, estimateSamplingRate } from './src/estimators/chao1.js'`
- Direct counts: `chao1(perUrlSamples)` and `chao1CI(perUrlSamples)`.
- From (total, ±moe): `estimateDarkMatterFromCI(rows)` and `estimateDarkMatterFromCIWithCI(rows)`.
- Site rate (diagnostic): `estimateSamplingRate(siteTotal, siteMoe)`.
- Integrated helper: `dc.estimators('plainURL', 'pageViews').chao1`

Usage examples
1) From bundles using facets and series:
```
const dc = new DataChunks();
dc.addSeries('pageViews', pageViews);
dc.addFacet('plainURL', facets.plainURL);
dc.load(chunks); // apply filters if needed
const { chao1 } = dc.estimators('plainURL', 'pageViews');
console.log(chao1.sObs, chao1.sHat, chao1.ci);
```

2) From explorer table rows:
```
const items = rows.map(r => ({ total: r.total, moe: r.moe }));
const res = estimateDarkMatterFromCIWithCI(items);
console.log(res.sObs, res.sHat, res.darkCI);
```

Notes
- The estimator is most informative when many low‑frequency URLs exist (large `f1` relative to `f2`).
- Results are conditional on the time window and any filters applied before computing the facet.
- For a full posterior or a CDF, prefer bootstrap; this module intentionally returns a point estimate and a 95% CI.

References
- Chao, A. (1984). Nonparametric estimation of the number of classes in a population. Scandinavian Journal of Statistics, 11, 265–270. https://doi.org/10.2307/4615964
- Chao, A. (1987). Estimating the population size for capture–recapture data with unequal catchability. Biometrics, 43(4), 783–791. https://doi.org/10.2307/2531532
