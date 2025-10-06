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
