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
import { DataChunks } from './distiller.js';
import {
  tTest, zTestTwoProportions, samplingError, linearRegression, roundToConfidenceInterval,
} from './stats.js';
import {
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
} from './utils.js';

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
