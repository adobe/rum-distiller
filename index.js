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
  pageViews,
  visits,
  bounces,
  organic,
  earned,
  lcp,
  cls,
  inp,
  ttfb,
  engagement,
} from './series.js';
import {
  isKnownFacet,
  scoreCWV,
  toHumanReadable,
  scoreBundle,
  computeConversionRate,
  reclassifyConsent,
  reclassifyAcquisition,
  addCalculatedProps,
} from './utils.js';
import { facets, facetFns } from './facets.js';
import { classifyAcquisition } from './acquisition.js';

const utils = {
  isKnownFacet,
  scoreCWV,
  toHumanReadable,
  scoreBundle,
  computeConversionRate,
  reclassifyConsent,
  reclassifyAcquisition,
  addCalculatedProps,
  classifyAcquisition,
};
const stats = {
  zTestTwoProportions,
  linearRegression,
  roundToConfidenceInterval,
  tTest,
  samplingError,
};

const series = {
  pageViews,
  visits,
  bounces,
  organic,
  earned,
  lcp,
  cls,
  inp,
  ttfb,
  engagement,
};

export {
  DataChunks, utils, stats, series, facets, facetFns,
};
