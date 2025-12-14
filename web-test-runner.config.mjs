/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import { puppeteerLauncher } from '@web/test-runner-puppeteer';

const isCI = !!process.env.CI;

export default {
  nodeResolve: true,
  devServer: {
    middleware: [
      // Enable nested module workers (sub-workers) by making the page cross-origin isolated
      function setCOOPCOEP(ctx, next) {
        ctx.response.set('Cross-Origin-Opener-Policy', 'same-origin');
        ctx.response.set('Cross-Origin-Embedder-Policy', 'require-corp');
        ctx.response.set('Cross-Origin-Resource-Policy', 'same-origin');
        return next();
      },
    ],
  },
  browsers: [puppeteerLauncher({
    launchOptions: {
      headless: 'new',
      // Some CI runners require no-sandbox to allow Chromium to start workers
      args: isCI ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
    },
  })],
  files: ['test/browser/**/*.test.js'],
  testFramework: {
    config: {
      timeout: 20000,
    },
  },
};
