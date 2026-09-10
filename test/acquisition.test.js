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
import { classifyAcquisition } from '../acquisition.js';

describe('classifyAcquisition', () => {
  const testCases = [
    { input: 'google', expected: 'paid:search:google', only: true },
    { input: 'facebook', expected: ':social:facebook' },
    { input: 'fb', expected: ':social:facebook' },
    { input: 'bing', expected: 'paid:search:bing' },
    { input: 'ig', expected: ':social:instagram' },
    { input: 'meta', expected: ':social:facebook' },
    { input: 'push', expected: 'owned:push' },
    { input: 'yandex', expected: 'paid:search:yandex' },
    { input: 'baidu', expected: 'paid:search:baidu' },
    { input: 'amazon', expected: 'paid:display:amazon' },
    { input: 'youtube', expected: ':video:youtube' },
    { input: 'linkedin', expected: ':social:linkedin' },
    { input: 'gmb', expected: ':local:google' },
    { input: 'tiktok', expected: 'paid:video:tiktok', only: true },
    { input: 'newsletter', expected: 'owned:email' },
    { input: 'instagram', expected: ':social:instagram' },
    { input: 'dv360', expected: 'paid:video:google' },
    { input: 'email', expected: 'owned:email' },
    { input: 'programmatic', expected: 'paid:display' },
    { input: 'googleads', expected: 'paid:search:google', only: true },
    { input: 'sfmc', expected: '' },
    { input: 'google-ads', expected: 'paid:search:google', only: true },
    { input: 'an', expected: '' },
    { input: 'marketo', expected: 'owned:email:marketo', only: true },
    { input: 'hs_email', expected: 'owned:email' },
    { input: 'social', expected: ':social', only: true },
    { input: 'microsoft', expected: 'paid:display:microsoft', only: true },
    { input: 'adwords', expected: 'paid:search:google', only: true },
    { input: 'pinterest', expected: ':social:pinterest' },
    { input: 'gdn', expected: 'paid:display:google' },
    { input: 'facebook-instagram', expected: ':social:instagram', only: true },
    { input: 'twitter', expected: ':social:x' },
    { input: 'snapchat', expected: ':social:snapchat' },
    { input: 'eloqua', expected: 'owned:email:eloqua', only: true },
    { input: 'yahoo', expected: 'paid:search:yahoo', only: true },
    { input: 'teads', expected: 'paid::teads' },
    { input: 'criteo', expected: 'paid:display:criteo', only: true },
    { input: 'acs', expected: '' },
    { input: 'taboola', expected: 'paid:display:taboola', only: true },
    { input: 'kaufland marketing', expected: '' },
    { input: 'search', expected: 'paid:search', only: true },
    { input: 'abandoned-cart', expected: '' },
    { input: 'zalo', expected: '' },
    { input: 'website', expected: 'owned:web' },
    { input: 'outbrain', expected: 'paid:display:outbrain', only: true },
    { input: 'google_pmax', expected: 'paid:search:google', only: true },
    { input: 'substack', expected: 'owned:email:substack', only: true },
    { input: 'line', expected: ':social:line', only: true },
    { input: 'spotify', expected: 'paid:display:spotify', only: true },
    { input: 'display', expected: 'paid:display' },
    { input: 'google_deman', expected: 'paid:search:google', only: true },
    { input: 'ttd', expected: '' },
    { input: 'sms', expected: 'owned:sms' },
    { input: 'qr', expected: 'owned:qr' },
    { input: 'reddit', expected: 'paid:social:reddit', only: true },
    { input: 'dbm', expected: 'paid:display:google' },
    { input: 'google_search', expected: 'paid:search:google', only: true },
    { input: 'qrcode', expected: 'owned:qr' },
    { input: 'linkin.bio', expected: 'owned:social', only: true },
    { input: 'cpc', expected: 'paid' },
    { input: 'paid', expected: 'paid' },
    { input: 'email', expected: 'owned:email' },
    { input: 'social', expected: ':social', only: true },
    { input: 'yext', expected: 'paid:local:yext', only: true },
    { input: 'video', expected: ':video', only: true },
    { input: 'referral', expected: '' },
    { input: 'paid_social', expected: 'paid:social' },
    { input: 'banner', expected: 'paid:display' },
    { input: 'ppc', expected: 'paid' },
    { input: 'organic', expected: 'owned' },
    { input: 'social_paid', expected: 'paid:social' },
    { input: 'organicgmb', expected: 'owned:local:google' },
    { input: 'cpm', expected: 'paid' },
    { input: 'paid-social', expected: 'paid:social' },
    { input: 'paidsocial', expected: 'paid:social' },
    { input: 'paidsearch', expected: 'paid:search' },
    { input: 'native', expected: '' },
    { input: 'paid_search', expected: 'paid:search' },
    { input: 'affiliate', expected: 'paid:affiliate' },
    { input: 'app', expected: '' },
    { input: 'brand_paid_search', expected: 'paid:search' },
    { input: 'non_brand_paid_search', expected: 'paid:search' },
    { input: 'search-unbrand_paid', expected: 'paid:search' },
    { input: 'web', expected: 'owned:web' },
    { input: 'social_media', expected: ':social', only: true },
    { input: 'organic_social', expected: 'owned:social' },
    { input: 'social-paid', expected: 'paid:social' },
    { input: 'yt', expected: ':video:youtube' },
    { input: 'carousel', expected: '' },
    { input: 'sea', expected: 'paid:search' },
    { input: 'social-cpc', expected: 'paid:social' },
    { input: 'social-organic', expected: 'owned:social' },
    { input: 'link', expected: '' },
    { input: 'ctv', expected: 'paid:video:amazon' },
    { input: 'print', expected: 'owned:print' },
    { input: 'paid social', expected: 'paid:social', only: true },
    { input: 'chatgpt.com', expected: 'earned:ai:chatgpt' },
    { input: 'perplexity', expected: 'earned:ai:perplexity' },
  ];

  testCases
    .forEach(({ input, expected }) => {
      it(`should classify "${input}" as "${expected}"`, () => {
        assert.strictEqual(classifyAcquisition(input), expected);
      });
    });
});

describe('classifyAcquisition (Android in-app referrers)', () => {
  const testCases = [
    // Gmail is an inbox, not a Google search, and never paid
    { input: 'android-app://com.google.android.gm/', expected: 'owned:email:google' },
    { input: 'com.google.android.gm', expected: 'owned:email:google' },
    { input: 'mail.google.com', expected: 'owned:email:google' },
    // the Google app (Discover feed and search widget) is an organic surface
    { input: 'android-app://com.google.android.googlequicksearchbox/', expected: 'owned:search:google' },
    { input: 'com.google.android.googlequicksearchbox', expected: 'owned:search:google' },
    // the authority is not always a package id, some apps report a hostname
    { input: 'android-app://m.facebook.com/', expected: ':social:facebook' },
    { input: 'android-app://nextdoor.com/', expected: '' },
    { input: 'android-app://id.pinterest.com/', expected: ':social:pinterest' },
    { input: 'android-app://perplexity.ai/', expected: 'earned:ai:perplexity' },
    // known social and video apps keep their vendor and category
    { input: 'android-app://jp.naver.line.android/', expected: ':social:line' },
    { input: 'android-app://com.linkedin.android/', expected: ':social:linkedin' },
    { input: 'android-app://com.pinterest/', expected: ':social:pinterest' },
    { input: 'android-app://com.reddit.frontpage/', expected: 'paid:social:reddit' },
    { input: 'android-app://com.facebook.katana/', expected: ':social:facebook' },
    { input: 'android-app://com.instagram.android/', expected: ':social:instagram' },
    { input: 'android-app://com.twitter.android/', expected: ':social:x' },
    { input: 'android-app://com.google.android.youtube/', expected: ':video:youtube' },
    // an app we don't know is left unclassified instead of guessed
    { input: 'android-app://com.example.unknownapp/', expected: '' },
    { input: 'android-app://com.google.android.apps.docs/', expected: '' },
  ];

  testCases.forEach(({ input, expected }) => {
    it(`should classify "${input}" as "${expected}"`, () => {
      assert.strictEqual(classifyAcquisition(input), expected);
    });
  });
});

describe('classifyAcquisition (short vendor aliases do not over-match)', () => {
  const unrelated = [
    'nytimes.com',
    'figma.com',
    'signal.org',
    'lightroom.adobe.com',
    'digg.com',
    'bigcommerce.com',
    'metadata.io',
    'linear.app',
    'online-store.com',
    'headline.com',
    // `-` is a regular character inside a hostname label, not a delimiter
    'my-ig-site.com',
    'ig-tools.net',
    'meta-data.io',
    'my-fb-page.com',
    'my-yt-channel.com',
    'the-line-shop.com',
    'https://my-ig-site.com/',
  ];

  unrelated.forEach((input) => {
    it(`should not assign a vendor to "${input}"`, () => {
      assert.strictEqual(classifyAcquisition(input), '');
    });
  });

  const aliases = [
    { input: 'ig', expected: ':social:instagram' },
    { input: 'IG', expected: ':social:instagram' },
    { input: 'paid_ig', expected: 'paid:social:instagram' },
    { input: 'social-ig', expected: ':social:instagram' },
    { input: 'fb', expected: ':social:facebook' },
    { input: 'FB', expected: ':social:facebook' },
    { input: 'fb_paid', expected: 'paid:social:facebook' },
    { input: 'fb-paid', expected: 'paid:social:facebook' },
    { input: 'meta', expected: ':social:facebook' },
    { input: 'meta-ads', expected: 'paid:social:facebook' },
    { input: 'yt', expected: ':video:youtube' },
    { input: 'yt_organic', expected: 'owned:video:youtube' },
    { input: 'line', expected: ':social:line' },
    { input: 'line-organic', expected: 'owned:social:line' },
  ];

  aliases.forEach(({ input, expected }) => {
    it(`should still classify "${input}" as "${expected}"`, () => {
      assert.strictEqual(classifyAcquisition(input), expected);
    });
  });
});
