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

/**
 * Generates realistic synthetic RUM bundles for performance testing.
 * Matches production patterns with configurable distributions.
 */

const CHECKPOINTS = [
  'enter', 'loadresource', 'cwv', 'cwv-lcp', 'cwv-cls', 'cwv-inp', 'cwv-ttfb',
  'click', 'viewmedia', 'viewblock', 'navigate', 'error', 'convert',
  'formsubmit', 'utm', 'paid', 'email', 'acquisition',
];

const USER_AGENTS = [
  'desktop:windows', 'desktop:mac', 'desktop:linux',
  'mobile:ios', 'mobile:android', 'tablet:ios', 'tablet:android',
];

const URLS = [
  'https://example.com/',
  'https://example.com/products',
  'https://example.com/products/123',
  'https://example.com/about',
  'https://example.com/contact',
  'https://example.com/blog',
  'https://example.com/blog/post-1',
  'https://example.com/blog/post-2',
  'https://example.com/pricing',
  'https://example.com/features',
];

const SOURCES = [
  '(direct)', 'https://google.com/search', 'https://facebook.com',
  'https://twitter.com', 'https://linkedin.com', '.hero-button',
  '.nav-link', '.cta-primary', '.footer-link', '',
];

const TARGETS = [
  '/images/hero.jpg', '/videos/promo.mp4', 'https://cdn.example.com/asset.png',
  '.product-card', '.banner', 'https://example.com/download', '',
];

/**
 * Generates a random integer between min (inclusive) and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Selects a random element from an array
 */
function randomChoice(array) {
  return array[randomInt(0, array.length - 1)];
}

/**
 * Generates a single RUM event
 */
function generateEvent(checkpoint = null) {
  const cp = checkpoint || randomChoice(CHECKPOINTS);
  const event = {
    checkpoint: cp,
    timeDelta: randomInt(0, 5000),
  };

  // Add source/target based on checkpoint type
  if (['click', 'viewblock', 'formsubmit'].includes(cp)) {
    event.source = randomChoice(SOURCES);
  }
  if (['viewmedia', 'loadresource'].includes(cp)) {
    event.target = randomChoice(TARGETS);
  }
  if (cp === 'enter') {
    event.source = randomChoice(SOURCES);
  }
  if (cp.startsWith('cwv-')) {
    // Generate realistic CWV values
    if (cp === 'cwv-lcp') {
      event.value = randomInt(800, 4500);
    } else if (cp === 'cwv-cls') {
      event.value = Math.random() * 0.3;
    } else if (cp === 'cwv-inp') {
      event.value = randomInt(50, 600);
    } else if (cp === 'cwv-ttfb') {
      event.value = randomInt(200, 2000);
    }
  }
  if (cp === 'utm') {
    event.source = randomChoice(['utm_source', 'utm_medium', 'utm_campaign']);
    event.target = randomChoice(['google', 'facebook', 'email', 'newsletter']);
  }

  return event;
}

/**
 * Generates a realistic RUM bundle
 */
function generateBundle(id, options = {}) {
  const {
    ensureVisit = true,
    hasCWV = Math.random() > 0.3,
    eventCount = randomInt(2, 8),
  } = options;

  const events = [];

  // Ensure visit if requested
  if (ensureVisit) {
    events.push(generateEvent('enter'));
  }

  // Add CWV events
  if (hasCWV) {
    ['cwv-lcp', 'cwv-cls', 'cwv-inp', 'cwv-ttfb'].forEach((cwv) => {
      if (Math.random() > 0.2) {
        events.push(generateEvent(cwv));
      }
    });
  }

  // Fill remaining events
  while (events.length < eventCount) {
    events.push(generateEvent());
  }

  const now = new Date();
  const timestamp = new Date(now.getTime() - randomInt(0, 7 * 24 * 60 * 60 * 1000));

  return {
    id: `bundle-${id}`,
    host: 'example.com',
    time: timestamp.toISOString(),
    timeSlot: timestamp.toISOString().slice(0, 13),
    url: randomChoice(URLS),
    userAgent: randomChoice(USER_AGENTS),
    hostType: randomChoice(['helix', 'aemcs']),
    weight: randomChoice([1, 10, 100]),
    events,
  };
}

/**
 * Generates a dataset with specified characteristics
 */
export function generateDataset(count, options = {}) {
  const {
    // Distribution skew (0-1, where 1 is highly skewed)
    skew = 0.3,
    // Percentage of bundles that should match common filters (0-1)
    filterSelectivity = 0.5,
    // Number of distinct groups for grouping tests
    distinctGroups = 10,
  } = options;

  const bundles = [];

  for (let i = 0; i < count; i++) {
    const bundle = generateBundle(i);

    // Apply skew - make some URLs more common
    if (Math.random() < skew) {
      bundle.url = URLS[0]; // Popular URL
    }

    // Apply filter selectivity - ensure certain checkpoints appear
    if (Math.random() < filterSelectivity) {
      bundle.events.push(generateEvent('convert'));
    }

    // Control group distribution
    if (distinctGroups) {
      const groupIndex = Math.floor(Math.random() * distinctGroups);
      bundle.url = URLS[groupIndex % URLS.length];
    }

    bundles.push(bundle);
  }

  return bundles;
}

/**
 * Generates datasets for all benchmark scenarios
 */
export function generateBenchmarkDatasets() {
  return {
    // Filtering scenarios
    filtering: {
      small: generateDataset(1000, { filterSelectivity: 0.5 }),
      medium: generateDataset(10000, { filterSelectivity: 0.5 }),
      large: generateDataset(50000, { filterSelectivity: 0.5 }),
      highMatch: generateDataset(10000, { filterSelectivity: 0.9 }),
      lowMatch: generateDataset(10000, { filterSelectivity: 0.1 }),
    },

    // Grouping scenarios
    grouping: {
      fewGroups: generateDataset(10000, { distinctGroups: 2 }),
      someGroups: generateDataset(10000, { distinctGroups: 10 }),
      manyGroups: generateDataset(10000, { distinctGroups: 100 }),
      massiveGroups: generateDataset(10000, { distinctGroups: 1000 }),
      balanced: generateDataset(10000, { distinctGroups: 10, skew: 0 }),
      skewed: generateDataset(10000, { distinctGroups: 10, skew: 0.8 }),
    },

    // Facet scenarios
    facets: {
      simple: generateDataset(10000, { filterSelectivity: 0.5 }),
      complex: generateDataset(10000, { filterSelectivity: 0.5 }),
    },
  };
}
