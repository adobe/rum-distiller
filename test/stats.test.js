import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { linearRegression, zTestTwoProportions } from '../stats.js';
import { tTest, samplingError, roundToConfidenceInterval, standardNormalCDF } from '../stats.js';

describe('linearRegression', () => {
  it('should calculate the correct slope and intercept for a simple linear dataset', () => {
    const data = [1, 2, 3, 4, 5];
    const result = linearRegression(data);
    assert.strictEqual(result.slope, 1);
    assert.strictEqual(result.intercept, 1);
  });

  it('should calculate the correct slope and intercept for a dataset with a different slope', () => {
    const data = [2, 4, 6, 8, 10];
    const result = linearRegression(data);
    assert.strictEqual(result.slope, 2);
    assert.strictEqual(result.intercept, 2);
  });

  it('should calculate the correct slope and intercept for a dataset with a negative slope', () => {
    const data = [10, 8, 6, 4, 2];
    const result = linearRegression(data);
    assert.strictEqual(result.slope, -2);
    assert.strictEqual(result.intercept, 10);
  });

  it('should throw an error if the input array is empty', () => {
    assert.throws(() => {
      linearRegression([]);
    }, new Error('Array must contain at least one element.'));
  });

  it('should handle a dataset with a single element', () => {
    const data = [5];
    const result = linearRegression(data);
    assert.strictEqual(result.slope, NaN);
    assert.strictEqual(result.intercept, NaN);
  });
});

describe('standardNormalCDF', () => {
  it('handle case for input 0', () => {
    const result = standardNormalCDF(0);
    assert.strictEqual(result.toFixed(2), '0.50');
  });

  it('handle case for a positive input', () => {
    const result = standardNormalCDF(5);
    assert.strictEqual(result.toFixed(2), '1.00');
  });

  it('handle case for a negative input', () => {
    const result = standardNormalCDF(-5);
    assert.strictEqual(result.toFixed(2), '0.00');
  });
});

describe('zTestTwoProportions', () => {
  it('handle case when the proportions are equal', () => {
    const result = zTestTwoProportions(100, 50, 100, 50);
    assert.strictEqual(result, 1);
  });

  it('handle case for significantly different proportions', () => {
    const result = zTestTwoProportions(100, 90, 100, 10);
    assert(result < 1);
  });

  it('handle case for very similar proportions', () => {
    const result = zTestTwoProportions(100, 51, 100, 50);
    assert(result < 1);
  });

  it('handle case where both samples have no conversions', () => {
    const result = zTestTwoProportions(100, 0, 100, 0);
    assert.strictEqual(result, 1);
  });
});

describe('tTest', () => {
  it('handle case for identical datasets', () => {
    const left = [1, 2, 3, 4, 5];
    const right = [1, 2, 3, 4, 5];
    const result = tTest(left, right);
    assert.ok(result, 0.5);
  });

  it('handle case for significantly different datasets', () => {
    const left = [1, 2, 3, 4, 5];
    const right = [10, 20, 30, 40, 50];
    const result = tTest(left, right);
    assert.ok(result < 1);
  });

  it('handle cases where one dataset has a single element', () => {
    const left = [5];
    const right = [1, 2, 3, 4, 5];
    const result = tTest(left, right);
    assert.ok(result > 0.01 && result < 0.09);
  });

  it('handle cases where both datasets have a single element', () => {
    const left = [5];
    const right = [5];
    const result = tTest(left, right);
    assert.strictEqual(result, NaN);
  });

  it('handle cases where one dataset is empty', () => {
    assert.throws(() => {
      tTest([], [1, 2, 3, 4, 5]);
    }, new Error('Array must contain at least one element.'));
  });

  it('handle cases where both datasets are empty', () => {
    assert.throws(() => {
      tTest([], []);
    }, new Error('Array must contain at least one element.'));
  });
});

describe('samplingError', () => {
  it('should return 0 when samples are 0', () => {
    const result = samplingError(100, 0);
    assert.strictEqual(result, 0);
  });
});

describe('roundToConfidenceInterval', () => {
  it('return the total when samples are equal to total', () => {
    const result = roundToConfidenceInterval(100, 100);
    assert.strictEqual(result, '100');
  });

  it('return the total with confidence interval when samples are less than total', () => {
    const result = roundToConfidenceInterval(100, 50);
    assert.strictEqual(result, '100');
  });

  it('handle cases with maxPrecision', () => {
    const result = roundToConfidenceInterval(100, 50, 2);
    assert.strictEqual(result, '100');
  });

  it('handle cases with maxPrecision set to Infinity', () => {
    const result = roundToConfidenceInterval(100, 50, Infinity);
    assert.strictEqual(result, '100');
  });

  it('handle cases with maxPrecision set to NaN', () => {
    const result = roundToConfidenceInterval(100, 50, NaN);
    assert.strictEqual(result, '100');
  });
});