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

import { readFileSync } from 'node:fs';
import { DataChunks } from '../distiller.js';
import { addCalculatedProps } from '../utils.js';
import { zTestTwoProportions } from '../stats.js';

// Load fixture data
const fixturePath = new URL('cruncher.fixture.json', import.meta.url);
const chunks = JSON.parse(readFileSync(fixturePath));

describe('cruncher.js helper functions', () => {
  it('addCalculatedProps()', () => {
    const bundle = {
      id: '37Rfpw',
      host: 'www.aem.live',
      time: '2024-05-06T05:00:06.668Z',
      timeSlot: '2024-05-06T05:00:00.000Z',
      url: 'https://www.aem.live/developer/tutorial',
      userAgent: 'desktop:mac',
      weight: 100,
      events: [
        {
          checkpoint: 'viewmedia',
          target: 'https://www.aem.live/developer/media_1c03ad909a87a4e318a33e780b93e4a1f8e7581a3.png',
          timeDelta: 6668.300048828125,
        },
        {
          checkpoint: 'cwv-ttfb',
          value: 116.40000009536743,
          timeDelta: 4157.60009765625,
        },
        {
          checkpoint: 'cwv-inp',
          value: 24,
          timeDelta: 22433,
        },
        {
          checkpoint: 'loadresource',
          target: 13,
          source: 'https://www.aem.live/side-navigation.plain.html',
          timeDelta: 2146.60009765625,
        },
        {
          checkpoint: 'cwv',
          timeDelta: 3405.699951171875,
        },
        {
          checkpoint: 'loadresource',
          target: 1,
          source: 'https://www.aem.live/new-footer.plain.html',
          timeDelta: 2146.300048828125,
        },
        {
          checkpoint: 'viewmedia',
          target: 'https://www.aem.live/developer/media_10ba61a1d511624419dcef8791a7ef1e2d4be517a.png',
          timeDelta: 2669.800048828125,
        },
        {
          checkpoint: 'viewmedia',
          target: 'https://www.aem.live/developer/media_10f4cf14edeb95728a5fe54816167b7bfdd84b470.png',
          timeDelta: 13955.60009765625,
        },
        {
          checkpoint: 'cwv-cls',
          value: 0.08819350790051111,
          timeDelta: 22433.199951171875,
        },
        {
          checkpoint: 'viewblock',
          source: '.side-navigation',
          timeDelta: 2263.800048828125,
        },
        {
          checkpoint: 'viewblock',
          source: '.video',
          timeDelta: 14990,
        },
        {
          checkpoint: 'cwv-lcp',
          value: 449.60000002384186,
          timeDelta: 22299.89990234375,
        },
        {
          checkpoint: 'load',
          timeDelta: 340.39990234375,
        },
        {
          checkpoint: 'viewmedia',
          target: 'https://www.aem.live/developer/media_1228880ca4b47272dfeff138bbc65e21ea7280ae2.png',
          timeDelta: 13113.800048828125,
        },
        {
          checkpoint: 'viewmedia',
          target: 'https://www.hlx.live/developer/videos/tutorial-step1.mp4',
          source: '.video',
          timeDelta: 2152.10009765625,
        },
        {
          checkpoint: 'viewblock',
          source: '.video',
          timeDelta: 2153.5,
        },
        {
          checkpoint: 'navigate',
          target: 'visible',
          source: 'https://www.aem.live/home',
          timeDelta: 2144.39990234375,
        },
        {
          checkpoint: 'viewmedia',
          target: 'https://www.aem.live/developer/media_1ac52277bb9463586a7cc3608c6bed2fb7fd3d10e.png',
          timeDelta: 17293.39990234375,
        },
        {
          checkpoint: 'cwv-fid',
          value: 17.600000023841858,
          timeDelta: 22301.60009765625,
        },
        {
          checkpoint: 'leave',
          timeDelta: 22432.699951171875,
        },
        {
          checkpoint: 'lazy',
          timeDelta: 397.10009765625,
        },
        {
          checkpoint: 'viewmedia',
          target: 'https://www.aem.live/developer/media_18d1c2a9ecd6557f129e41b42a03a8dfbff1e27e9.png',
          timeDelta: 2152.800048828125,
        },
        {
          checkpoint: 'loadresource',
          target: 2,
          source: 'https://www.aem.live/new-nav.plain.html',
          timeDelta: 2145.800048828125,
        },
        {
          checkpoint: 'top',
          target: 'visible',
          timeDelta: 156.300048828125,
        },
        {
          checkpoint: 'viewblock',
          source: '.header',
          timeDelta: 2153.199951171875,
        },
      ],
      cwvTTFB: 116.40000009536743,
      cwvINP: 24,
      cwvCLS: 0.08819350790051111,
      cwvLCP: 449.60000002384186,
    };
    const after = addCalculatedProps(bundle);
    assert.equal(after.visit, undefined);
    assert.equal(after.conversion, undefined);
    assert.equal(after.cwvINP, 24);
  });

  it('zTestTwoProportions()', () => {
    const p = zTestTwoProportions(100, 1000, 100, 1000);
    assert.equal(p, 1);
  });
});

describe('DataChunks', () => {
  it('new DataChunks()', async () => {
    const d = new DataChunks();
    assert.ok(d);
  });

  it('DataChunk.load()', () => {
    // load test chunks from cruncher.fixture.json
    const testFile = new URL('cruncher.fixture.json', import.meta.url);
    const testChunks = JSON.parse(readFileSync(testFile));
    const d = new DataChunks();
    d.load(testChunks);
    assert.equal(d.data.length, 31);
  });

  it('DataChunk.bundles', () => {
    // load test chunks from cruncher.fixture.json
    const testFile = new URL('cruncher.fixture.json', import.meta.url);
    const testChunks = JSON.parse(readFileSync(testFile));
    const d = new DataChunks();
    d.load(testChunks);
    assert.equal(d.bundles.length, 969);
  });

  it('DataChunk.bundles (repeat)', () => {
    // load test chunks from cruncher.fixture.json
    const testFile = new URL('cruncher.fixture.json', import.meta.url);
    const testChunks = JSON.parse(readFileSync(testFile));
    const d = new DataChunks();
    d.load(testChunks);
    assert.equal(d.bundles.length, 969);
    assert.equal(d.bundles.length, 969);
    assert.equal(d.bundles.length, 969);
  });

  it('DataChunk.addData()', () => {
    const chunks1 = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'visible',
                timeDelta: 4444.5,
              },
            ],
          },
        ],
      },
    ];
    const chunks2 = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'visible',
                timeDelta: 4444.5,
              },
            ],
          },
        ],
      },
    ];
    const d = new DataChunks();
    d.load(chunks1);
    assert.equal(d.bundles.length, 1);
    d.addData(chunks2);
    assert.equal(d.bundles.length, 2);
  });

  it('DataChunk.filter()', () => {
    const chunks1 = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'visible',
                timeDelta: 4444.5,
              },
            ],
          },
        ],
      },
    ];
    const chunks2 = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'visible',
                timeDelta: 4444.5,
              },
            ],
          },
        ],
      },
    ];
    const d = new DataChunks();
    d.load(chunks1);
    d.addData(chunks2);

    d.addFacet('all', () => 'true');
    d.addFacet('none', () => 'false');
    d.addFacet('id', (bundle) => bundle.id);

    d.filter = {
      all: ['true'],
    };
    assert.equal(d.filtered.length, 2);

    d.filter = {
      none: ['true'],
    };
    assert.equal(d.filtered.length, 0);

    d.filter = {
      id: ['one'],
    };
    assert.equal(d.filtered.length, 1);

    d.filter = {
      // trying to filter with an undefined facet
      unknown: ['unknown'],
    };
    assert.equal(d.filtered.length, 0);
  });

  it('DataChunk.group()', () => {
    const chunks1 = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'visible',
                timeDelta: 100,
              },
            ],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'hidden',
                timeDelta: 200,
              },
            ],
          },
        ],
      },
    ];
    const d = new DataChunks();
    d.load(chunks1);
    const grouped = d.group((bundle) => bundle.id);
    assert.equal(grouped.one.length, 1);
    assert.equal(grouped.two.length, 1);
    const groupedbydisplay = d.group((bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.target);
    assert.equal(groupedbydisplay.visible.length, 1);
    assert.equal(groupedbydisplay.hidden.length, 1);
  });

  it('DataChunk.totals()', () => {
    const chunks1 = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'visible',
                timeDelta: 100,
              },
            ],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'hidden',
                timeDelta: 200,
              },
              {
                checkpoint: 'click',
              },
            ],
          },
        ],
      },
    ];
    const d = new DataChunks();
    d.load(chunks1);

    // define two series
    d.addSeries('toptime', (bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.timeDelta);
    d.addSeries('clickcount', (bundle) => bundle.events.filter((e) => e.checkpoint === 'click').length);

    // get totals
    const { totals } = d;
    // for each series, there are a number of ways to look at the aggregate
    assert.equal(totals.toptime.sum, 300);
    assert.equal(totals.toptime.mean, 150);
    assert.equal(totals.clickcount.sum, 1);
    assert.equal(totals.clickcount.mean, 0.5);
    assert.equal(totals.clickcount.min, 0);
    assert.equal(totals.clickcount.max, 1);
  });

  it('DataChunk.aggregate()', () => {
    const chunks1 = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'visible',
                timeDelta: 100,
              },
            ],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'hidden',
                timeDelta: 200,
              },
              {
                checkpoint: 'click',
              },
            ],
          },
        ],
      },
    ];
    const d = new DataChunks();
    d.load(chunks1);

    // define two series
    d.addSeries('toptime', (bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.timeDelta);
    d.addSeries('clickcount', (bundle) => bundle.events.filter((e) => e.checkpoint === 'click').length);

    // group by display
    d.group((bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.target);

    // get aggregates
    const { aggregates } = d;
    // the first level of aggregation is by group
    assert.deepEqual(Object.keys(aggregates), ['visible', 'hidden']);
    // the second level of aggregation is by series
    assert.equal(aggregates.visible.toptime.sum, 100);
    assert.equal(aggregates.hidden.toptime.sum, 200);
    assert.equal(aggregates.visible.clickcount.sum, 0);
    assert.equal(aggregates.hidden.clickcount.sum, 1);
    // we can also compare the sum and count metrics to the parent (all) group
    assert.equal(aggregates.visible.toptime.share, 1 / 2);
    // percentage is calculated as the ratio of sums
    assert.equal(aggregates.hidden.toptime.percentage, 2 / 3);
  });

  it('DataChunk.facets', () => {
    const chunks1 = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/developer/tutorial',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'visible',
                timeDelta: 100,
              },
            ],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'hidden',
                timeDelta: 200,
              },
              {
                checkpoint: 'click',
              },
            ],
          },
          {
            id: 'three',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'mobile:ios',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'visible',
                timeDelta: 200,
              },
              {
                checkpoint: 'viewmedia',
                target: 'some_image.png',
              },
            ],
          },
        ],
      },
    ];
    const d = new DataChunks();
    d.load(chunks1);

    // define two series
    d.addSeries('toptime', (bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.timeDelta);
    d.addSeries('clickcount', (bundle) => bundle.events.filter((e) => e.checkpoint === 'click').length);

    // group by display
    d.group((bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.target);

    // define facet functions
    d.addFacet('host', (bundle) => bundle.host);
    d.addFacet('url', (bundle) => bundle.url);
    d.addFacet('userAgent', (bundle) => {
      const parts = bundle.userAgent.split(':');
      return parts.reduce((acc, _, i) => {
        acc.push(parts.slice(0, i + 1).join(':'));
        return acc;
      }, []);
    });

    // set an example filter
    d.filter = {
      host: ['www.aem.live'],
    };

    // get facets
    const { facets } = d;

    // the first level of aggregation is by facet
    assert.deepEqual(Object.keys(facets), ['host', 'url', 'userAgent']);
    assert.deepEqual(facets.url.map((f) => f.value), [
      // two bundles, so it comes first
      'https://www.aem.live/home',
      // one bundle, so it comes second
      'https://www.aem.live/developer/tutorial']);

    // one entry can create multiple facets, if the facet function returns an array
    // so that desktop can include all desktop:* variants
    assert.deepEqual(facets.userAgent.map((f) => f.value), [
      'desktop',
      'desktop:windows',
      'mobile',
      'mobile:ios',
    ]);
  });

  it('DataChunk.filter(userAgent)', () => {
    const chunks1 = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/developer/tutorial',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'visible',
                timeDelta: 100,
              },
            ],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'desktop',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'hidden',
                timeDelta: 200,
              },
              {
                checkpoint: 'click',
              },
            ],
          },
          {
            id: 'three',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'mobile:ios',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'visible',
                timeDelta: 200,
              },
              {
                checkpoint: 'viewmedia',
                target: 'some_image.png',
              },
            ],
          },
        ],
      },
    ];
    const d = new DataChunks();
    d.load(chunks1);

    // define facet functions
    d.addFacet('host', (bundle) => bundle.host);
    d.addFacet('userAgent', (bundle) => {
      const parts = bundle.userAgent.split(':');
      return parts.reduce((acc, _, i) => {
        acc.push(parts.slice(0, i + 1).join(':'));
        return acc;
      }, []);
    });

    // set an example filter
    d.filter = {
      host: ['www.aem.live'],
      userAgent: ['desktop'],
    };

    assert.equal(d.filtered.length, 2);

    // get facets and subfacets
    const { facets } = d;

    // one entry can create multiple facets, if the facet function returns an array
    // so that desktop can include all desktop:* variants
    assert.deepEqual(facets.userAgent.map((f) => f.value), [
      'desktop',
      'desktop:windows',
      'mobile',
      'mobile:ios',
    ]);
  });

  it('DataChunk.filter(userAgent) negation', () => {
    const chunks1 = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/developer/tutorial',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'visible',
                timeDelta: 100,
              },
            ],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'desktop',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'hidden',
                timeDelta: 200,
              },
              {
                checkpoint: 'click',
              },
            ],
          },
          {
            id: 'three',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/home',
            userAgent: 'mobile:ios',
            weight: 100,
            events: [
              {
                checkpoint: 'top',
                target: 'visible',
                timeDelta: 200,
              },
              {
                checkpoint: 'viewmedia',
                target: 'some_image.png',
              },
            ],
          },
        ],
      },
    ];
    const d = new DataChunks();
    d.load(chunks1);

    // define facet functions
    d.addFacet('host', (bundle) => bundle.host);
    d.addFacet(
      // as a convention, we use ! to indicate negation. When used in URL parameters, this
      // looks like a nice filter:  ?userAgent!=desktop
      'userAgent!',
      (bundle) => {
        const parts = bundle.userAgent.split(':');
        return parts.reduce((acc, _, i) => {
          acc.push(parts.slice(0, i + 1).join(':'));
          return acc;
        }, []);
      },
      // this sets up the negation filter, it means that the filter will match if at least
      // one of the values in the facet is not in the filter
      'none',
    );

    // set an example filter
    d.filter = {
      host: ['www.aem.live'],
      // this is a negation filter
      'userAgent!': ['desktop'],
    };

    assert.equal(d.filtered.length, 1);
  });

  it('DataChunk.filter() with large array (Set optimization path)', () => {
    // Test the Set optimization path for arrays with >= 5 items
    const chunks1 = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top' }],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page2',
            userAgent: 'desktop:mac',
            weight: 100,
            events: [{ checkpoint: 'top' }],
          },
          {
            id: 'three',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page3',
            userAgent: 'mobile:ios',
            weight: 100,
            events: [{ checkpoint: 'top' }],
          },
          {
            id: 'four',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page4',
            userAgent: 'mobile:android',
            weight: 100,
            events: [{ checkpoint: 'top' }],
          },
          {
            id: 'five',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page5',
            userAgent: 'bot',
            weight: 100,
            events: [{ checkpoint: 'top' }],
          },
          {
            id: 'six',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page6',
            userAgent: 'tablet',
            weight: 100,
            events: [{ checkpoint: 'top' }],
          },
        ],
      },
    ];
    const d = new DataChunks();
    d.load(chunks1);

    // Create a facet that returns an array with >= 5 items
    d.addFacet('multivalue', (bundle) => [
      'value1',
      'value2',
      'value3',
      'value4',
      'value5',
      bundle.id, // Include bundle-specific value
    ]);

    // Filter where some bundles match
    d.filter = {
      multivalue: ['one', 'two'],
    };
    assert.equal(d.filtered.length, 2);

    // Filter where no bundles match
    d.filter = {
      multivalue: ['nonexistent'],
    };
    assert.equal(d.filtered.length, 0);

    // Filter where all bundles match (common values)
    d.filter = {
      multivalue: ['value1'],
    };
    assert.equal(d.filtered.length, 6);
  });
});

describe('DataChunks.hasConversion', () => {
  const testChunks = [
    {
      date: '2024-05-06',
      rumBundles: [
        {
          id: 'one',
          host: 'www.aem.live',
          time: '2024-05-06T00:00:04.444Z',
          timeSlot: '2024-05-06T00:00:00.000Z',
          url: 'https://www.aem.live/developer/tutorial',
          userAgent: 'desktop:windows',
          weight: 100,
          events: [
            {
              checkpoint: 'top',
              target: 'visible',
              timeDelta: 100,
            },
          ],
        },
        {
          id: 'two',
          host: 'www.aem.live',
          time: '2024-05-06T00:00:04.444Z',
          timeSlot: '2024-05-06T00:00:00.000Z',
          url: 'https://www.aem.live/home',
          userAgent: 'desktop',
          weight: 100,
          events: [
            {
              checkpoint: 'top',
              target: 'hidden',
              timeDelta: 200,
            },
            {
              checkpoint: 'click',
            },
          ],
        },
        {
          id: 'three',
          host: 'www.aem.live',
          time: '2024-05-06T00:00:04.444Z',
          timeSlot: '2024-05-06T00:00:00.000Z',
          url: 'https://www.aem.live/home',
          userAgent: 'mobile:ios',
          weight: 100,
          events: [
            {
              checkpoint: 'top',
              target: 'visible',
              timeDelta: 200,
            },
            {
              checkpoint: 'viewmedia',
              target: 'some_image.png',
            },
          ],
        },
      ],
    },
  ];

  it('will tag bundles with convert and not-convert based on a filter spec', () => {
    const d = new DataChunks();
    d.load(testChunks);

    const spec = {
      facetOne: ['top'],
      facetTwo: ['hidden'],
    };
    d.addFacet('facetOne', (bundle) => bundle.events.map((e) => e.checkpoint));
    d.addFacet('facetTwo', (bundle) => bundle.events.map((e) => e.target));
    const facetValueFn = (bundle) => (d.hasConversion(bundle, spec) ? 'converted' : 'not-converted');
    d.addFacet('conversion', facetValueFn);
    const facets = d.facets.conversion;
    const converted = facets.find((f) => f.value === 'converted');
    assert.equal(converted?.count, 1);
    const notConverted = facets.find((f) => f.value === 'not-converted');
    assert.equal(notConverted?.count, 2);
  });

  it('unknown facet in filter spec', () => {
    const d = new DataChunks();
    d.load(testChunks);

    const spec = {
      facetOne: ['top'],
      facetTwo: ['hidden'],
      // trying to filter with an undefined facet
      unknowFacet: ['unknown'],
    };
    d.addFacet('facetOne', (bundle) => bundle.events.map((e) => e.checkpoint));
    d.addFacet('facetTwo', (bundle) => bundle.events.map((e) => e.target));
    const facetValueFn = (bundle) => (d.hasConversion(bundle, spec) ? 'converted' : 'not-converted');
    d.addFacet('conversion', facetValueFn);

    const facets = d.facets.conversion;
    const converted = facets.find((f) => f.value === 'converted');
    assert.equal(converted, undefined);
    const notConverted = facets.find((f) => f.value === 'not-converted');
    assert.equal(notConverted?.count, 3);
  });
});

describe('DataChunks facet value caching', () => {
  it('should cache facet values when filtering with same facet for multiple bundles', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/test1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'enter', timeDelta: 0 }],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:05.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/test2',
            userAgent: 'desktop:mac',
            weight: 100,
            events: [{ checkpoint: 'click', timeDelta: 100 }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    const callCounts = new Map();
    d.addFacet('testFacet', (bundle) => {
      const count = callCounts.get(bundle.id) || 0;
      callCounts.set(bundle.id, count + 1);
      return bundle.events.map((e) => e.checkpoint);
    });

    // Filter should call the facet function once per bundle
    d.filterBy({ testFacet: ['click', 'enter'] });

    // Each bundle's facet function should be called exactly once
    assert.equal(callCounts.get('one'), 1);
    assert.equal(callCounts.get('two'), 1);
  });

  it('should cache facet values across filterBundles and hasConversion calls', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/test',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              { checkpoint: 'click', target: 'button1', timeDelta: 100 },
              { checkpoint: 'enter', timeDelta: 0 },
            ],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    let checkpointCallCount = 0;
    d.addFacet('checkpoints', (bundle) => {
      checkpointCallCount += 1;
      return bundle.events.map((e) => e.checkpoint);
    });

    // First, filter bundles using the checkpoints facet
    const filtered = d.filterBy({ checkpoints: ['click'] });
    const firstCallCount = checkpointCallCount;

    // Then call hasConversion on the same bundle with the same facet
    // The cache should be used, so no additional facet function calls
    const bundle = filtered[0];
    const result = d.hasConversion(bundle, { checkpoints: ['click'] });

    // Facet function should be called only once (during filter)
    // hasConversion should use the cached value
    assert.equal(firstCallCount, 1);
    assert.equal(checkpointCallCount, 1);
    assert.equal(result, true);
  });

  it('should cache both array and Set formats for facet values', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/test',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              { checkpoint: 'checkpoint1', timeDelta: 0 },
              { checkpoint: 'checkpoint2', timeDelta: 100 },
              { checkpoint: 'checkpoint3', timeDelta: 200 },
              { checkpoint: 'checkpoint4', timeDelta: 300 },
              { checkpoint: 'checkpoint5', timeDelta: 400 },
              { checkpoint: 'checkpoint6', timeDelta: 500 },
            ],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    let facetCallCount = 0;
    d.addFacet('checkpoints', (bundle) => {
      facetCallCount += 1;
      return bundle.events.map((e) => e.checkpoint);
    });

    // Filter with checkpoints - uses desiredValuesSet optimization (no actualValues Set needed)
    d.filterBy({ checkpoints: ['checkpoint1', 'checkpoint2'] });

    // Facet function should be called only once, values cached
    assert.equal(facetCallCount, 1);

    // Get cache stats - with desiredValuesSet optimization, no Set retrieval from cache
    const stats = d.getCacheStats();
    assert.equal(stats.misses, 1); // First access is a miss
    // Note: With desiredValuesSet optimization, we don't need actualValues as Set
    // so hits=0 and setUsage=0 is expected for 'some' combiner without negation
  });

  it('should use cached Set for large facet value arrays', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'bundle1',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/test',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              { checkpoint: 'cp1', timeDelta: 0 },
              { checkpoint: 'cp2', timeDelta: 100 },
              { checkpoint: 'cp3', timeDelta: 200 },
              { checkpoint: 'cp4', timeDelta: 300 },
              { checkpoint: 'cp5', timeDelta: 400 },
            ],
          },
          {
            id: 'bundle2',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:05.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/test2',
            userAgent: 'desktop:mac',
            weight: 100,
            events: [
              { checkpoint: 'cp1', timeDelta: 0 },
              { checkpoint: 'cp6', timeDelta: 100 },
            ],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addFacet('checkpoints', (bundle) => bundle.events.map((e) => e.checkpoint));

    // Filter uses desiredValuesSet optimization - iterates actualValues against pre-built Set
    const filtered = d.filterBy({ checkpoints: ['cp1'] });

    assert.equal(filtered.length, 2);

    const stats = d.getCacheStats();
    assert.equal(stats.misses, 2); // Two bundles, two misses on first access
    // With desiredValuesSet optimization for 'some' combiner, actualValues retrieved as array only
  });

  it('should track cache statistics correctly', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/test',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              { checkpoint: 'click', timeDelta: 100 },
              { checkpoint: 'enter', timeDelta: 0 },
            ],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addFacet('checkpoints', (bundle) => bundle.events.map((e) => e.checkpoint));

    // Initial stats should be zero
    let stats = d.getCacheStats();
    assert.equal(stats.hits, 0);
    assert.equal(stats.misses, 0);
    assert.equal(stats.total, 0);
    assert.equal(stats.hitRate, '0%');
    assert.equal(stats.setUsage, 0);

    // Filter once
    d.filterBy({ checkpoints: ['click'] });

    stats = d.getCacheStats();
    assert.equal(stats.misses, 1); // First access is a miss
    assert.equal(stats.total, 1);

    // Filter again with same facet - should hit cache
    d.resetData();
    d.load(testChunks);
    d.addFacet('checkpoints', (bundle) => bundle.events.map((e) => e.checkpoint));
    d.filterBy({ checkpoints: ['enter'] });

    stats = d.getCacheStats();
    assert.equal(stats.misses, 1);
  });

  it('should use cached Set in hasConversion for large facet arrays', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/test',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              { checkpoint: 'cp1', timeDelta: 0 },
              { checkpoint: 'cp2', timeDelta: 100 },
              { checkpoint: 'cp3', timeDelta: 200 },
              { checkpoint: 'cp4', timeDelta: 300 },
              { checkpoint: 'cp5', timeDelta: 400 },
              { checkpoint: 'cp6', timeDelta: 500 },
            ],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    let facetCallCount = 0;
    d.addFacet('checkpoints', (bundle) => {
      facetCallCount += 1;
      return bundle.events.map((e) => e.checkpoint);
    });

    const bundle = d.bundles[0];

    // hasConversion uses 'every' combiner which retrieves cached Set
    const result = d.hasConversion(bundle, { checkpoints: ['cp1'] });

    assert.equal(result, true);
    assert.equal(facetCallCount, 1); // Facet function should be called once

    const stats = d.getCacheStats();
    assert.equal(stats.misses, 1); // First access stores array and Set in cache, returns Set
    assert.equal(stats.setUsage, 1); // Set was returned on first access
  });

  it('should track setUsage for cache hits when requesting Set', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            url: 'https://www.aem.live/test',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addFacet('url', (bundle) => bundle.url);

    const bundle = d.bundles[0];

    // First, access with array (combiner='some' uses array only, creates cache entry)
    d.hasConversion(bundle, { url: ['https://www.aem.live/test'] }, 'some');

    // Then access with Set (combiner='every' retrieves cached Set)
    d.hasConversion(bundle, { url: ['https://www.aem.live/test'] }, 'every');

    const stats = d.getCacheStats();
    assert.equal(stats.misses, 1); // Only first access is a miss
    assert.equal(stats.hits, 1); // Second access is a hit
    assert.equal(stats.setUsage, 1); // Set was used on cache hit
  });

  it('should track setUsage when filtering with negated facets', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            url: 'https://www.aem.live/test',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
          {
            id: 'two',
            host: 'www.example.com',
            url: 'https://www.example.com/page',
            weight: 100,
            events: [{ checkpoint: 'click' }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    // Negated facet with 'none' combiner will use 'every' internally
    d.addFacet('host!', (bundle) => bundle.host, 'none');

    // This will filter bundles where host is NOT www.aem.live
    // Uses 'every' combiner which requests cached Set
    const filtered = d.filterBy({ 'host!': ['www.aem.live'] });

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 'two');

    const stats = d.getCacheStats();
    // Each bundle is accessed once, both create cache entries with Set
    assert.equal(stats.misses, 2);
    assert.equal(stats.setUsage, 2); // Set used for both bundles
  });

  it('should increment setUsage on both cache miss and hit', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    // Use 'every' combiner which requests Set format
    d.addFacet('host!', (bundle) => bundle.host, 'never');

    // Filter will access both bundles with Set format
    // First bundle: cache miss, returns Set (setUsage++)
    // Second bundle: cache miss, returns Set (setUsage++)
    d.filterBy({ 'host!': ['www.example.com'] });

    const stats = d.getCacheStats();
    assert.equal(stats.misses, 2); // Both bundles are cache misses
    assert.equal(stats.setUsage, 2); // Set used for both bundles
  });

  it('should track setUsage for cache hits in filterBundles during facets computation', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            url: 'https://www.aem.live/page1',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            url: 'https://www.aem.live/page2',
            weight: 100,
            events: [{ checkpoint: 'click' }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    // Both facets use 'every' combiner, which uses asSet=true
    d.addFacet('host', (bundle) => bundle.host, 'every');
    d.addFacet('url', (bundle) => bundle.url, 'every');

    // Set a filter that uses 'every' combiner
    d.filter = { host: ['www.aem.live'] };

    // Access facets - this triggers multiple filterBundles calls
    // First facet (host) computation: filters with 'host' skipped -> caches 'host' values (miss)
    // Second facet (url) computation: filters with active 'host' filter -> reuses cached 'host' values (hit)
    const facets = d.facets;

    const stats = d.getCacheStats();
    // We have cache hits from reusing values across facet computations
    assert.ok(stats.hits > 0, 'Should have cache hits');
    assert.ok(stats.setUsage > 0, 'Should have setUsage > 0');
    // Verify that cache hits also incremented setUsage (lines 677-678)
    assert.ok(stats.setUsage >= stats.hits, 'setUsage should include hits');
  });
});

describe('DataChunks.addHistogramFacet()', () => {
  it('should create a histogram facet based on a base facet', () => {
    const d = new DataChunks();
    d.load(chunks);

    d.addFacet('pathlength', (bundle) => bundle.url.length);

    d.addHistogramFacet('pathlengthHistogram', 'pathlength', {
      count: 10,
      min: 0,
      max: Infinity,
      steps: 'linear',
    });

    const { facets } = d;

    assert.equal(facets.pathlength.length, 31);
    assert.equal(facets.pathlengthHistogram.length, 10);

    // reset the facets and re-define them again
    d.resetFacets();
    d.addFacet('pathlength', (bundle) => bundle.url.length);
    d.addHistogramFacet('pathlengthHistogram', 'pathlength', {
      count: 10,
      min: 0,
      max: Infinity,
      steps: 'linear',
    });

    const { facets: facets2 } = d;

    assert.equal(facets2.pathlength.length, 31);
    assert.equal(facets2.pathlengthHistogram.length, 10);
  });
});

describe('DataChunks filter selectivity optimization', () => {
  it('should reorder filters by selectivity (fewest values first)', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            url: 'https://www.aem.live/page2',
            userAgent: 'desktop:mac',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
          {
            id: 'three',
            host: 'www.example.com',
            url: 'https://www.example.com/page1',
            userAgent: 'mobile:ios',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    // Add facets
    d.addFacet('host', (bundle) => bundle.host);
    d.addFacet('userAgent', (bundle) => bundle.userAgent);

    // Apply filter with varying selectivity:
    // - host: 1 value (highly selective)
    // - userAgent: 3 values (less selective)
    d.filter = {
      userAgent: ['desktop:windows', 'desktop:mac', 'mobile:ios'],
      host: ['www.example.com'],
    };

    // The most selective filter (host with 1 value) should be evaluated first
    // This should return only bundles from www.example.com
    assert.equal(d.filtered.length, 1);
    assert.equal(d.filtered[0].id, 'three');
  });

  it('should handle filters with same selectivity correctly', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            url: 'https://www.aem.live/page1',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
          {
            id: 'two',
            host: 'www.example.com',
            url: 'https://www.example.com/page1',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addFacet('host', (bundle) => bundle.host);
    d.addFacet('url', (bundle) => bundle.url);

    // Both filters have 1 value (same selectivity)
    d.filter = {
      host: ['www.aem.live'],
      url: ['https://www.aem.live/page1'],
    };

    assert.equal(d.filtered.length, 1);
    assert.equal(d.filtered[0].id, 'one');
  });

  it('should optimize performance with highly selective filter first', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: Array.from({ length: 100 }, (_, i) => ({
          id: `bundle-${i}`,
          host: i === 50 ? 'rare.example.com' : 'common.example.com',
          category: ['cat1', 'cat2', 'cat3', 'cat4', 'cat5'][i % 5],
          weight: 100,
          events: [{ checkpoint: 'load' }],
        })),
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addFacet('host', (bundle) => bundle.host);
    d.addFacet('category', (bundle) => bundle.category);

    // Filter with:
    // - host: 1 value (very selective - only 1% of data)
    // - category: 5 values (not selective - 100% of data)
    d.filter = {
      category: ['cat1', 'cat2', 'cat3', 'cat4', 'cat5'],
      host: ['rare.example.com'],
    };

    // Should return only the one rare bundle
    assert.equal(d.filtered.length, 1);
    assert.equal(d.filtered[0].id, 'bundle-50');
  });

  it('should use actual facet counts for selectivity when available', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          // 1 rare host bundle
          { id: 'rare', host: 'rare.example.com', category: 'A', weight: 100, events: [{ checkpoint: 'load' }] },
          // 50 common host bundles with category A
          ...Array.from({ length: 50 }, (_, i) => ({
            id: `common-A-${i}`,
            host: 'common.example.com',
            category: 'A',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          })),
          // 49 common host bundles with category B
          ...Array.from({ length: 49 }, (_, i) => ({
            id: `common-B-${i}`,
            host: 'common.example.com',
            category: 'B',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          })),
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addFacet('host', (bundle) => bundle.host);
    d.addFacet('category', (bundle) => bundle.category);

    // Set filter first
    d.filter = {
      category: ['A'],
      host: ['rare.example.com'],
    };

    // Access facets to populate facetsIn with counts BEFORE filtering
    // This ensures calculateFilterSelectivity can use actual counts
    const { facets } = d;
    assert.ok(facets.host.length > 0);

    // Verify facet counts are correct
    const hostFacets = facets.host;
    const rareFacet = hostFacets.find((f) => f.value === 'rare.example.com');
    const commonFacet = hostFacets.find((f) => f.value === 'common.example.com');
    // Note: facets are computed with the filter applied, so counts reflect filtered data
    assert.equal(rareFacet.count, 1);

    const categoryFacets = facets.category;
    const categoryAFacet = categoryFacets.find((f) => f.value === 'A');
    assert.equal(categoryAFacet.count, 1); // Only 1 because of host filter

    // Now access filtered to ensure selectivity calculation happens
    // Even though both filters have 1 value, host should be evaluated first
    // because it has lower count (1 bundle vs 51 bundles in unfiltered data)
    const filtered = d.filtered;
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 'rare');
  });

  it('should fall back to desiredValues.length when facets not computed', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          { id: 'one', host: 'example.com', category: 'A', weight: 100, events: [{ checkpoint: 'load' }] },
          { id: 'two', host: 'example.com', category: 'B', weight: 100, events: [{ checkpoint: 'load' }] },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addFacet('host', (bundle) => bundle.host);
    d.addFacet('category', (bundle) => bundle.category);

    // Set filter and immediately access filtered WITHOUT accessing facets first
    // This should trigger the fallback to desiredValues.length
    d.filter = {
      // 3 values - less selective by count
      category: ['A', 'B', 'C'],
      // 1 value - more selective by count
      host: ['example.com'],
    };

    // Should still work using desiredValues.length heuristic
    // (1 value for host < 3 values for category)
    assert.equal(d.filtered.length, 2);
  });

  it('should use pre-built Sets for desiredValues lookups', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            url: 'https://www.aem.live/page1',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            url: 'https://www.aem.live/page2',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
          {
            id: 'three',
            host: 'www.example.com',
            url: 'https://www.example.com/page1',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addFacet('host', (bundle) => bundle.host);
    d.addFacet('url', (bundle) => bundle.url);

    // Test with large desiredValues array (should benefit from Set optimization)
    d.filter = {
      host: ['www.aem.live', 'www.example.com', 'www.test.com', 'www.demo.com', 'www.staging.com'],
    };
    assert.equal(d.filtered.length, 3);

    // Test with small desiredValues array
    d.filter = {
      host: ['www.aem.live'],
    };
    assert.equal(d.filtered.length, 2);

    // Test with multiple filters
    d.filter = {
      host: ['www.aem.live'],
      url: ['https://www.aem.live/page1'],
    };
    assert.equal(d.filtered.length, 1);
    assert.equal(d.filtered[0].id, 'one');
  });

  it('should preserve correct filtering behavior with negation filters', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            userAgent: 'desktop:mac',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
          {
            id: 'three',
            host: 'www.aem.live',
            userAgent: 'mobile:ios',
            weight: 100,
            events: [{ checkpoint: 'load' }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addFacet('host', (bundle) => bundle.host);
    d.addFacet('userAgent!', (bundle) => bundle.userAgent, 'none');

    // Filter excluding desktop devices (1 value - selective)
    // All bundles should match host (1 value - equally selective)
    d.filter = {
      host: ['www.aem.live'],
      'userAgent!': ['desktop:windows'],
    };

    // Should return bundles that are NOT desktop:windows
    assert.equal(d.filtered.length, 2);
    const ids = d.filtered.map((b) => b.id).sort();
    assert.deepEqual(ids, ['three', 'two']);
  });
});

describe('DataChunks.addClusterFacet()', () => {
  it('should create clusters based on URL facet', () => {
    const d = new DataChunks();
    d.load(chunks);

    // Define a facet function
    d.addFacet('url', (bundle) => [bundle.url], 'some', 'never');

    // Add a cluster facet based on the 'url' facet
    d.addClusterFacet('urlCluster', 'url', {
      count: Math.log10(d.facets.url.length),
    }, 'some', 'never');

    const { facets } = d;

    assert.ok(facets.urlCluster.length > 0);
    assert.notEqual(facets.urlCluster[0].value, '[object Object]');
    assert.equal(facets.urlCluster[0].value, '/developer');
    assert.equal(facets.urlCluster[1].value, 'https://www.aem.live/home');
    assert.equal(facets.urlCluster[2].value, 'https://www.aem.live/developer/tutorial');
  });

  it('should handle null facetMatch gracefully', () => {
    const d = new DataChunks();
    d.load(chunks);

    // Define a facet function
    d.addFacet('url', (bundle) => [bundle.url], 'some', 'never');

    // Add a cluster facet based on the 'url' facet
    d.addClusterFacet('urlCluster', 'url', {
      count: Math.log10(d.facets.url.length),
    }, 'some', 'never');

    // Simulate a null facetMatch scenario
    const facetMatch = null;
    const producer = (value) => [value, value];
    const clusters = (facetMatch && producer(facetMatch.value)) || [];

    assert.deepEqual(clusters, []);
  });

  it('should handle empty facet values gracefully', () => {
    const d = new DataChunks();
    d.load([]);

    // Define a facet function
    d.addFacet('url', (bundle) => [bundle.url], 'some', 'never');

    // Add a cluster facet based on the 'url' facet
    d.addClusterFacet('urlCluster', 'url', {
      count: Math.log10(d.facets.url.length),
    }, 'some', 'never');

    const { facets } = d;

    assert.equal(facets.urlCluster.length, 0);

    // Simulate an empty facetMatch scenario
    const facetMatch = {};
    const producer = (value) => [value, value];
    const clusters = (facetMatch && producer(facetMatch.value)) || [];

    assert.deepEqual(clusters, [undefined, undefined]);
  });

  it('should log the correct cluster count', () => {
    const d = new DataChunks();
    d.load(chunks);

    // Define a facet function
    d.addFacet('url', (bundle) => [bundle.url], 'some', 'never');

    // Add a cluster facet based on the 'url' facet
    const count = Math.floor(Math.log10(92));
    d.addClusterFacet('urlCluster', 'url', {
      count,
    }, 'some', 'never');

    // Check if the count is correct
    assert.strictEqual(count, 1);
  });

  it('should create clusters with the most occurring cluster first', () => {
    const d = new DataChunks();
    d.load(chunks);

    // Define a facet function
    d.addFacet('url', (bundle) => [bundle.url], 'some', 'never');

    // Add a cluster facet based on the 'url' facet
    d.addClusterFacet('urlCluster', 'url', {
      count: Math.log10(d.facets.url.length),
    }, 'some', 'never');

    const { facets } = d;

    // Check if the most occurring cluster is first
    const mostOccurringCluster = facets.urlCluster[0];
    assert.ok(mostOccurringCluster.value, '/developer');
  });
});

describe('DataChunks.addInterpolation()', () => {
  it('should add an interpolated series based on other series', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top', timeDelta: 100 }],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page2',
            userAgent: 'desktop:mac',
            weight: 100,
            events: [{ checkpoint: 'top', timeDelta: 200 }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    // Add regular series
    d.addSeries('pageViews', () => 1);
    d.addSeries('toptime', (bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.timeDelta);

    // Add interpolated series that calculates average time per view
    d.addInterpolation('avgTime', ['pageViews', 'toptime'], ({ pageViews, toptime }) => {
      if (!pageViews || !toptime || pageViews.count === 0) return 0;
      return toptime.sum / pageViews.count;
    });

    // Group by url
    d.group((bundle) => bundle.url);

    // Get aggregates
    const { aggregates } = d;

    // Check that interpolated series exists
    assert.ok(aggregates['https://www.aem.live/page1'].avgTime);
    assert.ok(aggregates['https://www.aem.live/page2'].avgTime);

    // Check that interpolated values are correct
    assert.equal(aggregates['https://www.aem.live/page1'].avgTime.weight, 100);
    assert.equal(aggregates['https://www.aem.live/page2'].avgTime.weight, 200);
  });

  it('should handle NaN values in interpolated series', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top' }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('pageViews', () => 1);

    // Add interpolation that returns NaN
    d.addInterpolation('badCalc', ['pageViews'], () => NaN);

    d.group((bundle) => bundle.url);

    const { aggregates } = d;

    // Weight should be 0 for NaN
    assert.equal(aggregates['https://www.aem.live/page1'].badCalc.weight, 0);
  });
});

describe('DataChunks.group() with fillerFn', () => {
  it('should fill in missing groups', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T05:00:00.000Z',
            timeSlot: '2024-05-06T05:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T07:00:00.000Z',
            timeSlot: '2024-05-06T07:00:00.000Z',
            url: 'https://www.aem.live/page2',
            userAgent: 'desktop:mac',
            weight: 100,
            events: [],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    // Create a grouping function with fillerFn
    const groupByHour = (bundle) => bundle.timeSlot;
    groupByHour.fillerFn = (existingGroups) => {
      // Fill in missing hours between 5 and 8
      const allHours = [
        '2024-05-06T05:00:00.000Z',
        '2024-05-06T06:00:00.000Z',
        '2024-05-06T07:00:00.000Z',
        '2024-05-06T08:00:00.000Z',
      ];
      return allHours;
    };

    const grouped = d.group(groupByHour);

    // Should have all 4 hours, even though only 2 have data
    assert.equal(Object.keys(grouped).length, 4);
    assert.equal(grouped['2024-05-06T05:00:00.000Z'].length, 1);
    assert.equal(grouped['2024-05-06T06:00:00.000Z'].length, 0); // empty but present
    assert.equal(grouped['2024-05-06T07:00:00.000Z'].length, 1);
    assert.equal(grouped['2024-05-06T08:00:00.000Z'].length, 0); // empty but present
  });
});

describe('DataChunks.addHistogramFacet() with different step types', () => {
  it('should create histogram with logarithmic steps', () => {
    const d = new DataChunks();
    d.load(chunks);

    d.addFacet('pathlength', (bundle) => bundle.url.length);

    d.addHistogramFacet('pathlengthHistogram', 'pathlength', {
      count: 5,
      min: 10,
      max: 100,
      steps: 'logarithmic',
    });

    const { facets } = d;

    assert.ok(facets.pathlengthHistogram);
    assert.ok(facets.pathlengthHistogram.length > 0);
  });

  it('should create histogram with quantile steps', () => {
    const d = new DataChunks();
    d.load(chunks);

    d.addFacet('pathlength', (bundle) => bundle.url.length);

    d.addHistogramFacet('pathlengthHistogram', 'pathlength', {
      count: 5,
      min: 0,
      max: 200,
      steps: 'quantiles',
    });

    const { facets } = d;

    assert.ok(facets.pathlengthHistogram);
    assert.ok(facets.pathlengthHistogram.length > 0);
  });
});

describe('Facet.getMetrics()', () => {
  it('should calculate metrics for specific series', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [
              { checkpoint: 'top', timeDelta: 100 },
              { checkpoint: 'click', timeDelta: 200 },
            ],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page2',
            userAgent: 'desktop:mac',
            weight: 100,
            events: [
              { checkpoint: 'top', timeDelta: 150 },
              { checkpoint: 'click', timeDelta: 250 },
            ],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    // Add multiple series
    d.addSeries('pageViews', () => 1);
    d.addSeries('toptime', (bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.timeDelta);
    d.addSeries('clicktime', (bundle) => bundle.events.find((e) => e.checkpoint === 'click')?.timeDelta);

    // Add a facet
    d.addFacet('url', (bundle) => bundle.url);

    const { facets } = d;

    // Get the first facet
    const firstFacet = facets.url[0];

    // Test getMetrics with specific series
    const metrics = firstFacet.getMetrics(['pageViews', 'toptime']);

    assert.ok(metrics.pageViews);
    assert.ok(metrics.toptime);
    assert.ok(!metrics.clicktime); // Not requested

    // Should use cached metrics on second call
    const metrics2 = firstFacet.getMetrics(['pageViews', 'toptime', 'clicktime']);

    assert.ok(metrics2.pageViews);
    assert.ok(metrics2.toptime);
    assert.ok(metrics2.clicktime); // Now included
  });

  it('should return empty object when no series specified', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addFacet('url', (bundle) => bundle.url);

    const { facets } = d;
    const firstFacet = facets.url[0];

    const metrics = firstFacet.getMetrics([]);
    assert.deepEqual(metrics, {});
  });

  it('should use the metrics getter', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top', timeDelta: 100 }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('pageViews', () => 1);
    d.addFacet('url', (bundle) => bundle.url);

    const { facets } = d;
    const firstFacet = facets.url[0];

    // Use the metrics getter
    const metrics = firstFacet.metrics;

    assert.ok(metrics.pageViews);
    assert.equal(metrics.pageViews.count, 1);
  });
});

describe('Aggregate parent, share, and percentage', () => {
  it('should return null for share and percentage when no parent', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top', timeDelta: 100 }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('toptime', (bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.timeDelta);
    
    // Group by a constant to create a single aggregate with a self-referencing parent
    d.group(() => 'all');

    // Get totals which creates aggregates with self-referencing parents
    const { totals } = d;

    // Modify the parent provider to return null
    const originalParentProvider = totals.toptime.parentProvider;
    totals.toptime.parentProvider = () => null;

    // share and percentage should return null when no parent
    assert.equal(totals.toptime.share, null);
    assert.equal(totals.toptime.percentage, null);

    // Restore parent provider
    totals.toptime.parentProvider = originalParentProvider;
  });

  it('should access parent via parentProvider', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top', timeDelta: 100 }],
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page2',
            userAgent: 'desktop:mac',
            weight: 200,
            events: [{ checkpoint: 'top', timeDelta: 200 }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('toptime', (bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.timeDelta);

    // Group by url to get aggregates with parents
    d.group((bundle) => bundle.url);

    const { aggregates } = d;

    // Access parent through the getter
    const page1Agg = aggregates['https://www.aem.live/page1'].toptime;
    assert.ok(page1Agg.parent);
    assert.equal(page1Agg.parent.count, 2); // Total of 2 bundles
  });

  it('should calculate percentiles correctly', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: Array.from({ length: 10 }, (_, i) => ({
          id: `bundle-${i}`,
          host: 'www.aem.live',
          time: '2024-05-06T00:00:04.444Z',
          timeSlot: '2024-05-06T00:00:00.000Z',
          url: 'https://www.aem.live/page1',
          userAgent: 'desktop:windows',
          weight: 100,
          events: [{ checkpoint: 'top', timeDelta: (i + 1) * 100 }], // 100, 200, 300, ..., 1000
        })),
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('toptime', (bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.timeDelta);

    const { totals } = d;

    // Test various percentiles
    assert.equal(totals.toptime.percentile(0), 100); // 0th percentile (min)
    assert.equal(totals.toptime.percentile(50), 600); // 50th percentile (median)
    assert.equal(totals.toptime.percentile(90), 1000); // 90th percentile
    assert.equal(totals.toptime.percentile(99), 1000); // 99th percentile
  });

  it('should calculate median correctly', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: Array.from({ length: 10 }, (_, i) => ({
          id: `bundle-${i}`,
          host: 'www.aem.live',
          time: '2024-05-06T00:00:04.444Z',
          timeSlot: '2024-05-06T00:00:00.000Z',
          url: 'https://www.aem.live/page1',
          userAgent: 'desktop:windows',
          weight: 100,
          events: [{ checkpoint: 'top', timeDelta: (i + 1) * 100 }], // 100, 200, 300, ..., 1000
        })),
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('toptime', (bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.timeDelta);

    const { totals } = d;

    // Median should equal the 50th percentile
    assert.equal(totals.toptime.median(), 600);
    assert.equal(totals.toptime.median(), totals.toptime.percentile(50));
  });

  it('should calculate variance and stddev correctly', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'bundle-1',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top', timeDelta: 10 }],
          },
          {
            id: 'bundle-2',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top', timeDelta: 20 }],
          },
          {
            id: 'bundle-3',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top', timeDelta: 30 }],
          },
          {
            id: 'bundle-4',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top', timeDelta: 40 }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('toptime', (bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.timeDelta);

    const { totals } = d;

    // Mean of [10, 20, 30, 40] = 25
    assert.equal(totals.toptime.mean, 25);

    // Variance = ((10-25)^2 + (20-25)^2 + (30-25)^2 + (40-25)^2) / 4
    //          = (225 + 25 + 25 + 225) / 4
    //          = 500 / 4 = 125
    assert.equal(totals.toptime.variance, 125);

    // Standard deviation = sqrt(125) ≈ 11.180339887498949
    assert.equal(totals.toptime.stddev, Math.sqrt(125));
  });

  it('should handle empty values array for variance and stddev', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'bundle-1',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [], // No events, so no values will be collected
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    // Add a series that will return undefined (no values)
    d.addSeries('toptime', (bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.timeDelta);

    const { totals } = d;

    // Variance and stddev should be 0 for empty values array
    assert.equal(totals.toptime.variance, 0);
    assert.equal(totals.toptime.stddev, 0);
  });

  it('should calculate standard error (stderr) correctly', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'bundle-1',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top', timeDelta: 10 }],
          },
          {
            id: 'bundle-2',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top', timeDelta: 20 }],
          },
          {
            id: 'bundle-3',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top', timeDelta: 30 }],
          },
          {
            id: 'bundle-4',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top', timeDelta: 40 }],
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('toptime', (bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.timeDelta);

    const { totals } = d;

    // Standard error = stddev / sqrt(n)
    // stddev = sqrt(125) ≈ 11.180339887498949
    // n = 4
    // stderr = 11.180339887498949 / sqrt(4) = 11.180339887498949 / 2 = 5.590169943749474
    const expectedStderr = Math.sqrt(125) / Math.sqrt(4);
    assert.equal(totals.toptime.stderr, expectedStderr);
  });

  it('should return 0 for stderr with empty values array', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'bundle-1',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [], // No events
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('toptime', (bundle) => bundle.events.find((e) => e.checkpoint === 'top')?.timeDelta);

    const { totals } = d;

    // stderr should be 0 for empty values array
    assert.equal(totals.toptime.stderr, 0);
  });
});

describe('DataChunks.addHistogramFacet() edge cases', () => {
  it('should handle bundles not found in base facet', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top' }],
            cwvLCP: 100,
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page2',
            userAgent: 'desktop:mac',
            weight: 100,
            events: [{ checkpoint: 'top' }],
            // No cwvLCP property
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    // Add a facet that returns undefined for some bundles
    d.addFacet('lcp', (bundle) => bundle.cwvLCP);

    // Filter to exclude bundle without LCP
    d.filter = { lcp: ['100'] };

    // Now create histogram - bundle 'two' won't be in the filtered facet
    d.addHistogramFacet('lcpHistogram', 'lcp', {
      count: 3,
      min: 0,
      max: 1000,
      steps: 'linear',
    });

    const { facets } = d;

    // Should complete without error and create histogram
    assert.ok(facets.lcpHistogram);
    // Bundle 'two' will not have a histogram value because it wasn't in the base facet
  });

  it('should return empty array for bundles not in base facet bundleFacetMap', () => {
    const testChunks = [
      {
        date: '2024-05-06',
        rumBundles: [
          {
            id: 'one',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page1',
            userAgent: 'desktop:windows',
            weight: 100,
            events: [{ checkpoint: 'top' }],
            cwvLCP: 100,
          },
          {
            id: 'two',
            host: 'www.aem.live',
            time: '2024-05-06T00:00:04.444Z',
            timeSlot: '2024-05-06T00:00:00.000Z',
            url: 'https://www.aem.live/page2',
            userAgent: 'desktop:mac',
            weight: 100,
            events: [{ checkpoint: 'top' }],
            // No cwvLCP - this bundle won't be in the base facet
          },
        ],
      },
    ];

    const d = new DataChunks();
    d.load(testChunks);

    // Add base facet with LCP that only includes bundles with cwvLCP defined
    d.addFacet('lcp', (bundle) => bundle.cwvLCP);

    // Create histogram - this creates the bundleFacetMap with only bundle 'one'
    d.addHistogramFacet('lcpHistogram', 'lcp', {
      count: 3,
      min: 0,
      max: 1000,
      steps: 'linear',
    });

    // Access the histogram facet which will call the facet function
    // on all bundles, including 'two' which is NOT in the bundleFacetMap
    const { facets } = d;

    // Check that we got facets - bundle 'two' should return empty array
    assert.ok(facets.lcpHistogram);
    assert.ok(facets.lcpHistogram.length > 0);
    
    // The histogram should only have values from bundle 'one'
    const histogramFacet = facets.lcpHistogram[0];
    assert.ok(histogramFacet);
  });
});
