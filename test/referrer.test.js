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
import assert from 'assert';
import { describe, it } from 'node:test';
import { classifyReferrer } from '../referrer.js';

describe('classifyReferrer', () => {
  const testCases = [
    // Search Engines
    { input: 'https://www.google.com/', expected: { type: 'search', vendor: 'google' } },
    { input: 'https://www.bing.com/', expected: { type: 'search', vendor: 'bing' } },
    { input: 'https://duckduckgo.com/', expected: { type: 'search', vendor: 'duckduckgo' } },
    { input: 'https://search.yahoo.com/', expected: { type: 'search', vendor: 'yahoo' } },
    { input: 'https://yandex.ru/', expected: { type: 'search', vendor: 'yandex' } },
    { input: 'https://search.brave.com/', expected: { type: 'search', vendor: 'brave' } },
    { input: 'https://www.ecosia.org/', expected: { type: 'search', vendor: 'ecosia' } },
    { input: 'https://syndicatedsearch.goog/', expected: { type: 'ads', vendor: 'google' } },
    { input: 'https://m.baidu.com/', expected: { type: 'search', vendor: 'baidu' } },
    { input: 'https://naver.com/', expected: { type: 'search', vendor: 'naver' } },

    // Social Media
    { input: 'http://m.facebook.com/', expected: { type: 'social', vendor: 'facebook' } },
    { input: 'https://l.facebook.com/', expected: { type: 'social', vendor: 'facebook' } },
    { input: 'http://instagram.com/', expected: { type: 'social', vendor: 'instagram' } },
    { input: 'https://l.instagram.com/', expected: { type: 'social', vendor: 'instagram' } },
    { input: 'https://www.linkedin.com/', expected: { type: 'social', vendor: 'linkedin' } },
    { input: 'https://out.reddit.com/', expected: { type: 'social', vendor: 'reddit' } },
    { input: 'https://x.com/', expected: { type: 'social', vendor: 'x' } },

    // Video Platforms
    { input: 'https://youtube.com/', expected: { type: 'video', vendor: 'youtube' } },
    { input: 'https://www.youtube.com/', expected: { type: 'video', vendor: 'youtube' } },
    { input: 'https://www.dailymotion.com/', expected: { type: 'video', vendor: 'dailymotion' } },

    // Advertising
    { input: 'https://googleads.g.doubleclick.net/', expected: { type: 'ads', vendor: 'google' } },
    { input: 'https://partner.googleadservices.com/', expected: { type: 'ads', vendor: 'googleadservices' } },
    { input: 'https://ads.eu.criteo.com/', expected: { type: 'ads', vendor: 'criteo' } },
    { input: 'https://www.pangleglobal.com/', expected: { type: 'ads', vendor: 'pangle' } },
    { input: 'https://pangle-global.io/', expected: { type: 'ads', vendor: 'pangle' } },
    { input: 'https://www.linkbux.com/', expected: { type: 'ads', vendor: 'linkbux' } },
    { input: 'https://s0.2mdn.net/', expected: { type: 'ads', vendor: 'google' } },

    // News
    { input: 'https://news.google.com/', expected: { type: 'news', vendor: 'google' } },
    { input: 'https://news.yahoo.co.jp/', expected: { type: 'news', vendor: 'yahoo' } },
    { input: 'https://www.msn.com/', expected: { type: 'news', vendor: 'msn' } },

    // Email
    { input: 'https://mail.google.com/', expected: { type: 'email', vendor: 'google' } },
    { input: 'https://mail.yahoo.com/', expected: { type: 'email', vendor: 'yahoo' } },

    // Chat/Communication
    { input: 'https://web.telegram.org/', expected: { type: 'chat', vendor: 'telegram' } },
    { input: 'https://statics.teams.cdn.office.net/', expected: { type: 'chat', vendor: 'microsoft' } },

    // AI
    { input: 'https://chatgpt.com/', expected: { type: 'ai', vendor: 'openai' } },
    { input: 'https://copilot.microsoft.com/', expected: { type: 'ai', vendor: 'microsoft' } },
    { input: 'https://claude.ai/', expected: { type: 'ai', vendor: 'anthropic' } },

    // Developer
    { input: 'http://localhost:3000/', expected: { type: 'developer', vendor: 'localhost' } },
    { input: 'http://localhost:4200/', expected: { type: 'developer', vendor: 'localhost' } },
    { input: 'https://github.com/', expected: { type: 'developer', vendor: 'github' } },

    // Education
    { input: 'https://en.m.wikipedia.org/', expected: { type: 'education', vendor: 'wikipedia' } },
    { input: 'https://fa.m.wikipedia.org/', expected: { type: 'education', vendor: 'wikipedia' } },
    { input: 'https://ja.wikipedia.org/', expected: { type: 'education', vendor: 'wikipedia' } },

    // URL Shorteners
    { input: 'https://bit.ly/', expected: { type: 'social', vendor: 'bitly' } },
    { input: 'https://lnkd.in/', expected: { type: 'social', vendor: 'linkedin' } },

    // Security
    { input: 'https://connect.themediatrust.com/', expected: { type: 'security', vendor: 'themediatrust' } },
    { input: 'https://bxss.me/', expected: { type: 'security', vendor: 'bxss' } },
  ];

  testCases.forEach(({ input, expected }) => {
    it(`should classify ${input} as ${expected.type}:${expected.vendor}`, () => {
      const result = classifyReferrer(input);
      assert.ok(result, `Failed to classify ${input}, expected ${expected.type}:${expected.vendor}`);
      assert.equal(result.type, expected.type);
      assert.equal(result.vendor, expected.vendor);
    });
  });

  it('should return undefined for empty input', () => {
    assert.equal(classifyReferrer(''), undefined);
    assert.equal(classifyReferrer(null), undefined);
    assert.equal(classifyReferrer(undefined), undefined);
  });

  it('should return undefined for unclassified referrers', () => {
    assert.equal(classifyReferrer('https://unknown-domain.com'), undefined);
  });
}); 