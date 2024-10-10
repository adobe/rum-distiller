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
import {
  pageViews, visits, bounces, lcp, cls, inp, ttfb, engagement, earned, organic,
} from '../series.js';

describe('series:pageViews', () => {
  it('pageViews:bare', () => {
    assert.equal(pageViews({ weight: 1 }), 1);
  });

  it('pageViews:DataChunks', () => {
    const testFile = new URL('cruncher.fixture.json', import.meta.url);
    const testChunks = JSON.parse(readFileSync(testFile));
    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('pageViews', pageViews);
    assert.equal(d.totals.pageViews.sum, 89322);
  });
});

describe('series:visits', () => {
  it('visits:bare', () => {
    assert.equal(visits({ weight: 1 }), 0);
    assert.equal(visits({ weight: 1, visit: true }), 1);
  });

  it('visits:DataChunks', () => {
    const testFile = new URL('cruncher.fixture.json', import.meta.url);
    const testChunks = JSON.parse(readFileSync(testFile));
    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('visits', visits);
    assert.equal(d.totals.visits.sum, 27006);
  });
});

describe('series:bounces', () => {
  it('bounces:bare', () => {
    assert.equal(bounces({ weight: 1 }), 0);
    assert.equal(bounces({ weight: 1, visit: true, events: [] }), 1);
    assert.equal(bounces({ weight: 1, visit: true, events: [{ checkpoint: 'click' }] }), 0);
  });

  it('bounces:DataChunks', () => {
    const testFile = new URL('cruncher.fixture.json', import.meta.url);
    const testChunks = JSON.parse(readFileSync(testFile));
    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('bounces', bounces);
    assert.equal(d.totals.bounces.sum, 16304);
  });
});

describe('series:lcp', () => {
  it('lcp:bare', () => {
    assert.equal(lcp({ weight: 1 }), undefined);
    assert.equal(lcp({ weight: 1, cwvLCP: 2500 }), 2500);
  });

  it('lcp:DataChunks', () => {
    const testFile = new URL('cruncher.fixture.json', import.meta.url);
    const testChunks = JSON.parse(readFileSync(testFile));
    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('lcp', lcp);
    assert.equal(Math.floor(d.totals.lcp.percentile(75)), 1134);
  });
});

describe('series:cls', () => {
  it('cls:bare', () => {
    assert.equal(cls({ weight: 1 }), undefined);
    assert.equal(cls({ weight: 1, cwvCLS: 0.1 }), 0.1);
  });

  it('cls:DataChunks', () => {
    const testFile = new URL('cruncher.fixture.json', import.meta.url);
    const testChunks = JSON.parse(readFileSync(testFile));
    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('cls', cls);
    assert.equal(Math.floor(d.totals.cls.percentile(75) * 100) / 100, 0);
  });
});

describe('series:inp', () => {
  it('inp:bare', () => {
    assert.equal(inp({ weight: 1 }), undefined);
    assert.equal(inp({ weight: 1, cwvINP: 1000 }), 1000);
  });

  it('inp:DataChunks', () => {
    const testFile = new URL('cruncher.fixture.json', import.meta.url);
    const testChunks = JSON.parse(readFileSync(testFile));
    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('inp', inp);
    assert.equal(Math.floor(d.totals.inp.percentile(75)), 24);
  });
});

describe('series:ttfb', () => {
  it('ttfb:bare', () => {
    assert.equal(ttfb({ weight: 1 }), undefined);
    assert.equal(ttfb({ weight: 1, cwvTTFB: 1000 }), 1000);
  });

  it('ttfb:DataChunks', () => {
    const testFile = new URL('cruncher.fixture.json', import.meta.url);
    const testChunks = JSON.parse(readFileSync(testFile));
    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('ttfb', ttfb);
    assert.equal(Math.floor(d.totals.ttfb.percentile(75)), 333);
  });
});

describe('series:engagement', () => {
  it('engagement:bare', () => {
    assert.equal(engagement({ weight: 1, events: [] }), 0);
    assert.equal(engagement({
      weight: 1,
      events: [
        { checkpoint: 'click' },
      ],
    }), 1);
    assert.equal(engagement({
      weight: 1,
      events: [
        { checkpoint: 'viewmedia' },
        { checkpoint: 'viewblock' },
        { checkpoint: 'viewblock' },
        { checkpoint: 'viewmedia' },
      ],
    }), 1);
  });

  it('engagement:DataChunks', () => {
    const testFile = new URL('cruncher.fixture.json', import.meta.url);
    const testChunks = JSON.parse(readFileSync(testFile));
    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('engagement', engagement);
    assert.equal(d.totals.engagement.sum, 36918);
  });
});

describe('series:earned', () => {
  it('earned:bare', () => {
    assert.equal(earned({ weight: 1, events: [] }), 0);
    assert.equal(earned({ weight: 1, events: [{ checkpoint: 'enter' }] }), 1);
    assert.equal(earned({ weight: 1, events: [{ checkpoint: 'enter' }, { checkpoint: 'acquisition', source: 'paid' }] }), 0);
    assert.equal(earned({ weight: 1, events: [{ checkpoint: 'enter' }, { checkpoint: 'acquisition', source: 'owned' }] }), 0);
    assert.equal(earned({ weight: 1, events: [{ checkpoint: 'enter' }, { checkpoint: 'acquisition', source: 'earned' }] }), 1);
  });

  it('earned:DataChunks', () => {
    const testFile = new URL('cruncher.fixture.json', import.meta.url);
    const testChunks = JSON.parse(readFileSync(testFile));
    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('earned', earned);
    assert.equal(d.totals.earned.sum, 27006);
  });
});

describe('series:organic', () => {
  it('organic:bare', () => {
    assert.equal(organic({ weight: 1, events: [] }), 0);
    assert.equal(organic({ weight: 1, events: [{ checkpoint: 'enter' }] }), 1);
    assert.equal(organic({ weight: 1, events: [{ checkpoint: 'enter' }, { checkpoint: 'acquisition', source: 'paid' }] }), 0);
    assert.equal(organic({ weight: 1, events: [{ checkpoint: 'enter' }, { checkpoint: 'acquisition', source: 'owned' }] }), 1);
    assert.equal(organic({ weight: 1, events: [{ checkpoint: 'enter' }, { checkpoint: 'acquisition', source: 'earned' }] }), 1);
  });

  it('organic:DataChunks', () => {
    const testFile = new URL('cruncher.fixture.json', import.meta.url);
    const testChunks = JSON.parse(readFileSync(testFile));
    const d = new DataChunks();
    d.load(testChunks);

    d.addSeries('organic', organic);
    assert.equal(d.totals.organic.sum, 27006);
  });
});
