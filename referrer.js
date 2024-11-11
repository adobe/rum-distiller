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

const referrers = [
  // Search
  {
    type: 'search',
    vendor: 'google',
    match: /https?:\/\/((www\.)?google\.|lens\.google\.com)/,
  },
  {
    type: 'search',
    vendor: 'baidu',
    match: /https?:\/\/(m\.|www\.)?baidu\.com/,
  },
  {
    type: 'search',
    vendor: 'bing',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?bing\.com/,
  },
  {
    type: 'search',
    vendor: 'duckduckgo',
    match: /https?:\/\/(www\.)?duckduckgo\.com(\/.*)?/,
  },
  {
    type: 'search',
    vendor: 'yahoo',
    match: /https?:\/\/([a-z]{2}\.)?search\.yahoo\.com/,
  },
  {
    type: 'search',
    vendor: 'yahoo',
    match: /https?:\/\/(search\.)?yahoo\.co\.jp/,
  },
  {
    type: 'search',
    vendor: 'yandex',
    match: /https?:\/\/(www\.)?yandex\./,
  },
  {
    type: 'search',
    vendor: 'ecosia',
    match: /https?:\/\/(www\.)?ecosia\.org/,
  },
  {
    type: 'search',
    vendor: 'brave',
    match: /https?:\/\/(www\.)?search\.brave\.com/,
  },
  {
    type: 'search',
    vendor: 'naver',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?(search\.|)?naver\.com/,
  },
  {
    type: 'search',
    vendor: 'daum',
    match: /https?:\/\/search\.daum\.net/,
  },
  // Daum Search Mobile
  {
    type: 'search',
    vendor: 'daum',
    match: /https?:\/\/m\.search\.daum\.net/,
  },
  {
    type: 'search',
    vendor: 'startpage',
    match: /https?:\/\/(www\.)?startpage\.com/,
  },
  {
    type: 'search',
    vendor: 'presearch',
    match: /https?:\/\/(www\.)?presearch\.com/,
  },
  {
    type: 'search',
    vendor: 'seznam',
    match: /https?:\/\/(www\.)?search\.seznam\.cz/,
  },
  {
    type: 'search',
    vendor: 'docomo',
    match: /https?:\/\/(service\.)?smt\.docomo\.ne\.jp/,
  },
  {
    type: 'search',
    vendor: 'googleusercontent',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?googleusercontent\.com/,
  },
  // Social
  {
    type: 'social',
    vendor: 'facebook',
    match: /https?:\/\/(www\.)?(m\.|l\.|lm\.)?facebook\.com\//,
  },
  {
    type: 'social',
    vendor: 'instagram',
    match: /https?:\/\/(www\.)?(l\.)?instagram\.com\//,
  },
  {
    type: 'social',
    vendor: 'linkedin',
    match: /https?:\/\/(www\.)?linkedin\.com/,
  },
  {
    type: 'social',
    vendor: 'linkedin',
    match: /https?:\/\/lnkd\.in/,
  },
  {
    type: 'social',
    vendor: 'tiktok',
    match: /https?:\/\/(www\.)?tiktok\.com/,
  },
  {
    type: 'social',
    vendor: 'x',
    match: /https?:\/\/(www\.)?(t\.co\/|x\.com)/,
  },
  {
    type: 'social',
    vendor: 'reddit',
    match: /https?:\/\/(www\.)?(old\.|out\.)?reddit\.com/,
  },
  {
    type: 'social',
    vendor: 'pinterest',
    match: /https?:\/\/(www\.)?pinterest\.com/,
  },
  {
    type: 'social',
    vendor: 'linktree',
    match: /https?:\/\/(www\.)?linktr\.ee/,
  },
  {
    type: 'social',
    vendor: 'snapchat',
    match: /https?:\/\/(www\.)?snapchat\.com/,
  },
  // Chat
  {
    type: 'chat',
    vendor: 'microsoft',
    match: /https?:\/\/(.*\.)?teams\.microsoft\.com/,
  },
  {
    type: 'chat',
    vendor: 'microsoft',
    match: /https?:\/\/(.*\.)?teams\.cdn\.office\.net/,
  },
  {
    type: 'chat',
    vendor: 'snapchat',
    match: /https?:\/\/(www\.)?snapchat\.com/,
  },
  // Video
  {
    type: 'video',
    vendor: 'youtube',
    match: /https?:\/\/(www\.)?(m\.)?youtube\.com/,
  },
  {
    type: 'video',
    vendor: 'dailymotion',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?dailymotion\.com/,
  },
  // Ads
  {
    type: 'ads',
    vendor: 'google',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?doubleclick\.net/,
  },
  {
    type: 'ads',
    vendor: 'google', // Doubleclick
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?2mdn\.net/,
  },
  {
    type: 'ads',
    vendor: 'google',
    match: /https?:\/\/googleads\.g\.doubleclick\.net/,
  },
  {
    type: 'ads',
    vendor: 'google',
    match: /https?:\/\/syndicatedsearch\.goog/,
  },
  {
    type: 'ads',
    vendor: 'google',
    match: /https?:\/\/(tpc\.)?googlesyndication\.com/,
  },
  {
    type: 'ads',
    vendor: 'googleadservices',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?googleadservices\.com/,
  },
  {
    type: 'ads',
    vendor: 'appnexus',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?adnxs\.com/,
  },
  {
    type: 'ads',
    vendor: 'pangle',
    match: /https?:\/\/(www\.)?(pangle-global\.io|pangleglobal\.com)/,
  },
  {
    type: 'ads',
    vendor: 'linkbux',
    match: /https?:\/\/(www\.)?linkbux\.com/,
  },
  {
    type: 'ads',
    vendor: 'taboola',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?taboola\.com/,
  },
  {
    type: 'ads',
    vendor: 'taboola',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?taboolanews\.com/,
  },
  {
    type: 'ads',
    vendor: 'outbrain',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?outbrain\.com/,
  },
  {
    type: 'ads',
    vendor: 'amazon',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?amazon-adsystem\.com/,
  },
  {
    type: 'ads',
    vendor: 'google',
    match: /https?:\/\/imasdk\.googleapis\.com/,
  },
  // Auth
  {
    type: 'auth',
    vendor: 'google',
    match: /https?:\/\/accounts\.google\.com/,
  },
  {
    type: 'auth',
    vendor: 'microsoft',
    match: /https?:\/\/login\.microsoftonline\.com/,
  },
  {
    type: 'auth',
    vendor: 'apple',
    match: /https?:\/\/appleid\.apple\.com/,
  },
  // Productivity
  {
    type: 'productivity',
    vendor: 'google',
    match: /https?:\/\/(docs|drive|sheets|classroom|sites)\.google\.com/,
  },
  {
    type: 'productivity',
    vendor: 'microsoft',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?(office\.com|officeapps\.live\.com|sharepoint\.com)/,
  },
  // News
  {
    type: 'news',
    vendor: 'newsweek',
    match: /https?:\/\/(www\.)?newsweek\.com/,
  },
  {
    type: 'news',
    vendor: 'google',
    match: /https?:\/\/news\.google\.com/,
  },
  {
    type: 'news',
    vendor: 'yahoo',
    match: /https?:\/\/news\.yahoo\.co\.jp/,
  },
  {
    type: 'news',
    vendor: 'msn',
    match: /https?:\/\/(www\.)?msn\.com/,
  },
  // CDN
  {
    type: 'cdn',
    vendor: 'akamai',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?akamaihd\.net/,
  },
  {
    type: 'cdn',
    vendor: 'googleusercontent',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?googleusercontent\.com/,
  },
  // Video
  {
    type: 'video',
    vendor: 'dailymotion',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?dailymotion\.com/,
  },
  // Developer
  {
    type: 'developer',
    vendor: 'github',
    match: /https?:\/\/(www\.)?github\.com/,
  },
  {
    type: 'developer',
    vendor: 'localhost',
    match: /http:\/\/localhost(:[0-9]+)?/,
  },
  // Security
  {
    type: 'security',
    vendor: 'themediatrust',
    match: /https?:\/\/connect\.themediatrust\.com/,
  },
  {
    type: 'security',
    vendor: 'bxss',
    match: /https?:\/\/bxss\.me/,
  },
  // Education
  {
    type: 'education',
    vendor: 'wikipedia',
    match: /https?:\/\/([a-z]{2,3}\.)?(m\.)?wikipedia\.org/,
  },
  // AI
  {
    type: 'ai',
    vendor: 'openai',
    match: /https?:\/\/(www\.)?chatgpt\.com/,
  },
  {
    type: 'ai',
    vendor: 'openai',
    match: /https?:\/\/chat\.openai\.com/,
  },
  {
    type: 'ai',
    vendor: 'perplexity',
    match: /https?:\/\/(www\.)?perplexity\.ai/,
  },
  {
    type: 'ai',
    vendor: 'microsoft',
    match: /https?:\/\/copilot\.microsoft\.com/,
  },
  {
    type: 'ai',
    vendor: 'google',
    match: /https?:\/\/gemini\.google\.com/,
  },
  {
    type: 'ai',
    vendor: 'anthropic',
    match: /https?:\/\/(www\.)?claude\.ai/,
  },
  // Email
  {
    type: 'email',
    vendor: 'outlook',
    match: /https?:\/\/(www\.)?(outlook\.live\.com|outlook\.com)/,
  },
  {
    type: 'email',
    vendor: 'google',
    match: /https?:\/\/mail\.google\.com/,
  },
  {
    type: 'email',
    vendor: 'yahoo',
    match: /https?:\/\/(mail|m\.mail)\.yahoo\.(com|co\.jp)/,
  },

  // Storage/CDN
  {
    type: 'cdn',
    vendor: 'google',
    match: /https?:\/\/storage\.googleapis\.com/,
  },

  // Ads
  {
    type: 'ads',
    vendor: 'googleads',
    match: /https?:\/\/([a-zA-Z0-9_-]+\.)?googlesyndication\.com/,
  },

  // Auth
  {
    type: 'auth',
    vendor: 'apple',
    match: /https?:\/\/appleid\.apple\.com/,
  },

  // Search (Additional Yahoo Domains)
  {
    type: 'search',
    vendor: 'yahoo',
    match: /https?:\/\/(www\.|m\.)?yahoo\.(com|co\.jp)/,
  },

  // Ads
  {
    type: 'ads',
    vendor: 'pangle',
    match: /https?:\/\/(www\.)?pangle-global\.io/,
  },

  // Messaging/Chat
  {
    type: 'chat',
    vendor: 'telegram',
    match: /https?:\/\/(www\.)?web\.telegram\.org/,
  },

  // URL Shorteners
  {
    type: 'social',
    vendor: 'bitly',
    match: /https?:\/\/(www\.)?bit\.ly/,
  },

  // Add this in the Ads section with other ad vendors
  {
    type: 'ads',
    vendor: 'criteo',
    match: /https?:\/\/ads\.(eu\.)?criteo\.com/,
  },
];

class Referrer {
  constructor(type, vendor, referrerURL) {
    this.checkpoint = 'enter';
    this.type = type;
    this.vendor = vendor;
    this.source = referrerURL;
  }
}

export function classifyReferrer(referrerURL) {
  if (!referrerURL) return undefined;
  const result = referrers.find(({ match }) => match.test(referrerURL));
  if (result) return new Referrer(result.type, result.vendor, referrerURL);
  return undefined;
}
