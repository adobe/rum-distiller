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
import { classifyAcquisition } from './acquisition.js';
import classifyConsent from './consent.js';

/* helpers */

export function isKnownFacet(key) {
  const checkpoints = [
    'loadresource',
    'cwv',
    'cwv2', // ekrem
    'cwv-lcp',
    'cwv-cls',
    'cwv-inp',
    'cwv-ttfb', // these are virtual checkpoints
    'click',
    'top',
    'viewmedia',
    'viewblock',
    'enter',
    'error',
    'navigate',
    'utm',
    'reload',
    'back_forward',
    'missingresource',
    'audience',
    'experiment',
    'formsubmit',
    '404',
    'convert',
    'search',
    'unsupported',
    'noscript',
    'consent',
    'paid',
    'email',
    'acquisition',
    'login',
    'signup',
    'language', // record language preference
    'prerender',
    'redirect', // there was a redirect as part of the request
    'acquisition', // virtual checkpoint
  ];

  const baseFacets = [
    'userAgent',
    'url',
    'type',
    'conversions',
    'checkpoint',
    // facets from sankey
    'trafficsource',
    'traffictype',
    'entryevent',
    'pagetype',
    'loadtype',
    'contenttype',
    'interaction',
    'clicktarget',
    'exit',
    'vitals',
    // facets from checkpoints
    ...checkpoints,
  ];

  const suffixes = [
    'source',
    'target',
    'histogram',
  ];

  const modifiers = [
    '!', // indicates a negation, and allows us to select a negative facet
    '~', // indicates a count, and allows us to control how many items are shown
  ];

  const facetPattern = /^(?<facet>[a-z]+)(\.(?<suffix>[a-z]+))?(?<qualifier>[!~])?$/i;
  const match = facetPattern.exec(key);
  if (match) {
    const { facet, suffix, qualifier } = match.groups;
    return baseFacets.includes(facet)
      && (!suffix || suffixes.includes(suffix))
      && (!qualifier || modifiers.includes(qualifier));
  }
  return false;
}

export function scoreCWV(value, name) {
  if (value === undefined || value === null) return null;
  let poor;
  let ni;
  // this is unrolled on purpose as this method becomes a bottleneck
  if (name === 'lcp') {
    poor = 4000;
    ni = 2500;
  }
  if (name === 'cls') {
    poor = 0.25;
    ni = 0.1;
  }
  if (name === 'inp') {
    poor = 500;
    ni = 200;
  }
  if (name === 'ttfb') {
    poor = 1800;
    ni = 800;
  }
  if (value >= poor) {
    return 'poor';
  }
  if (value >= ni) {
    return 'ni';
  }
  return 'good';
}

export const UA_KEY = 'userAgent';

/**
 * Returns a human readable number
 * @param {Number} num a number
 * @param {Number} precision the number of significant digits
 * @returns {String} a human readable number
 */
export function toHumanReadable(num, precision = 2) {
  if (Number.isNaN(num)) return '-';
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumSignificantDigits: precision,
  });
  return formatter.format(num).toLocaleLowerCase();
}

export function scoreBundle(bundle) {
  // a bundle is good if all CWV that have a value are good
  // a bundle is ni if all CWV that have a value are ni or good
  // a bundle is poor if any CWV that have a value are poor
  // a bundle has no CWV if no CWV have a value
  const cwv = ['cwvLCP', 'cwvCLS', 'cwvINP'];
  const scores = cwv
    .filter((metric) => bundle[metric])
    .map((metric) => scoreCWV(bundle[metric], metric.toLowerCase().slice(3)));
  if (scores.length === 0) return null;
  if (scores.every((s) => s === 'good')) return 'good';
  if (scores.every((s) => s !== 'poor')) return 'ni';
  return 'poor';
}

/**
 * Conversion rates are computed as the ratio of conversions to visits. The conversion rate is
 * capped at 100%.
 * @param conversions the number of conversions
 * @param visits the number of visits
 * @returns {number}  the conversion rate as a percentage
 */
export function computeConversionRate(conversions, visits) {
  const conversionRate = (100 * conversions) / visits;
  if (conversionRate >= 0 && conversionRate <= 100) {
    return conversionRate;
  }
  return 100;
}

export function reclassifyConsent({ source, target, checkpoint }) {
  if (checkpoint === 'click' && source) {
    const consent = classifyConsent(source);
    if (consent) return consent;
  }
  return { source, target, checkpoint };
}

export function reclassifyAcquisition({ source, target, checkpoint }) {
  if (checkpoint === 'utm' && (source === 'utm_source' || source === 'utm_medium')) {
    const acquisition = classifyAcquisition(target);
    if (acquisition) return { checkpoint: 'acquisition', source: acquisition };
  } else if (checkpoint === 'paid') {
    const acquisition = classifyAcquisition(source, true);
    if (acquisition) return { checkpoint: 'acquisition', source: acquisition };
  } else if (checkpoint === 'email') {
    const acquisition = classifyAcquisition(source, false);
    if (acquisition) return { checkpoint: 'acquisition', source: acquisition };
  }
  /* reclassify earned acquisition – I don't like this, because it kills the enter checkpoint
  else if (checkpoint === 'enter' && !allEvents.find((evt) => evt.checkpoint === 'acquisition'
    || evt.checkpoint === 'utm'
    || evt.checkpoint === 'paid'
    || evt.checkpoint === 'email')) {
    const acquisition = classifyAcquisition(source, 'earned');
    if (acquisition) return { checkpoint: 'acquisition', source: `${acquisition}` };
  }
  */
  return { source, target, checkpoint };
}

/**
 * Calculates properties on the bundle, so that bundle-level filtering can be performed
 * @param {RawBundle} bundle the raw input bundle, without calculated properties
 * @returns {Bundle} a bundle with additional properties
 */
export function addCalculatedProps(bundle) {
  bundle.events.forEach((e) => {
    if (e.checkpoint === 'enter') {
      // eslint-disable-next-line no-param-reassign
      bundle.visit = true;
      if (e.source === '') e.source = '(direct)';
    }
    if (e.checkpoint === 'cwv-inp') {
      // eslint-disable-next-line no-param-reassign
      bundle.cwvINP = e.value;
    }
    if (e.checkpoint === 'cwv-lcp') {
      // eslint-disable-next-line no-param-reassign
      bundle.cwvLCP = Math.max(e.value || 0, bundle.cwvLCP || 0);
    }
    if (e.checkpoint === 'cwv-cls') {
      // eslint-disable-next-line no-param-reassign
      bundle.cwvCLS = Math.max(e.value || 0, bundle.cwvCLS || 0);
    }
    if (e.checkpoint === 'cwv-ttfb') {
      // eslint-disable-next-line no-param-reassign
      bundle.cwvTTFB = e.value;
    }
  });
  return bundle;
}

/**
 * Produces all path prefixes from a URL path in descending length order.
 * Takes a path like "/foo/bar/baz" and returns ["/foo", "/foo/bar", "/foo/bar/baz"].
 * @param {string} path - The URL path to process
 * @returns {string[]} Array of path prefixes
 */
function pathProducer(path) {
  return path
    .split('/')
    .filter(Boolean)
    .map((_, i, segments) => segments.slice(0, i + 1))
    .map((segments) => `/${segments.join('/')}`);
}

/**
 * Produces all domain suffixes from a hostname in ascending specificity order.
 * Takes a hostname like "www.example.com" and returns ["com", "example.com", "www.example.com"].
 * @param {string} host - The hostname to process
 * @returns {string[]} Array of domain suffixes
 */
function hostProducer(host) {
  return host
    .split('.')
    .reverse()
    .filter(Boolean)
    .map((_, i, segments) => segments.slice(0, i + 1))
    .map((segments) => `${segments.reverse().join('.')}`);
}

/**
 * Produces URL segments for analysis based on input type.
 * - For full URLs (starting with https://): returns path segments
 * - For domain-like strings (containing dots): returns domain segments
 * - For other strings: returns empty array
 * @param {string} url - URL, hostname, or other string to analyze
 * @returns {string[]} Array of URL segments for faceting
 */
export function urlProducer(url) {
  if (url.startsWith('https://')) {
    return pathProducer(new URL(url).pathname);
  } else if (url.indexOf('.') !== -1) {
    return hostProducer(url);
  }
  return [];
}
