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
import { facets, facetFns } from '../facets.js';
import { DataChunks } from '../distiller.js';
import { pageViews } from '../series.js';

const testFile = new URL('cruncher.fixture.json', import.meta.url);
const testChunks = JSON.parse(readFileSync(testFile));

describe('facets:userAgent', () => {
  it('userAgent:bare', () => {
    assert.deepEqual(facets.userAgent({ userAgent: 'foo' }), ['foo']);
    assert.deepEqual(facets.userAgent({ userAgent: 'desktop:windows' }), ['desktop', 'desktop:windows']);
  });

  it('userAgent:DataChunks', () => {
    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('userAgent', facets.userAgent);

    // 11 distinct user agents in total
    assert.equal(d.facets.userAgent.length, 11);
    // most common user agent is desktop
    assert.equal(d.facets.userAgent[0].value, 'desktop');
  });
});

describe('facets:url', () => {
  it('url:bare', () => {
    assert.equal(facets.url({ url: 'https://www.example.com/path/to/page' }), 'https://www.example.com/path/to/page');
    assert.equal(facets.url({ url: 'https://www.example.com/user/12345' }), `https://www.example.com/user/${encodeURIComponent('<number>')}`);
    assert.equal(facets.url({ url: 'https://www.example.com/hash/a1b2c3d4e5f6' }), `https://www.example.com/hash/${encodeURIComponent('<hex>')}`);
    assert.equal(facets.url({ url: 'https://www.example.com/path/to/page?query=string#fragment' }), 'https://www.example.com/path/to/page?query=string#fragment');
    // base64 encoded data in path
    assert.equal(facets.url({ url: 'https://www.example.com/path/VGVzdHMgYXJlIGtpbmRhIGltcG9ydGFudA==' }), `https://www.example.com/path/${encodeURIComponent('<base64>')}`);
    // uuid in path
    assert.equal(facets.url({ url: 'https://www.example.com/path/123e4567-e89b-12d3-a456-426614174000' }), `https://www.example.com/path/${encodeURIComponent('<uuid>')}`);
    // long path
    assert.equal(facets.url({ url: 'https://www.example.com/path/loremlipsumdolorsitametconsecteturadipiscingelit-1234567890-abcdefghijklmnopqrstuvwxyz' }), 'https://www.example.com/path/...');
    assert.equal(facets.url({ url: 'https://blog.adobe.com/en/publish/2024/09/11/bringing-gen-ai-to-video-adobe-firefly-video-model-coming-soon' }), 'https://blog.adobe.com/en/publish/2024/09/11/...');

    assert.equal(facets.url({ domain: 'custom.domain' }), 'custom.domain');
  });

  it('url:DataChunks', () => {
    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('url', facets.url);

    // Assert that we have facets for URL
    assert.ok(d.facets.url.length > 0);
    assert.equal(d.facets.url.length, 92);

    assert.equal(d.facets.url[0].value, 'https://www.aem.live/home');
  });
});

describe('facets:plainURL', () => {
  it('plainURL:bare', () => {
    assert.equal(facets.plainURL({ url: 'https://www.example.com/path/to/page' }), 'https://www.example.com/path/to/page');
    assert.equal(facets.plainURL({ url: 'https://www.example.com/user/12345' }), 'https://www.example.com/user/12345');
    assert.equal(facets.plainURL({ url: 'https://www.example.com/hash/a1b2c3d4e5f6' }), 'https://www.example.com/hash/a1b2c3d4e5f6');
    assert.equal(facets.plainURL({ url: 'https://www.example.com/path/to/page?query=string#fragment' }), 'https://www.example.com/path/to/page');
    assert.equal(facets.plainURL({ url: 'https://blog.adobe.com/en/publish/2024/09/11/bringing-gen-ai-to-video-adobe-firefly-video-model-coming-soon' }), 'https://blog.adobe.com/en/publish/2024/09/11/bringing-gen-ai-to-video-adobe-firefly-video-model-coming-soon');
  });
});

describe('facets:checkpoint', () => {
  it('checkpoint:bare', () => {
    assert.deepEqual(
      facets.checkpoint({ events: [{ checkpoint: 'consent' }] }),
      ['consent'],
    );
    assert.deepEqual(facets.checkpoint({
      events: [{ checkpoint: 'consent' }, { checkpoint: 'consent' }],
    }), ['consent']);
    assert.deepEqual(facets.checkpoint({
      events: [{ checkpoint: 'consent' }, { checkpoint: 'network' }],
    }), ['consent', 'network']);
  });

  it('checkpoint:DataChunks', () => {
    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('checkpoint', facets.checkpoint);

    assert.equal(d.facets.checkpoint.length, 30);
    assert.equal(d.facets.checkpoint[0].value, 'top');
  });
});

describe('facets:vitals', () => {
  it('vitals:bare', () => {
    assert.deepEqual(facets.vitals({ cwvLCP: 1000 }), ['goodLCP']);
  });

  it('vitals:DataChunks', () => {
    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('vitals', facets.vitals);

    assert.equal(d.facets.vitals.length, 9);
    assert.equal(d.facets.vitals[0].value, 'goodLCP');
  });
});

describe('facets:lcpTarget', () => {
  it('lcpTarget:bare', () => {
    assert.deepEqual(facets.lcpTarget({ events: [{ checkpoint: 'cwv-lcp', target: 'img' }] }), ['img']);
  });

  it('lcpTarget:DataChunks', () => {
    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('lcpTarget', facets.lcpTarget);

    assert.equal(d.facets.lcpTarget.length, 0);
  });
});

describe('facets:lcpSource', () => {
  it('lcpSource:bare', () => {
    assert.deepEqual(facets.lcpSource({ events: [{ checkpoint: 'cwv-lcp', source: 'img' }] }), ['img']);
  });

  it('lcpSource:DataChunks', () => {
    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('lcpSource', facets.lcpSource);

    assert.equal(d.facets.lcpSource.length, 0);
  });
});

describe('facets:acquisitionSource', () => {
  it('acquisitionSource:bare', () => {
    assert.deepEqual(facets.acquisitionSource({ events: [{ checkpoint: 'acquisition', source: 'paid:video:youtube' }] }), ['paid', 'paid:video', 'paid:video:youtube']);
  });

  it('acquisitionSource:DataChunks', () => {
    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('acquisitionSource', facets.acquisitionSource);

    assert.equal(d.facets.acquisitionSource.length, 0);
  });
});

describe('facets:mediaTarget', () => {
  it('mediaTarget:bare', () => {
    assert.deepEqual(facets.mediaTarget(
      {
        host: 'www.example.com',
        events: [{ checkpoint: 'viewmedia', target: 'https://www.example.com/image.png' }],
      },
    ), ['/image.png']);
    assert.deepEqual(facets.mediaTarget(
      {
        host: 'www.adobe.com',
        events: [{ checkpoint: 'viewmedia', target: 'https://www.example.com/image.png?query=string#fragment' }],
      },
    ), ['https://www.example.com/image.png']);
  });

  it('mediaTarget:DataChunks', () => {
    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('mediaTarget', facets.mediaTarget);

    assert.equal(d.facets.mediaTarget.length, 320);
    assert.equal(d.facets.mediaTarget[0].value, '/media_1645e7a92e9f8448d45e8b999afa71315cc52690b.png');
  });
});

describe('facets:checkpointSource', () => {
  it('checkpointSource:bare', () => {
    assert.deepEqual(
      facetFns.checkpointSource('enter')({
        events: [{ checkpoint: 'enter', source: 'https://www.example.com' }],
      }),
      ['https://www.example.com'],
    );
  });

  it('checkpointSource:DataChunks', () => {
    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('checkpointSource', facetFns.checkpointSource('enter'));

    assert.equal(d.facets.checkpointSource.length, 28);
    assert.equal(d.facets.checkpointSource[0].value, '(direct)');
  });
});

describe('facets:checkpointTarget', () => {
  it('checkpointTarget:bare', () => {
    assert.deepEqual(
      facetFns.checkpointTarget('click')({
        events: [{ checkpoint: 'click', target: 'https://www.example.com' }],
      }),
      ['https://www.example.com'],
    );
  });

  it('checkpointTarget:DataChunks', () => {
    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('checkpointTarget', facetFns.checkpointTarget('click'));

    assert.equal(d.facets.checkpointTarget.length, 116);
    assert.equal(d.facets.checkpointTarget[0].value, 'https://www.aem.live/developer/block-collection');
  });
});
