/* a minimalistic stats library */

/**
 * @typedef Line
 * @type {Object}
 * @property {number} slope the slope of the linear function,
 * i.e. increase of y for every increase of x
 * @property {number} intercept the intercept of the linear function,
 * i.e. the value of y for x equals zero
 */
/**
 * Peform a linear ordinary squares regression against an array.
 * This regression takes the array index as the independent variable
 * and the data in the array as the dependent variable.
 * @param {number[]} data an array of input data
 * @returns {Line} the slope and intercept of the regression function
 */
export function linearRegression(data) {
  const { length: n } = data;

  if (n === 0) {
    throw new Error('Array must contain at least one element.');
  }

  // Calculate sumX and sumX2 using Gauss's formulas
  const sumX = ((n - 1) * n) / 2;
  const sumX2 = ((n - 1) * n * (2 * n - 1)) / 6;

  // Calculate sumY and sumXY using reduce with destructuring
  const { sumY, sumXY } = data.reduce((acc, y, x) => {
    acc.sumY += y;
    acc.sumXY += x * y;
    return acc;
  }, { sumY: 0, sumXY: 0 });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}


function standardNormalCDF(x) {
  // Approximation of the standard normal CDF using the Hastings algorithm
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob = d * t * (0.3193815
    + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  if (x > 0) {
    return 1 - prob;
  }
  return prob;
}

function getZTestPValue(Z) {
  // Approximate the p-value using the standard normal distribution
  // This is a simplified approximation and may not be as accurate as using a
  // Z-table or more advanced methods
  const absZ = Math.abs(Z);
  const pValue = 2 * (1 - standardNormalCDF(absZ));
  return pValue;
}

/**
 * Performs a Z Test between two proportions. This test assumes that the data
 * is normally distributed and will calculate the p-value for the difference
 * between the two proportions.
 * @param {number} sample1 the sample size of the first group (e.g. total number of visitors)
 * @param {number} conversions1 the number of conversions in the first group
 * @param {number} sample2 the sample size of the second group
 * @param {number} conversions2 the number of conversions in the second group
 * @returns {number} the p-value, a value between 0 and 1
 */
export function zTestTwoProportions(sample1, conversions1, sample2, conversions2) {
  // Calculate the conversion rates
  const p1 = conversions1 / sample1;
  const p2 = conversions2 / sample2;

  if (p1 === p2) {
    return 1;
  }

  // Calculate the pooled proportion
  const p = (conversions1 + conversions2) / (sample1 + sample2);

  // Calculate the standard error
  const SE = Math.sqrt(p * (1 - p) * (1 / sample1 + 1 / sample2));

  // Calculate the Z-score
  const Z = (p1 - p2) / SE;

  // Calculate the p-value
  return getZTestPValue(Z);
}

/**
 * The error function, also known as the Gauss error function.
 * @param {number} x the value to calculate the error function for
 */
function erf(x1) {
  // save the sign of x
  const sign = x1 >= 0 ? 1 : -1;
  const x = Math.abs(x1);

  // constants
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  // A&S formula 7.1.26
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}
/**
 * @typedef {Object} MeanVariance
 * @property {number} mean - the mean of a dataset
 * @property {number} variance - the variance of a dataset
 */
/**
 * Calculate mean and variance of a dataset.
 * @param {number[]} data - the input data
 * @returns {MeanVariance} mean and variance of the input dataset
 */
function calcMeanVariance(data) {
  let sum = 0;
  let variance = 0;

  // Calculate sum
  for (let i = 0; i < data.length; i += 1) {
    sum += data[i];
  }

  const mean = sum / data.length;

  // Calculate variance
  for (let i = 0; i < data.length; i += 1) {
    variance += (data[i] - mean) ** 2;
  }

  variance /= data.length;

  return { mean, variance };
}
/**
 * Performs a significance test on the data. The test assumes
 * that the data is normally distributed and will calculate
 * the p-value for the difference between the two data sets.
 * @param {number[]} left the first data set
 * @param {number[]} right the second data set
 * @returns {number} the p-value, a value between 0 and 1
 */
export function tTest(left, right) {
  const { mean: meanLeft, variance: varianceLeft } = calcMeanVariance(left);
  const { mean: meanRight, variance: varianceRight } = calcMeanVariance(right);
  const pooledVariance = (varianceLeft + varianceRight) / 2;
  const tValue = (meanLeft - meanRight) / Math
    .sqrt(pooledVariance * (1 / left.length + 1 / right.length));
  const p = 1 - (0.5 + 0.5 * erf(tValue / Math.sqrt(2)));
  return p;
}

