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
import { reclassifyAcquisition } from './utils.js';
/**
 * @module series
 * @description This module provides a list of standardized series for use in analyzing web
 * experiences.
 * each series can be registered with a name using `DataChunks.addSeries(name, series)`.
 */

/**
 * @import {Bundle} from './distiller.js'
 */

/**
 * A page view is an impression of a page. At this moment, pre-rendering is also
 * considered a page view.
 * @param {Bundle} bundle a series of events that belong to the same page view
 * @returns {number} the number of page views
 */
export const pageViews = (bundle) => {
  const isBundle = true;
  const isPrerender = bundle.events.find((evt) => evt.checkpoint === 'prerender');
  const isPrerenderThenNavigate = bundle.events.find((evt) => evt.checkpoint === 'navigate'
    && evt.target === 'prerendered');
  return isBundle && (!isPrerender || isPrerenderThenNavigate) ? bundle.weight : 0;
};

/**
 * A visit is a page view that does not follow an internal link. This means a visit starts
 * when users follow an external link or enter the URL in the browser.
 * @param {Bundle} bundle a series of events that belong to the same page view
 * @returns {number} the number of visits
 */
export const visits = (bundle) => (bundle.visit ? bundle.weight : 0);

/**
 * A bounce is a visit that does not have any click events.
 * @param {Bundle} bundle a series of events that belong to the same page view
 * @returns {number} the number of bounces
 */
export const bounces = (bundle) => (bundle.visit && !bundle.events.find(({ checkpoint }) => checkpoint === 'click')
  ? bundle.weight
  : 0);

/**
 * The largest contentful paint is the time it takes for the largest contentful element to load.
 * @param {Bundle} bundle a series of events that belong to the same page view
 * @returns {number} the largest contentful paint
 */
export const lcp = (bundle) => bundle.cwvLCP;

/**
 * The cumulative layout shift is the sum of all layout shifts in a page view.
 * @param {Bundle} bundle a series of events that belong to the same page view
 * @returns {number} the cumulative layout shift
 */
export const cls = (bundle) => bundle.cwvCLS;

/**
 * The interaction to next paint is the time it takes for the next paint after an interaction.
 * @param {Bundle} bundle a series of events that belong to the same page view
 * @returns {number} the interaction to next paint
 */
export const inp = (bundle) => bundle.cwvINP;

/**
 * The time to first byte is the time it takes for the first byte to arrive.
 * @param {Bundle} bundle a series of events that belong to the same page view
 */

export const ttfb = (bundle) => bundle.cwvTTFB;

/**
 * A page view is considered engaged if there has been at least some user interaction
 * or significant content has been viewed, i.e. 4 or more viewmedia or viewblock events.
 * @param {Bundle} bundle a series of events that belong to the same page view
 * @returns {number} the number of engaged page views
 */
export const engagement = (bundle) => {
  const clickEngagement = bundle.events.filter((evt) => evt.checkpoint === 'click').length > 0
    ? bundle.weight
    : 0;
  const contentEngagement = bundle.events
    .filter((evt) => evt.checkpoint === 'viewmedia' || evt.checkpoint === 'viewblock')
    .length > 3
    ? bundle.weight
    : 0;
  return clickEngagement || contentEngagement;
};

/**
 * The number of earned visits is the number of visits that are not paid or owned.
 * @param {Bundle} bundle a series of events that belong to the same page view
 * @returns {number} the number of earned conversions
 */
export const earned = (bundle) => {
  const reclassified = bundle.events.map(reclassifyAcquisition);
  if (!reclassified.find((evt) => evt.checkpoint === 'enter')) {
    // we only consider enter events
    return 0;
  }
  if (!reclassified.find((evt) => evt.checkpoint === 'acquisition')) {
    // this is fully organic, as there are no traces of any acquisition
    return bundle.weight;
  }
  if (reclassified.find((evt) => evt.checkpoint === 'acquisition' && evt.source.startsWith('paid'))) {
    // this is paid, as there is at least one paid acquisition
    return 0;
  }
  if (reclassified.find((evt) => evt.checkpoint === 'acquisition' && evt.source.startsWith('owned'))) {
    // owned does not count as earned
    return 0;
  }
  return bundle.weight;
};

/**
 * The number of organic visits is the number of visits that are not paid.
 * @param {Bundle} bundle a series of events that belong to the same page view
 * @returns {number} the number of earned conversions
 */
export const organic = (bundle) => {
  const reclassified = bundle.events.map(reclassifyAcquisition);
  if (!reclassified.find((evt) => evt.checkpoint === 'enter')) {
    // we only consider enter events
    return 0;
  }
  if (!reclassified.find((evt) => evt.checkpoint === 'acquisition')) {
    // this is fully organic, as there are no traces of any acquisition
    return bundle.weight;
  }
  if (reclassified.find((evt) => evt.checkpoint === 'acquisition' && evt.source.startsWith('paid'))) {
    // this is paid, as there is at least one paid acquisition
    return 0;
  }
  return bundle.weight;
};
