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

describe('facets:sort-by-count', () => {
  it('facets should be sorted by count (number of bundles) when weight differs', () => {
    // This test creates a scenario where sorting by count gives a different
    // order than sorting by weight. The expectation is that facets should be
    // sorted by COUNT (number of page views / bundles), not total weight.
    //
    // Scenario:
    // - "popular": 5 bundles × 100 weight each = 500 total weight, count = 5
    // - "heavy": 1 bundle × 1000 weight = 1000 total weight, count = 1
    //
    // Expected order by COUNT: popular (5), then heavy (1)
    // Current order by WEIGHT: heavy (1000), then popular (500)
    const testChunks = [
      {
        date: '2024-01-01',
        rumBundles: [
          // 5 bundles for "popular" checkpoint, each with weight 100
          {
            weight: 100,
            id: 'popular1',
            host: 'example.com',
            url: 'https://example.com/page1',
            userAgent: 'desktop',
            events: [{ checkpoint: 'popular' }],
          },
          {
            weight: 100,
            id: 'popular2',
            host: 'example.com',
            url: 'https://example.com/page2',
            userAgent: 'desktop',
            events: [{ checkpoint: 'popular' }],
          },
          {
            weight: 100,
            id: 'popular3',
            host: 'example.com',
            url: 'https://example.com/page3',
            userAgent: 'desktop',
            events: [{ checkpoint: 'popular' }],
          },
          {
            weight: 100,
            id: 'popular4',
            host: 'example.com',
            url: 'https://example.com/page4',
            userAgent: 'desktop',
            events: [{ checkpoint: 'popular' }],
          },
          {
            weight: 100,
            id: 'popular5',
            host: 'example.com',
            url: 'https://example.com/page5',
            userAgent: 'desktop',
            events: [{ checkpoint: 'popular' }],
          },
          // 1 bundle for "heavy" checkpoint with weight 1000
          {
            weight: 1000,
            id: 'heavy1',
            host: 'example.com',
            url: 'https://example.com/page6',
            userAgent: 'desktop',
            events: [{ checkpoint: 'heavy' }],
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
    console.log('Facet sort order (expecting sort by count):');
    facets.forEach((f, i) => {
      console.log(`  ${i}. ${f.value}: count=${f.count}, weight=${f.weight}`);
    });

    const popularFacet = facets.find((f) => f.value === 'popular');
    const heavyFacet = facets.find((f) => f.value === 'heavy');

    // Verify the data is as expected
    assert.equal(popularFacet.count, 5, 'popular should have count of 5');
    assert.equal(popularFacet.weight, 500, 'popular should have weight of 500');
    assert.equal(heavyFacet.count, 1, 'heavy should have count of 1');
    assert.equal(heavyFacet.weight, 1000, 'heavy should have weight of 1000');

    // The key assertion: facets should be sorted by COUNT, not weight
    // So "popular" (count=5) should come before "heavy" (count=1)
    assert.equal(
      facets[0].value,
      'popular',
      'popular (count=5) should be first when sorting by count, but currently sorts by weight',
    );
    assert.equal(
      facets[1].value,
      'heavy',
      'heavy (count=1) should be second when sorting by count',
    );

    // General assertion: verify facets are sorted by count descending
    for (let i = 0; i < facets.length - 1; i++) {
      assert.ok(
        facets[i].count >= facets[i + 1].count,
        `Facets should be sorted by count descending. Facet "${facets[i].value}" (count=${facets[i].count}) should have count >= "${facets[i + 1].value}" (count=${facets[i + 1].count})`,
      );
    }
  });
});
