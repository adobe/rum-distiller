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
import classifyConsent from '../consent.js';

describe('classifyConsent', () => {
  it('should return undefined if cssSelector is not provided', () => {
    const result = classifyConsent();
    assert.strictEqual(result, undefined);
  });

  it('should return undefined for a non-matching vendor', () => {
    const cssSelector = '#nonexistent-vendor';
    const result = classifyConsent(cssSelector);
    assert.strictEqual(result, undefined);
  });

  it('should correctly identify the target action for a matching vendor', () => {
    const cssSelector = '#onetrust-accept';
    const consent = classifyConsent(cssSelector);
    assert.strictEqual(consent.target, 'accept');
  });

  it('should return undefined for a vendor without specific actions', () => {
    const cssSelector = '#usercentrics-root';
    const consent = classifyConsent(cssSelector);
    assert.strictEqual(consent.target, undefined);
  });
});