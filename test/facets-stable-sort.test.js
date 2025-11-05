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
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DataChunks } from '../distiller.js';
import { pageViews } from '../series.js';

describe('facets:stable-sort', () => {
  it('facets with equal weights should be sorted deterministically', () => {
    // Create test data where multiple facets have the same weight
    // The order should be deterministic and stable across runs
    const testChunks = [
      {
        date: '2024-01-01',
        rumBundles: [
          {
            weight: 100,
            id: 'chunk1',
            host: 'example.com',
            url: 'https://example.com/page1',
            userAgent: 'desktop',
            events: [{ checkpoint: 'zebra' }],
          },
          {
            weight: 100,
            id: 'chunk2',
            host: 'example.com',
            url: 'https://example.com/page2',
            userAgent: 'desktop',
            events: [{ checkpoint: 'alpha' }],
          },
          {
            weight: 100,
            id: 'chunk3',
            host: 'example.com',
            url: 'https://example.com/page3',
            userAgent: 'desktop',
            events: [{ checkpoint: 'beta' }],
          },
          {
            weight: 200,
            id: 'chunk4',
            host: 'example.com',
            url: 'https://example.com/page4',
            userAgent: 'desktop',
            events: [{ checkpoint: 'top' }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('checkpoint', (bundle) => Array.from(
      bundle.events
        .reduce((acc, evt) => {
          acc.add(evt.checkpoint);
          return acc;
        }, new Set()),
    ));

    const facets = d.facets.checkpoint;

    // Expected order:
    // 1. top (weight=200)
    // 2-4. alpha, beta, zebra (all weight=100) - should be in alphabetical order
    assert.equal(facets[0].value, 'top', 'top should be first (highest weight)');
    assert.equal(facets[0].weight, 200);

    // The three equal-weight facets should be sorted alphabetically
    assert.equal(facets[1].value, 'alpha', 'alpha should come before beta and zebra (alphabetical order for equal weights)');
    assert.equal(facets[2].value, 'beta', 'beta should come after alpha but before zebra');
    assert.equal(facets[3].value, 'zebra', 'zebra should be last');

    // All should have the same weight
    assert.equal(facets[1].weight, 100);
    assert.equal(facets[2].weight, 100);
    assert.equal(facets[3].weight, 100);
  });

  it('facets should be sorted by weight descending, then count descending, then value ascending', () => {
    // Test the full sort hierarchy
    const testChunks = [
      {
        date: '2024-01-01',
        rumBundles: [
          // Weight 300: two facets with different counts
          {
            weight: 100,
            id: 'chunk1',
            host: 'example.com',
            url: 'https://example.com/page1',
            userAgent: 'desktop',
            events: [{ checkpoint: 'group1-less' }],
          },
          {
            weight: 100,
            id: 'chunk2',
            host: 'example.com',
            url: 'https://example.com/page2',
            userAgent: 'desktop',
            events: [{ checkpoint: 'group1-less' }],
          },
          {
            weight: 100,
            id: 'chunk3',
            host: 'example.com',
            url: 'https://example.com/page3',
            userAgent: 'desktop',
            events: [{ checkpoint: 'group1-less' }],
          },
          {
            weight: 100,
            id: 'chunk4',
            host: 'example.com',
            url: 'https://example.com/page4',
            userAgent: 'desktop',
            events: [{ checkpoint: 'group1-more' }],
          },
          {
            weight: 100,
            id: 'chunk5',
            host: 'example.com',
            url: 'https://example.com/page5',
            userAgent: 'desktop',
            events: [{ checkpoint: 'group1-more' }],
          },
          {
            weight: 100,
            id: 'chunk6',
            host: 'example.com',
            url: 'https://example.com/page6',
            userAgent: 'desktop',
            events: [{ checkpoint: 'group1-more' }],
          },
          {
            weight: 100,
            id: 'chunk7',
            host: 'example.com',
            url: 'https://example.com/page7',
            userAgent: 'desktop',
            events: [{ checkpoint: 'group1-more' }],
          },
          {
            weight: 100,
            id: 'chunk8',
            host: 'example.com',
            url: 'https://example.com/page8',
            userAgent: 'desktop',
            events: [{ checkpoint: 'group1-more' }],
          },
          // Weight 200: single facet
          {
            weight: 200,
            id: 'chunk9',
            host: 'example.com',
            url: 'https://example.com/page9',
            userAgent: 'desktop',
            events: [{ checkpoint: 'top' }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('checkpoint', (bundle) => Array.from(
      bundle.events
        .reduce((acc, evt) => {
          acc.add(evt.checkpoint);
          return acc;
        }, new Set()),
    ));

    const facets = d.facets.checkpoint;

    // Expected order (by total weight first):
    // 1. group1-more (weight=500, count=5) - highest total weight
    // 2. group1-less (weight=300, count=3) - middle total weight
    // 3. top (weight=200, count=1) - lowest total weight
    assert.equal(facets[0].value, 'group1-more');
    assert.equal(facets[0].weight, 500);
    assert.equal(facets[0].count, 5);

    assert.equal(facets[1].value, 'group1-less');
    assert.equal(facets[1].weight, 300);
    assert.equal(facets[1].count, 3);

    assert.equal(facets[2].value, 'top');
    assert.equal(facets[2].weight, 200);
    assert.equal(facets[2].count, 1);
  });
});
