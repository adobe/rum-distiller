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
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeConversionRate, isKnownFacet, toISOStringWithTimezone, scoreBundle, reclassifyAcquisition, addCalculatedProps,
} from '../utils.js';

// need to confirm if results are as expected
describe('reclassifyAcquisition', () => {
  it('should reclassify utm source to acquisition', () => {
    const result = reclassifyAcquisition({ source: 'utm_source', target: 'some_target', checkpoint: 'utm' });
    assert.deepStrictEqual(result, { source: 'utm_source', target:'some_target', checkpoint: 'utm' });
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

const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;

describe('toISOStringWithTimezone', () => {
  before(() => {
    // Mock the timezone offset to +05:30 (330 minutes)
    Date.prototype.getTimezoneOffset = () => -330;
  });

  after(() => {
    // Restore the original getTimezoneOffset method
    Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
  });

  it('should format date with timezone offset correctly', () => {
    const date = new Date('2024-01-01T12:00:00Z');
    const result = toISOStringWithTimezone(date);
    assert.strictEqual(result, '2024-01-01T17:30:00+05:30');
  });

  it('should handle positive timezone offsets', () => {
    const date = new Date('2024-01-01T12:00:00+05:30');
    const result = toISOStringWithTimezone(date);
    assert.strictEqual(result, '2024-01-01T12:00:00+05:30');
  });

  it('should handle negative timezone offsets', () => {
    const date = new Date('2024-01-01T12:00:00-04:00');
    const result = toISOStringWithTimezone(date);
    assert.strictEqual(result, '2024-01-01T21:30:00+05:30');
  });

  it('should pad single digit month, day, hour, minute, and second', () => {
    const date = new Date(2024, 2, 5, 7, 8, 9);
    const result = toISOStringWithTimezone(date);
    assert.strictEqual(result, '2024-03-05T12:38:09+05:30');
  });
});

// need to check coverage for ttfb
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

describe('reClassifyEnter', () => {
  // need to confirm functionality before addressing this
});