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
    assert.equal(facets.url({ url: 'https://www.example.com/path/loremlipsumdolorsitametconsecteturadipiscingelit.1234567890.abcdefghijklmnopqrstuvwxyz' }), 'https://www.example.com/path/...');
    assert.equal(facets.url({ url: 'https://www.example.com/path/loremlipsumdolorsitametconsecteturadipiscingelit-abcdefghijklmnopqrstuvwxyz' }), 'https://www.example.com/path/...');
    assert.equal(facets.url({ url: 'https://blog.adobe.com/en/publish/2024/09/11/bringing-gen-ai-to-video-adobe-firefly-video-model-coming-soon' }), 'https://blog.adobe.com/en/publish/2024/09/11/bringing-gen-ai-to-video-adobe-firefly-video-model-coming-soon');
    assert.equal(facets.url({ url: 'https://blog.adobe.com/en/publish/2024/09/11/bringing-gen-ai-to-video-adobe-firefly-video-model-coming-soon.html' }), 'https://blog.adobe.com/en/publish/2024/09/11/bringing-gen-ai-to-video-adobe-firefly-video-model-coming-soon.html');
    assert.equal(facets.url({ url: 'https://www.example.com/consumer84899324c8-5ef06d65eba5&cui=47cea5903b64448fad519184899324c8-5ef06d65eba5&EulaDt=20220413&expdt=20240918&hardware_id=c715069c77fa4b74040b459e3307c6d5&messageid=fbde7912-ef73-4793-bd1d-aec0aed2a945&pkgid=539&rcode=16.0+R122&resellerid=1357&rnwsrc=ngm&sessionid=7f3d8203' }), 'https://www.example.com/...');
    assert.equal(facets.url({ url: 'https://www.example.com/th/search/%E0%B9%80%E0%B8%AD%E0%B8%99%E0%B8%8A%E0%B8%B1%E0%B8%A7%E0%B8%A3%E0%B9%8C%20%E0%B9%82%E0%B8%81%E0%B8%A5%E0%B8%94%E0%B9%8C%20%E0%B8%AD%E0%B8%B2%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B8%B9%E0%B8%95%E0%B8%A3%E0%B8%84%E0%B8%A3%E0%B8%9A%E0%B8%96%E0%B9%89%E0%B8%A7%E0%B8%99' }), 'https://www.example.com/th/search/...');
    assert.equal(facets.url({ url: 'https://www.example.com/it_it/catalog/product_compare/index/uenc/aHR0cHM6Ly93d3cucGFzc2lvbmViZWF1dHkuY29tL2l0X2l0L2N1c3RvbWVyL3NlY3Rpb24vbG9hZC8_Xz0xNzMxMDY4Nzg3NjQxJmZvcmNlX25ld19zZWN0aW9uX3RpbWVzdGFtcD1mYWxzZSZzZWN0aW9ucz1jdXN0b21lciUyQ2NvbXBhcmUtcHJvZHVjdHMlMkNsYXN0LW9yZGVyZWQtaXRlbXMlMkNj' }), 'https://www.example.com/it_it/catalog/product_compare/index/uenc/...');
    assert.equal(facets.url({ url: 'https://www.example.com/en/misc/car-configurator.html/navigate/614b81df27aa19e8c740599546d9cf2d/configuration/continental_gt/continental-gt-speed-first-edition/byPRs007F4561RjE0IDY2MDEtRjU2ICAgICA5OS1HUEJMUEJMLUdQQ1JQQ1ItR1BGOFBGOC1HUEZNUEZNLUdQR0xQR0wtR1BJTFBJTC1HUExQUExQLUdSRDhSRDgtR1RGSVpXL' }), `https://www.example.com/en/misc/car-configurator.html/navigate/${encodeURIComponent('<hex>')}/configuration/continental_gt/continental-gt-speed-first-edition/${encodeURIComponent('<base64>')}`);

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
    // base64 encoded data in path
    assert.equal(facets.plainURL({ url: 'https://www.example.com/path/VGVzdHMgYXJlIGtpbmRhIGltcG9ydGFudA==' }), 'https://www.example.com/path/VGVzdHMgYXJlIGtpbmRhIGltcG9ydGFudA==');
    // uuid in path
    assert.equal(facets.plainURL({ url: 'https://www.example.com/path/123e4567-e89b-12d3-a456-426614174000' }), 'https://www.example.com/path/123e4567-e89b-12d3-a456-426614174000');
    // long path
    assert.equal(facets.plainURL({ url: 'https://www.example.com/path/loremlipsumdolorsitametconsecteturadipiscingelit-1234567890-abcdefghijklmnopqrstuvwxyz' }), 'https://www.example.com/path/loremlipsumdolorsitametconsecteturadipiscingelit-1234567890-abcdefghijklmnopqrstuvwxyz');
    assert.equal(facets.plainURL({ url: 'https://www.example.com/path/loremlipsumdolorsitametconsecteturadipiscingelit-abcdefghijklmnopqrstuvwxyz' }), 'https://www.example.com/path/loremlipsumdolorsitametconsecteturadipiscingelit-abcdefghijklmnopqrstuvwxyz');
    assert.equal(facets.plainURL({ url: 'https://www.example.com/path/loremlipsumdolorsitametconsecteturadipiscingelit.1234567890.abcdefghijklmnopqrstuvwxyz.html' }), 'https://www.example.com/path/loremlipsumdolorsitametconsecteturadipiscingelit.1234567890.abcdefghijklmnopqrstuvwxyz.html');
    assert.equal(facets.plainURL({ url: 'https://blog.adobe.com/en/publish/2024/09/11/bringing-gen-ai-to-video-adobe-firefly-video-model-coming-soon' }), 'https://blog.adobe.com/en/publish/2024/09/11/bringing-gen-ai-to-video-adobe-firefly-video-model-coming-soon');
    assert.equal(facets.plainURL({ url: 'https://blog.adobe.com/en/publish/2024/09/11/bringing-gen-ai-to-video-adobe-firefly-video-model-coming-soon.html' }), 'https://blog.adobe.com/en/publish/2024/09/11/bringing-gen-ai-to-video-adobe-firefly-video-model-coming-soon.html');
    assert.equal(facets.plainURL({ url: 'https://www.example.com/consumer84899324c8-5ef06d65eba5&cui=47cea5903b64448fad519184899324c8-5ef06d65eba5&EulaDt=20220413&expdt=20240918&hardware_id=c715069c77fa4b74040b459e3307c6d5&messageid=fbde7912-ef73-4793-bd1d-aec0aed2a945&pkgid=539&rcode=16.0+R122&resellerid=1357&rnwsrc=ngm&sessionid=7f3d8203' }), 'https://www.example.com/consumer84899324c8-5ef06d65eba5&cui=47cea5903b64448fad519184899324c8-5ef06d65eba5&EulaDt=20220413&expdt=20240918&hardware_id=c715069c77fa4b74040b459e3307c6d5&messageid=fbde7912-ef73-4793-bd1d-aec0aed2a945&pkgid=539&rcode=16.0+R122&resellerid=1357&rnwsrc=ngm&sessionid=7f3d8203');
    assert.equal(facets.plainURL({ url: 'https://www.example.com/th/search/%E0%B9%80%E0%B8%AD%E0%B8%99%E0%B8%8A%E0%B8%B1%E0%B8%A7%E0%B8%A3%E0%B9%8C%20%E0%B9%82%E0%B8%81%E0%B8%A5%E0%B8%94%E0%B9%8C%20%E0%B8%AD%E0%B8%B2%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B8%B9%E0%B8%95%E0%B8%A3%E0%B8%84%E0%B8%A3%E0%B8%9A%E0%B8%96%E0%B9%89%E0%B8%A7%E0%B8%99' }), 'https://www.example.com/th/search/%E0%B9%80%E0%B8%AD%E0%B8%99%E0%B8%8A%E0%B8%B1%E0%B8%A7%E0%B8%A3%E0%B9%8C%20%E0%B9%82%E0%B8%81%E0%B8%A5%E0%B8%94%E0%B9%8C%20%E0%B8%AD%E0%B8%B2%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B8%AA%E0%B8%B9%E0%B8%95%E0%B8%A3%E0%B8%84%E0%B8%A3%E0%B8%9A%E0%B8%96%E0%B9%89%E0%B8%A7%E0%B8%99');
    assert.equal(facets.plainURL({ url: 'https://www.example.com/it_it/catalog/product_compare/index/uenc/aHR0cHM6Ly93d3cucGFzc2lvbmViZWF1dHkuY29tL2l0X2l0L2N1c3RvbWVyL3NlY3Rpb24vbG9hZC8_Xz0xNzMxMDY4Nzg3NjQxJmZvcmNlX25ld19zZWN0aW9uX3RpbWVzdGFtcD1mYWxzZSZzZWN0aW9ucz1jdXN0b21lciUyQ2NvbXBhcmUtcHJvZHVjdHMlMkNsYXN0LW9yZGVyZWQtaXRlbXMlMkNj' }), 'https://www.example.com/it_it/catalog/product_compare/index/uenc/aHR0cHM6Ly93d3cucGFzc2lvbmViZWF1dHkuY29tL2l0X2l0L2N1c3RvbWVyL3NlY3Rpb24vbG9hZC8_Xz0xNzMxMDY4Nzg3NjQxJmZvcmNlX25ld19zZWN0aW9uX3RpbWVzdGFtcD1mYWxzZSZzZWN0aW9ucz1jdXN0b21lciUyQ2NvbXBhcmUtcHJvZHVjdHMlMkNsYXN0LW9yZGVyZWQtaXRlbXMlMkNj');
    assert.equal(facets.plainURL({ url: 'https://www.example.com/en/misc/car-configurator.html/navigate/614b81df27aa19e8c740599546d9cf2d/configuration/continental_gt/continental-gt-speed-first-edition/byPRs007F4561RjE0IDY2MDEtRjU2ICAgICA5OS1HUEJMUEJMLUdQQ1JQQ1ItR1BGOFBGOC1HUEZNUEZNLUdQR0xQR0wtR1BJTFBJTC1HUExQUExQLUdSRDhSRDgtR1RGSVpXL' }), 'https://www.example.com/en/misc/car-configurator.html/navigate/614b81df27aa19e8c740599546d9cf2d/configuration/continental_gt/continental-gt-speed-first-edition/byPRs007F4561RjE0IDY2MDEtRjU2ICAgICA5OS1HUEJMUEJMLUdQQ1JQQ1ItR1BGOFBGOC1HUEZNUEZNLUdQR0xQR0wtR1BJTFBJTC1HUExQUExQLUdSRDhSRDgtR1RGSVpXL');

    assert.equal(facets.plainURL({ domain: 'custom.domain' }), 'custom.domain');
  });

  it('plainURL:DataChunks', () => {
    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('plainURL', facets.plainURL);

    // Assert that we have facets for URL
    assert.ok(d.facets.plainURL.length > 0);
    assert.equal(d.facets.plainURL.length, 92);

    assert.equal(d.facets.plainURL[0].value, 'https://www.aem.live/home');
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

describe('facets:enterSource', () => {
  it('enterSource:bare', () => {
    assert.deepEqual(facets.enterSource({ events: [{ checkpoint: 'enter', source: 'https://www.example.com' }] }), ['https://www.example.com']);
    assert.deepEqual(facets.enterSource({ events: [{ checkpoint: 'enter', source: 'https://www.google.com' }] }), ['https://www.google.com', 'search:google', 'search', '*:google']);
  });

  it('enterSource:normalizeUrl', () => {
    assert.deepEqual(facets.enterSource({ events: [{ checkpoint: 'enter', source: 'https://www.example.com/#' }] }), ['https://www.example.com']);
    assert.deepEqual(facets.enterSource({ events: [{ checkpoint: 'enter', source: 'https://www.google.com/#' }] }), ['https://www.google.com', 'search:google', 'search', '*:google']);
  });

  it('enterSource:DataChunks', () => {
    const d = new DataChunks();
    d.load(testChunks);
    d.addSeries('pageViews', pageViews);
    d.addFacet('enterSource', facets.enterSource);

    assert.equal(d.facets.enterSource.length, 46);
    assert.equal(d.facets.enterSource[2].value, 'search'); // all search engines
    assert.equal(d.facets.enterSource[3].value, 'search:google'); // google search
    assert.equal(d.facets.enterSource[4].value, '*:google'); // all google properties
    assert.equal(d.facets.enterSource[5].value, 'https://www.google.com/'); // that one specific google page
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
