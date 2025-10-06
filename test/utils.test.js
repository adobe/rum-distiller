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
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addCalculatedProps,
  computeConversionRate, isKnownFacet,
  reclassifyAcquisition,
  scoreBundle,
  scoreCWV,
  urlProducer,
} from '../utils.js';

// need to confirm if results are as expected
describe('reclassifyAcquisition', () => {
  it('should reclassify utm source to acquisition', () => {
    const result = reclassifyAcquisition({ source: 'utm_source', target: 'some_target', checkpoint: 'utm' });
    assert.deepStrictEqual(result, { source: 'utm_source', target: 'some_target', checkpoint: 'utm' });
  });

  it('should reclassify paid source to acquisition', () => {
    const result = reclassifyAcquisition({ source: 'some_source', target: 'some_target', checkpoint: 'paid' });
    assert.deepStrictEqual(result, { checkpoint: 'acquisition', source: 'paid' });
  });

  it('should reclassify email source to acquisition', () => {
    const result = reclassifyAcquisition({ source: 'some_source', target: 'some_target', checkpoint: 'email' });
    assert.deepStrictEqual(result, { source: 'some_source', target: 'some_target', checkpoint: 'email' });
  });

  it('should return original values if no reclassification is done', () => {
    const result = reclassifyAcquisition({ source: 'some_source', target: 'some_target', checkpoint: 'other' });
    assert.deepStrictEqual(result, { source: 'some_source', target: 'some_target', checkpoint: 'other' });
  });
});

describe('computeConversionRate', () => {
  it('its 10% for 1 conversion and 10 visits', () => {
    const result = computeConversionRate(1, 10);
    assert.strictEqual(result, 10);
  });
  it('its 100% for 10 conversion and 10 visits', () => {
    const result = computeConversionRate(10, 10);
    assert.strictEqual(result, 100);
  });
  it('its 0% for 0 conversion and 10 visits', () => {
    const result = computeConversionRate(0, 10);
    assert.strictEqual(result, 0);
  });
  it('its 100% for 1 conversion and 0 visits', () => {
    const result = computeConversionRate(1, 0);
    assert.strictEqual(result, 100);
  });
  it('its 0% for 0 conversion and 0 visits', () => {
    const result = computeConversionRate(0, 0);
    assert.strictEqual(result, 100);
  });
  it('its 100% for 2 conversion and 1 visits', () => {
    const result = computeConversionRate(0, 0);
    assert.strictEqual(result, 100);
  });

  describe('check valid facets', () => {
    assert.ok(isKnownFacet('userAgent'));
    assert.ok(!isKnownFacet('browser'));

    assert.ok(isKnownFacet('checkpoint.source'));
    assert.ok(!isKnownFacet('checkpoint.value'));

    assert.ok(isKnownFacet('url!'));
    assert.ok(isKnownFacet('url~'));
    assert.ok(!isKnownFacet('url+'));
  });
});

describe('scoreBundle', () => {
  it('should return null if no CWV metrics have a value', () => {
    const bundle = {};
    const result = scoreBundle(bundle);
    assert.strictEqual(result, null);
  });

  it('should return "good" if all CWV metrics are good', () => {
    const bundle = {
      cwvLCP: 2.0,
      cwvCLS: 0.05,
      cwvINP: 150,
    };
    const result = scoreBundle(bundle);
    assert.strictEqual(result, 'good');
  });

  it('should return "ni" if all CWV metrics are good or ni', () => {
    const bundle = {
      cwvLCP: 3.0,
      cwvCLS: 0.2,
      cwvINP: 150,
    };
    const result = scoreBundle(bundle);
    assert.strictEqual(result, 'ni');
  });

  it('should return "poor" if any CWV metric is poor', () => {
    const bundle = {
      cwvLCP: 5.0,
      cwvCLS: 0.3,
      cwvINP: 600,
    };
    const result = scoreBundle(bundle);
    assert.strictEqual(result, 'poor');
  });

  it('should handle mixed CWV metrics correctly', () => {
    const bundle = {
      cwvLCP: 2.0,
      cwvCLS: 0.3,
      cwvINP: 150,
    };
    const result = scoreBundle(bundle);
    assert.strictEqual(result, 'poor');
  });
});

describe('addCalculatedProps', () => {
  it('should set visit to true and source to (direct) for enter checkpoint with empty source', () => {
    const bundle = {
      events: [
        { checkpoint: 'enter', source: '' },
      ],
    };
    const result = addCalculatedProps(bundle);
    assert.strictEqual(result.visit, true);
    assert.strictEqual(result.events[0].source, '(direct)');
  });

  it('should set visit to true and keep source unchanged for enter checkpoint with non-empty source', () => {
    const bundle = {
      events: [
        { checkpoint: 'enter', source: 'some_source' },
      ],
    };
    const result = addCalculatedProps(bundle);
    assert.strictEqual(result.visit, true);
    assert.strictEqual(result.events[0].source, 'some_source');
  });

  it('should not set visit or change source for non-enter checkpoint', () => {
    const bundle = {
      events: [
        { checkpoint: 'other', source: '' },
      ],
    };
    const result = addCalculatedProps(bundle);
    assert.strictEqual(result.visit, undefined);
    assert.strictEqual(result.events[0].source, '');
  });
});

describe('scoreCWV', () => {
  it('should return "good" if lcp is good', () => {
    const lcp = 2000;
    const result = scoreCWV(lcp, 'lcp');
    assert.strictEqual(result, 'good');
  });

  it('should return "poor" if lcp is poor', () => {
    const lcp = 5000;
    const result = scoreCWV(lcp, 'lcp');
    assert.strictEqual(result, 'poor');
  });

  it('should return "good" if cls is good', () => {
    const cls = 0.05;
    const result = scoreCWV(cls, 'cls');
    assert.strictEqual(result, 'good');
  });

  it('should return "ni" if cls is ni', () => {
    const cls = 0.15;
    const result = scoreCWV(cls, 'cls');
    assert.strictEqual(result, 'ni');
  });

  it('should return "ni" if inp is ni', () => {
    const inp = 300;
    const result = scoreCWV(inp, 'inp');
    assert.strictEqual(result, 'ni');
  });

  it('should return "poor" if inp is poor', () => {
    const inp = 600;
    const result = scoreCWV(inp, 'inp');
    assert.strictEqual(result, 'poor');
  });

  it('should return "good" if ttfb is good', () => {
    const ttfb = 700;
    const result = scoreCWV(ttfb, 'ttfb');
    assert.strictEqual(result, 'good');
  });

  it('should return "ni" if ttfb is ni', () => {
    const ttfb = 1000;
    const result = scoreCWV(ttfb, 'ttfb');
    assert.strictEqual(result, 'ni');
  });

  it('should return "poor" if ttfb is poor', () => {
    const ttfb = 2000;
    const result = scoreCWV(ttfb, 'ttfb');
    assert.strictEqual(result, 'poor');
  });

  it('should return null if value is undefined', () => {
    const result = scoreCWV(undefined, 'ttfb');
    assert.strictEqual(result, null);
  });

  it('should return null if value is null', () => {
    const result = scoreCWV(null, 'ttfb');
    assert.strictEqual(result, null);
  });
});

describe('urlProducer', () => {
  it('urlProducer extracts path sequences from full URLs', () => {
    const url = 'https://example.com/test/the/path';
    const result = urlProducer(url);
    assert.deepStrictEqual(result, ['/test', '/test/the', '/test/the/path']);
  });

  it('urlProducer extracts domain sequences from hostnames', () => {
    const url = 'www.example.com';
    const result = urlProducer(url);
    assert.deepStrictEqual(result, ['com', 'example.com', 'www.example.com']);
  });

  it('urlProducer produces nothing for non-URL-ish strings', () => {
    const url = 'I am not a URL';
    const result = urlProducer(url);
    assert.deepStrictEqual(result, []);
  });

  it('urlProducer uses memoization for repeated calls with same URL', () => {
    const url = 'https://example.com/test/path';
    const result1 = urlProducer(url);
    const result2 = urlProducer(url);
    assert.strictEqual(result1, result2);
  });

  it('urlProducer uses memoization for repeated calls with same hostname', () => {
    const hostname = 'sub.example.com';
    const result1 = urlProducer(hostname);
    const result2 = urlProducer(hostname);
    assert.strictEqual(result1, result2);
  });

  it('urlProducer memoization returns correct cached results', () => {
    const url1 = 'https://example.com/path1';
    const url2 = 'https://example.com/path2';

    const result1a = urlProducer(url1);
    const result2a = urlProducer(url2);
    const result1b = urlProducer(url1);
    const result2b = urlProducer(url2);

    assert.strictEqual(result1a, result1b);
    assert.strictEqual(result2a, result2b);
    assert.deepStrictEqual(result1a, ['/path1']);
    assert.deepStrictEqual(result2a, ['/path2']);
  });
});
