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
const vendors = [
  {
    vendor: 'onetrust',
    match: /#onetrust-/,
    accept: /accept/,
    reject: /reject/,
    dismiss: /close-pc-btn-handler/,
  },
  {
    vendor: 'onetrust',
    match: /#ot-/,
    accept: /accept/,
    reject: /reject/,
    dismiss: /close-pc-btn-handler/,
  },
  {
    vendor: 'usercentrics',
    match: /#usercentrics-root/,
    // we don't have nicely id'd buttons here
  },
  {
    vendor: 'truste',
    match: /#truste/,
    accept: /consent-button/,
    dismiss: /close/,
  },
  {
    vendor: 'cybot',
    match: /#CybotCookiebot/,
    accept: /AllowAll/,
    reject: /Decline/,
  },
  {
    vendor: 'cassie',
    match: /button#cassie/,
    accept: /accept/,
    reject: /reject/,
  },
  // tealium, a.ka. didomi
  {
    vendor: 'tealium',
    match: /#didomi/,
    accept: /didomi-notice-agree-button$/,
    reject: /didomi-notice-disagree-button$/,
    dismiss: /(didomi-popup-closeBtn-icon|didomi-popup-close|didomi-continue-without-agreeing)$/,
  },
];

class Consent {
  constructor(vendor, spec, cssSelector) {
    this.checkpoint = 'consent';
    this.vendor = vendor;
    this.spec = spec;
    this.cssSelector = cssSelector;
  }

  get target() {
    return Object.entries(this.spec)
      .filter(([key]) => key !== 'match' && key !== 'vendor')
      .filter(([, pattern]) => pattern.test(this.cssSelector))
      .map(([key]) => key)
      .pop();
  }
}

export default function classifyConsent(cssSelector) {
  if (!cssSelector) return undefined;
  const result = vendors.find(({ match }) => match.test(cssSelector));
  if (result) return new Consent(result.vendor, result, cssSelector);
  return undefined;
}
