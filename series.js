import { reclassifyAcquisition } from './utils.js';
/**
 * @module series
 * @description This module provides a list of standardized series for use in analyzing web experiences.
 * each series can be registered with a name using `DataChunks.addSeries(name, series)`.
 */

/**
 * @typedef {import('./distiller.js').Bundle} Bundle
 */


/**
 * A page view is an impression of a page. At this moment, pre-rendering is also considered a page view.
 * @param {Bundle} bundle a series of events that belong to the same page view
 * @returns {number} the number of page views
 */
export const pageViews = (bundle) => bundle.weight;

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
 * A page view is considered engaged if there has been at least some user interaction.
 * @param {Bundle} bundle a series of events that belong to the same page view
 * @returns {number} the number of engaged page views
 */
export const engagement = (bundle) => (dataChunks.hasConversion(bundle, {
  checkpoint: ['click'],
})
  ? bundle.weight
  : 0);

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