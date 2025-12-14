/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

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
