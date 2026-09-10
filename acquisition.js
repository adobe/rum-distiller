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
/*
 * Short aliases like `ig`, `fb`, `yt` and generic words like `meta` or `line` are
 * used as UTM values, but as plain substrings they also match unrelated referrers
 * (`figma.com`, `nytimes.com`, `metadata.io`, `headline.com`), so they are only
 * matched as a standalone token. Which delimiters end that token depends on the
 * shape of the origin: `-` separates the parts of a UTM value (`social-ig`), but is
 * a regular character inside a hostname label (`my-ig-site.com` is not Instagram),
 * so a hostname is matched on whole labels only.
 */
function standaloneAlias(pattern) {
  return {
    utm: new RegExp(`(?<![a-z0-9])(?:${pattern})(?![a-z0-9])`, 'i'),
    hostname: new RegExp(`(?<![a-z0-9-])(?:${pattern})(?![a-z0-9-])`, 'i'),
  };
}

/* a hostname or URL, as opposed to a UTM value like `paid-social` */
const hostnameLikeRegex = /^(?:[a-z][a-z0-9+.-]*:\/\/)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[:/?#]|$)/i;

const vendorClassifications = [
  { regex: /google|googleads|google-ads|google_search|google_deman|adwords|dv360|gdn|doubleclick|dbm|gmb/i, result: 'google' },
  { regex: /instagram/i, alias: standaloneAlias('ig'), result: 'instagram' },
  { regex: /facebook/i, alias: standaloneAlias('fb|meta'), result: 'facebook' },
  { regex: /bing/i, result: 'bing' },
  { regex: /tiktok/i, result: 'tiktok' },
  { regex: /youtube/i, alias: standaloneAlias('yt'), result: 'youtube' },
  { regex: /linkedin/i, result: 'linkedin' },
  { regex: /twitter/i, result: 'x' },
  { regex: /snapchat/i, result: 'snapchat' },
  { regex: /microsoft/i, result: 'microsoft' },
  { regex: /pinterest/i, result: 'pinterest' },
  { regex: /reddit/i, result: 'reddit' },
  { regex: /spotify/i, result: 'spotify' },
  { regex: /criteo/i, result: 'criteo' },
  { regex: /taboola/i, result: 'taboola' },
  { regex: /outbrain/i, result: 'outbrain' },
  { regex: /yahoo/i, result: 'yahoo' },
  { regex: /marketo/i, result: 'marketo' },
  { regex: /eloqua/i, result: 'eloqua' },
  { regex: /substack/i, result: 'substack' },
  { alias: standaloneAlias('line'), result: 'line' },
  { regex: /yext/i, result: 'yext' },
  { regex: /teads/i, result: 'teads' },
  { regex: /yandex/i, result: 'yandex' },
  { regex: /baidu/i, result: 'baidu' },
  { regex: /amazon|ctv/i, result: 'amazon' },
  { regex: /direct/i, result: 'direct' },
  { regex: /perplexity/i, result: 'perplexity' },
  { regex: /chatgpt/i, result: 'chatgpt' },
];

/* is the vendor paid or owned */
const vendorTypeLookup = {
  yext: 'paid',
  reddit: 'paid',
  tiktok: 'paid',
  amazon: 'paid',
  direct: 'earned',
  // AI traffic is earned, not owned
  chatgpt: 'earned',
  perplexity: 'earned',
};

const categoryClassifications = [
  { regex: /search|sem|sea$/i, result: 'search' },
  { regex: /display|programmatic|banner|gdn|dbm/i, result: 'display' },
  { regex: /video|dv360|tv/i, result: 'video' },
  { regex: /email|newsletter|gmail|mail\.google\.com/i, result: 'email' },
  { regex: /social|bio/i, result: 'social' },
  { regex: /affiliate/i, result: 'affiliate' },
  { regex: /local|gmb/i, result: 'local' },
  { regex: /sms/i, result: 'sms' },
  { regex: /qr/i, result: 'qr' },
  { regex: /push/i, result: 'push' },
  { regex: /print/i, result: 'print' },
  { regex: /web/i, result: 'web' },
];

const paidOwnedClassifications = [
  { regex: /cpc|ppc|paid|cpm|cpv|banner|display|programmatic|affiliate|^sea$|ads|dv360/i, result: 'paid' },
  // "organic" is treated as "owned" as it is not paid and not earned
  // (noone puts UTM tags on real organic traffic)
  { regex: /email|newsletter|hs_email|organic|sms|qr|qrcode|print|website|web|linkin.bio/i, result: 'owned' },
  { regex: /push/i, result: 'owned' },
  { regex: /gmb/i, result: '' },
  // { regex: /social/i, result: 'earned' },
];

const vendorCategoryLookup = {
  google: 'search',
  bing: 'search',
  yahoo: 'search',
  facebook: 'social',
  instagram: 'social',
  linkedin: 'social',
  x: 'social',
  snapchat: 'social',
  pinterest: 'social',
  reddit: 'social',
  youtube: 'video',
  spotify: 'display',
  yext: 'local',
  line: 'social',
  substack: 'email',
  outbrain: 'display',
  taboola: 'display',
  criteo: 'display',
  eloqua: 'email',
  microsoft: 'display',
  marketo: 'email',
  tiktok: 'video',
  amazon: 'display',
  yandex: 'search',
  baidu: 'search',
  chatgpt: 'ai',
  perplexity: 'ai',
  direct: 'direct',
};

const categoryTypeLookup = {
  search: 'paid',
  display: 'paid',
  affiliate: 'paid',
  email: 'owned',
  web: 'owned',
  sms: 'owned',
  qr: 'owned',
  print: 'owned',
};

/*
 * In-app referrers are reported as `android-app://<authority>/`. The authority is
 * usually a package id in reverse DNS notation (`com.example.app`), but a few apps
 * report a hostname (`m.facebook.com`, `nextdoor.com`) instead. A hostname is
 * classified like any other referrer, a package id is looked up below.
 */
const inAppReferrerRegex = /^android-app:\/\/([^/]+)/i;
/* a hostname ends in a TLD: two letters for a country, or a known suffix */
const tldRegex = /\.(?:[a-z]{2}|com|net|org|edu|gov|mil|int|info|biz|pro|xyz|app|dev|site|online|shop|store|blog|cloud|tech|news|live|link|page|space|website|media|group|world|life|today|agency|digital)$/i;
/*
 * A package id is reverse DNS, so a label that would be the TLD of a hostname comes
 * first instead of last: `com.example.app` is a package id, `app.example.com` is not.
 */
const packageRootRegex = /^(?:com|org|net|io)\./i;

/*
 * The apps that account for the bulk of in-app referrals, mapped to a source that
 * the classification above already understands. Only apps with a significant share
 * are listed: the long tail is left unclassified rather than guessed, because
 * substring matching a package id invents vendors (`com.google.android.gm` and
 * `com.google.android.youtube` both look like a Google search).
 */
const androidAppSources = {
  /* an inbox, so email: neither search nor paid */
  'com.google.android.gm': 'mail.google.com',
  /* the Google app: Discover feed and search widget, both organic surfaces */
  'com.google.android.googlequicksearchbox': 'organic google search',
  'com.google.android.youtube': 'youtube',
  'com.facebook.katana': 'facebook',
  'com.instagram.android': 'instagram',
  'com.linkedin.android': 'linkedin',
  'com.pinterest': 'pinterest',
  'com.reddit.frontpage': 'reddit',
  'com.twitter.android': 'twitter',
  'jp.naver.line.android': 'line',
};

function isPackageId(authority) {
  return packageRootRegex.test(authority) || !tldRegex.test(authority);
}

function inAppSource(origin) {
  if (typeof origin !== 'string') return origin;
  const [, authority] = inAppReferrerRegex.exec(origin) || [];
  const key = (authority || origin).toLowerCase();
  if (authority && !isPackageId(key)) return key;
  if (androidAppSources[key]) return androidAppSources[key];
  /* an unknown app is reported as an in-app referral we cannot attribute */
  return authority ? '' : origin;
}

export function vendor(origin) {
  const hostnameLike = hostnameLikeRegex.test(origin);
  const result = vendorClassifications.find(({ regex, alias }) => {
    if (regex && regex.test(origin)) return true;
    return !!alias && (hostnameLike ? alias.hostname : alias.utm).test(origin);
  });
  return result ? result.result : '';
}

function category(origin, vendorResult) {
  const categoryResult = categoryClassifications.find(({ regex }) => regex.test(origin));

  if (categoryResult) return categoryResult.result;
  return vendorCategoryLookup[vendorResult] || '';
}

function paidowned(origin, vendorResult, categoryResult) {
  const paidOwnedResult = paidOwnedClassifications.find(({ regex }) => regex.test(origin));

  if (paidOwnedResult) return paidOwnedResult.result;
  return vendorTypeLookup[vendorResult] || categoryTypeLookup[categoryResult] || '';
}

export function classifyAcquisition(origin, isPaid = false) {
  const source = inAppSource(origin);
  const vendorResult = vendor(source);
  const categoryResult = category(source, vendorResult);
  const paidOwnedResult = isPaid
    ? (typeof isPaid === 'string' && isPaid) || 'paid'
    : paidowned(source, vendorResult, categoryResult);

  let result = paidOwnedResult;
  if (categoryResult || vendorResult) {
    result += `:${categoryResult}`;
  }
  if (vendorResult) {
    result += `:${vendorResult}`;
  }
  return result;
}
