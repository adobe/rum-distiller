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
import { reclassifyConsent, reclassifyAcquisition, scoreCWV } from './utils.js';
import { classifyReferrer } from './referrer.js';
/**
  * @import {Bundle} from './distiller.js'
  */
export const facets = {
  /**
   * Extracts each of device type and operating system from
   * the simplified user agent string.
   * @param {Bundle} bundle the bundle of sampled rum events
   * @returns {string[]} a list of device types and operating systems
   */
  userAgent: (bundle) => {
    const parts = bundle.userAgent.split(':');
    return parts.reduce((acc, _, i) => {
      acc.push(parts.slice(0, i + 1).join(':'));
      return acc;
    }, []);
  },
  /**
   * Extracts the path from the URL and removes potential PII such as
   * ids, hashes, and other encoded data.
   * @param {Bundle} bundle the bundle of sampled rum events
   * @returns {string} the path of the URL
   */
  url: (bundle) => {
    if (bundle.domain) return bundle.domain;
    const u = new URL(bundle.url);
    u.pathname = u.pathname.split('/')
      .map((segment) => {
        // only numbers and longer than 5 characters: probably an id, censor it
        if (segment.length >= 5 && /^\d+$/.test(segment)) {
          return '<number>';
        }
        // only hex characters and longer than 8 characters: probably a hash, censor it
        if (segment.length >= 8 && /^[0-9a-f]+$/i.test(segment)) {
          return '<hex>';
        }
        // base64 encoded data, censor it
        if (segment.length > 32 && /^[a-zA-Z0-9+/]+={0,2}$/.test(segment)) {
          return '<base64>';
        }
        // probable UUID, censor it
        if (segment.length > 35 && /^[0-9a-f-]+$/.test(segment)) {
          return '<uuid>';
        }

        // if segment is longer than 60 characters, requirement is:
        // - only letters, digits, dashes, and underscores
        // - at least 3 dashes or underscores as separators
        const s = segment.replace(/_/g, '-'); //  convience to shorten regexes (\w contains _)
        if (s.length > 60 && !(/^[\s\w-.]+$/.test(s) && /^([\d\w]+-){3}/g.test(s))) {
          return '...';
        }
        return segment;
      }).join('/');
    return u.toString();
  },
  plainURL: (bundle) => {
    if (bundle.domain) return bundle.domain;
    const u = new URL(bundle.url);
    u.search = '';
    u.hash = '';
    u.username = '';
    u.password = '';
    return u.toString();
  },
  /**
   * Extracts the checkpoints from the bundle. Each checkpoint
   * that occurs at least once in the bundle is returned as a facet
   * value.
   * @param {Bundle} bundle the bundle of sampled rum events
   * @returns {string[]} a list of checkpoints
   */
  checkpoint: (bundle) => Array.from(bundle.events
    .map(reclassifyConsent)
    .map(reclassifyAcquisition)
    .reduce((acc, evt) => {
      acc.add(evt.checkpoint);
      return acc;
    }, new Set())),
  /**
   * Classifies the bundle according to the Core Web Vitals metrics.
   * For each metric in `LCP`, `CLS`, and `INP`, the score is calculated
   * as `good`, `needs improvement`, or `poor`.
   * The result is a list of the form `[goodLCP, niCLS, poorINP]`
   * @param {Bundle} bundle the bundle of sampled rum events
   * @returns {string[]} a list of CWV metrics
   */
  vitals: (bundle) => {
    const cwv = ['cwvLCP', 'cwvCLS', 'cwvINP'];
    return cwv
      .filter((metric) => bundle[metric])
      .map((metric) => scoreCWV(bundle[metric], metric.toLowerCase().slice(3)) + metric.slice(3));
  },
  /**
   * Extracts the target of the Largest Contentful Paint (LCP) event from the bundle.
   * @param {Bundle} bundle the bundle of sampled rum events
   * @returns {string[]} a list of LCP targets
   */
  lcpTarget: (bundle) => bundle.events
    .filter((evt) => evt.checkpoint === 'cwv-lcp')
    .map((evt) => evt.target)
    .filter((target) => target),

  /**
   * Extracts the source of the Largest Contentful Paint (LCP) event from the bundle.
   * @param {Bundle} bundle the bundle of sampled rum events
   * @returns {string[]} a list of LCP sources
   */
  lcpSource: (bundle) => bundle.events
    .filter((evt) => evt.checkpoint === 'cwv-lcp')
    .map((evt) => evt.source)
    .filter((source) => source),

  /**
   * Extracts the acquisition source from the bundle. As acquisition sources
   * can be strings like `paid:video:youtube`, each of `paid`, `paid:video`,
   * and `paid:video:youtube` are returned as separate values.
   * @param {Bundle} bundle the bundle of sampled rum events
   * @returns {string[]} a list of acquisition sources
   */
  acquisitionSource: (bundle) => Array.from(
    bundle.events
      .map(reclassifyAcquisition)
      .filter((evt) => evt.checkpoint === 'acquisition')
      .filter(({ source }) => source) // filter out empty sources
      .map(({ source }) => source.split(':'))
      .map((source) => source
        .reduce((acc, _, i) => {
          acc.push(source.slice(0, i + 1).join(':'));
          return acc;
        }, [])
        .filter((s) => s))
      .pop() || [],
  ),
  /**
   * Classifies the referrer page of the enter event.
   * @param {Bundle} bundle the bundle of sampled rum events
   * @returns {string[]} a list of referrer classifications, following the pattern:
   * - the original source URL
   * - the type and vendor of the referrer, e.g. `search:google`
   * - the type of the referrer, e.g. `search`
   * - the vendor of the referrer, regardless of type, e.g. `*:google`
   */
  enterSource: (bundle) => {
    const normalizedSources = bundle.events
      .filter((evt) => evt.checkpoint === 'enter')
      .map((evt) => evt.source)
      .filter((source) => source)
      .map((source) => {
        const normalizedSource = source.replace(/\/#$/, '');
        const referrerClass = classifyReferrer(normalizedSource);
        return referrerClass ? [
          normalizedSource,
          `${referrerClass.type}:${referrerClass.vendor}`,
          referrerClass.type,
          `*:${referrerClass.vendor}`,
        ] : normalizedSource;
      })
      .flat();
    
    const uniqueSources = new Set(normalizedSources);
    return uniqueSources;
  },
  /**
   * Extracts the target of the media view event from the bundle. This
   * is typically the URL of an image or video, and the URL is stripped
   * of query parameters, hash, user, and password.
   * @param {Bundle} bundle the bundle of sampled rum events
   * @returns {string[]} a list of media targets
   */
  mediaTarget: (bundle) => bundle.events
    .filter((evt) => evt.checkpoint === 'viewmedia')
    .map((evt) => evt.target)
    .filter((target) => target)
    .map((target) => {
      const u = new URL(target, bundle.url);
      // strip query params, hash, and user/pass
      u.search = '';
      u.hash = '';
      u.username = '';
      u.password = '';
      if (u.hostname === bundle.host) {
        // relative URL is enough
        return u.pathname;
      }
      return u.toString();
    }),
  };

/**
 * A facet function takes a bundle and returns an array of facet values.
 * @typedef {function} FacetFn
 * @param {Bundle} bundle The bundle to process
 * @returns {string[]} Array of facet values
 */

/**
 * A collection of facet factory functions. Each function takes one or more
 * parameters and returns a facet function according to the parameters.
 */
export const facetFns = {
  /**
   * Returns a function that creates a facet function for the source of the given
   * checkpoint.
   * @return {FacetFn} - a facet function
   * @param {string} cp - the checkpoint
   */
  checkpointSource: (cp) => (bundle) => Array.from(
    bundle.events
      .map(reclassifyConsent)
      .filter((evt) => evt.checkpoint === cp)
      .filter(({ source }) => source) // filter out empty sources
      .reduce((acc, { source }) => {
        acc.add(source);
        return acc;
      }, new Set()),
  ),
  /**
   * Returns a function that creates a facet function for the target of the given
   * checkpoint.
   * @param {string} cp the checkpoint
   * @returns {FacetFn} a facet function
   */
  checkpointTarget: (cp) => (bundle) => Array.from(
    bundle.events
      .map(reclassifyConsent)
      .filter((evt) => evt.checkpoint === cp)
      .filter(({ target }) => target) // filter out empty targets
      .reduce((acc, { target }) => {
        acc.add(target);
        return acc;
      }, new Set()),
  ),
};
