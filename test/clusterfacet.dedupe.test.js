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

describe('DataChunks.addClusterFacet (dedupe + order)', () => {
  it('deduplicates values and preserves order', () => {
    const d = new DataChunks();
    d.load([
      {
        date: '2024-01-01',
        rumBundles: [
          {
            id: 'a',
            url: 'https://example.com/foo/bar',
            userAgent: 'desktop',
            weight: 1,
            host: 'example.com',
            events: [],
          },
        ],
      },
    ]);
    // Base facet returns a single value; cluster producer returns duplicates
    d.addFacet('url', (b) => [b.url]);
    d.addClusterFacet('cluster', 'url', {
      count: 2,
      producer: (v) => [v, '/foo', '/foo', '/foo/bar'],
    });

    const arr = d.facets.cluster.map((f) => f.value);
    // Should contain base path and popular clusters exactly once (order not enforced here)
    assert.ok(arr.includes('/foo'));
    assert.ok(arr.includes('https://example.com/foo/bar'));
    // No duplicate '/foo'
    assert.equal(arr.filter((v) => v === '/foo').length, 1);
  });
});
