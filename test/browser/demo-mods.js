// ESM module used by the demo to validate dynamic imports in the worker

// Custom facet: categorize by userAgent root (desktop vs mobile)
export function demoFacet(bundle) {
  const ua = String(bundle.userAgent || '');
  if (ua.startsWith('desktop')) return 'ua:desktop';
  if (ua.startsWith('mobile')) return 'ua:mobile';
  return 'ua:other';
}

// Custom series: scaled LCP (for visibility); ignore if missing
export function demoSeries(bundle) {
  const v = bundle.cwvLCP;
  if (v == null) return undefined;
  return Math.round(v / 10); // deciseconds
}

