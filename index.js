import { DataChunks } from './distiller.js';
import { tTest, zTestTwoProportions, samplingError, linearRegression, roundToConfidenceInterval } from './stats.js';
import { isKnownFacet, scoreCWV, toHumanReadable, toISOStringWithTimezone, scoreBundle, computeConversionRate, reclassifyConsent, reclassifyAcquisition, reclassifyEnter, addCalculatedProps } from './utils.js';

const utils = {
  isKnownFacet,
  scoreCWV,
  toHumanReadable,
  toISOStringWithTimezone,
  scoreBundle,
  computeConversionRate,
  reclassifyConsent,
  reclassifyAcquisition,
  reclassifyEnter,
  addCalculatedProps,
};
const stats = {
  zTestTwoProportions,
  linearRegression,
  roundToConfidenceInterval,
  tTest,
  samplingError,
};

export { DataChunks, utils, stats };