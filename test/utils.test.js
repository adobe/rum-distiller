import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  truncate, escapeHTML, computeConversionRate, isKnownFacet,
} from '../utils.js';

describe('escapeHTML', () => {
  it('escapes HTML entities', () => {
    assert.strictEqual(escapeHTML('<script>alert("xss")</script>'), '&#60;script&#62;alert(&#34;xss&#34;)&#60;/script&#62;');
    assert.strictEqual(escapeHTML("<script>alert('xss')</script>"), '&#60;script&#62;alert(&#39;xss&#39;)&#60;/script&#62;');
    assert.strictEqual(escapeHTML('<div>hello</div>'), '&#60;div&#62;hello&#60;/div&#62;');
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
