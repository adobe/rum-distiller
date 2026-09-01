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
/* global describe, it */
/* eslint-disable max-classes-per-file */

import { expect } from '@esm-bundle/chai';

class FakeWorker {
  constructor() {
    this.onmessage = null;
    this.onerror = null;
    this.onmessageerror = null;
    this.calls = [];
    this.adds = [];
    this.expected = 1;
    this.received = 0;
    this.failNextStreamInit = false;
  }

  // helper to respond like the analysis worker
  respond(id, ok, result, partial = false) {
    const data = { id, ok, result };
    if (partial) data.partial = true;
    // defer to emulate async worker
    setTimeout(() => this.onmessage?.({ data }), 0);
  }

  postMessage({ id, cmd, payload }) {
    this.calls.push({ id, cmd, payload });
    switch (cmd) {
      case 'init':
        this.respond(id, true, { ok: true });
        break;
      case 'stream:init': {
        if (this.failNextStreamInit) {
          this.failNextStreamInit = false; // one-shot failure
          this.respond(id, false, { error: 'boom' });
          break;
        }
        this.expected = Math.max(1, Number(payload?.expectedRequests) || 1);
        this.received = 0;
        this.respond(id, true, { ok: true });
        break;
      }
      case 'stream:add': {
        this.received += Number(payload?.requestsDelta) || 0;
        const coverage = Math.min(1, this.received / this.expected);
        this.adds.push(payload?.chunks?.length || 0);
        const snap = {
          phase: 0,
          totals: {},
          approxQuantiles: {},
          facets: {},
          ingestion: { received: this.received, expected: this.expected, coverage },
        };
        this.respond(id, true, snap);
        break;
      }
      case 'stream:phase': {
        const snap = {
          phase: Number(payload?.phase) || 0,
          totals: {},
          approxQuantiles: {},
          facets: {},
          ingestion: {
            received: this.received,
            expected: this.expected,
            coverage: Math.min(1, this.received / this.expected),
          },
        };
        this.respond(id, true, snap);
        break;
      }
      case 'stream:finalize': {
        const snap = {
          phase: 1,
          totals: {},
          approxQuantiles: {},
          facets: {},
          ingestion: {
            received: this.received,
            expected: this.expected,
            coverage: Math.min(1, this.received / this.expected),
          },
        };
        this.respond(id, true, snap);
        break;
      }
      case 'stream:end':
        this.respond(id, true, { done: true });
        break;
      case 'facet:import':
      case 'series:import':
        this.respond(id, true, { ok: true });
        break;
      case 'cancel':
        this.respond(id, true, { cancelled: true });
        break;
      default:
        this.respond(id, false, { error: `Unknown cmd ${cmd}` });
    }
  }
}

class CompleteQuantileWorker extends FakeWorker {
  postMessage(message) {
    const { id, cmd, payload } = message;
    if (cmd !== 'stream:add') {
      super.postMessage(message);
      return;
    }
    this.calls.push({ id, cmd, payload });
    this.received += Number(payload?.requestsDelta) || 0;
    this.respond(id, true, {
      phase: 1,
      totals: {},
      approxQuantiles: { lcp: { 50: 100 } },
      exactQuantiles: { lcp: { 50: 200 } },
      mergeableQuantiles: { lcp: { 50: 300 } },
      facets: {},
      ingestion: { received: 1, expected: 1, coverage: 1 },
    });
  }
}

class SlowPhaseWorker extends FakeWorker {
  constructor() {
    super();
    this.activePhases = 0;
    this.maxActivePhases = 0;
  }

  postMessage(message) {
    const { id, cmd, payload } = message;
    if (cmd !== 'stream:phase') {
      super.postMessage(message);
      return;
    }
    this.calls.push({ id, cmd, payload });
    this.activePhases += 1;
    this.maxActivePhases = Math.max(this.maxActivePhases, this.activePhases);
    setTimeout(() => {
      this.activePhases -= 1;
      this.onmessage?.({
        data: {
          id,
          ok: true,
          result: {
            phase: Number(payload?.phase) || 0,
            totals: {},
            approxQuantiles: {},
            facets: {},
            ingestion: { received: 1, expected: 1, coverage: 1 },
          },
        },
      });
    }, 20);
  }
}

function mkChunk(n = 10, base = 0) {
  const rumBundles = Array.from({ length: n }, (_, i) => ({
    id: String(base + i + 1),
    url: `https://example.com/p/${(base + i) % 5}`,
    userAgent: 'desktop:mac',
    time: new Date(2025, 0, 1, 12, 0, (base + i) % 60).toISOString(),
    timeSlot: '2025-01-01T12:00:00Z',
    weight: 1,
    events: [
      { checkpoint: 'enter', source: 'https://example.com/ref' },
      { checkpoint: 'cwv-lcp', value: 1000 + (((base + i) * 7) % 1200) },
    ],
  }));
  return { date: '2025-01-01', rumBundles };
}

describe('streaming wrapper behavior (fake worker)', () => {
  it('emits onError when restart fails', async () => {
    const { createStreamingDataChunks } = await import('../../worker/streaming.js');
    const fw = new FakeWorker();
    const dc = createStreamingDataChunks(fw);
    dc.addDistillerSeries('pageViews');
    dc.expectChunks = 1;
    let error;
    const unhandled = [];
    const onUnhandled = (event) => {
      unhandled.push(event.reason);
      event.preventDefault();
    };
    window.addEventListener('unhandledrejection', onUnhandled);
    dc.onError((e) => {
      error = e;
    });

    // initial load/ensureInit succeeds
    await dc.load(mkChunk(5));

    // make next stream:init fail during restart
    fw.failNextStreamInit = true;
    dc.filter = { plainURL: ['/x'] };

    // wait a bit for restart to run and fail
    // wait for onError to be called
    const t0 = performance.now();
    // eslint-disable-next-line no-constant-condition
    while (error === undefined && performance.now() - t0 < 500) {
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
      await new Promise((r) => setTimeout(r, 5));
    }
    await new Promise((r) => {
      setTimeout(r, 20);
    });
    window.removeEventListener('unhandledrejection', onUnhandled);
    expect(error).to.not.equal(undefined);
    // request() rejects with the raw result object when ok=false
    expect(error).to.have.property('error', 'boom');
    expect(unhandled).to.deep.equal([]);
  });

  it('emits onDone without requiring an onSnap handler', async () => {
    const { createStreamingDataChunks } = await import('../../worker/streaming.js');
    const fw = new FakeWorker();
    const dc = createStreamingDataChunks(fw);
    dc.addDistillerSeries('pageViews');
    dc.expectChunks = 1;
    dc.setThresholds(1);
    dc.autoAdvanceIntervalMs = 1;
    let doneCalls = 0;
    const done = new Promise((resolve) => {
      dc.onDone(() => {
        doneCalls += 1;
        resolve();
      });
    });

    await dc.load(mkChunk(5));
    await Promise.race([
      done,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('onDone timed out')), 500);
      }),
    ]);
    expect(doneCalls).to.equal(1);
    await dc.close();
  });

  it('prefers exact quantiles at completion', async () => {
    const { createStreamingDataChunks } = await import('../../worker/streaming.js');
    const dc = createStreamingDataChunks(new CompleteQuantileWorker());
    dc.addDistillerSeries('lcp');
    dc.expectChunks = 1;
    const observed = new Promise((resolve) => {
      dc.onSnap((snap) => {
        const { 50: median } = snap.quantiles.lcp;
        resolve(median);
      });
    });

    await dc.load(mkChunk(5));
    expect(await observed).to.equal(200);
    await dc.close();
  });

  it('does not overlap automatic phase requests', async () => {
    const { createStreamingDataChunks } = await import('../../worker/streaming.js');
    const fw = new SlowPhaseWorker();
    const dc = createStreamingDataChunks(fw);
    dc.addDistillerSeries('pageViews');
    dc.expectChunks = 1;
    dc.setThresholds(1);
    dc.autoAdvanceIntervalMs = 1;
    const done = new Promise((resolve) => {
      dc.onDone(resolve);
    });

    await dc.load(mkChunk(5));
    await Promise.race([
      done,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('phase advance timed out')), 500);
      }),
    ]);
    expect(fw.maxActivePhases).to.equal(1);
    await dc.close();
  });

  it('replays only up to maxSlices during restart', async () => {
    const { createStreamingDataChunks } = await import('../../worker/streaming.js');
    const fw = new FakeWorker();
    const dc = createStreamingDataChunks(fw);
    dc.addDistillerSeries('pageViews');
    dc.expectChunks = 3;
    dc.maxSlices = 2; // only keep 2 most recent slices

    await dc.load(mkChunk(3, 0));
    await dc.load(mkChunk(3, 3));
    await dc.load(mkChunk(3, 6));

    // clear counters to record only restart traffic
    fw.adds = [];

    dc.filter = { some: ['facet'] };
    // wait until restart has replayed slices (or timeout)
    const start = performance.now();
    // eslint-disable-next-line no-constant-condition
    while (fw.adds.reduce((a, b) => a + b, 0) < 2) {
      if (performance.now() - start > 500) break;
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
      await new Promise((r) => setTimeout(r, 5));
    }
    expect(fw.adds.reduce((a, b) => a + b, 0)).to.equal(2, 'should replay exactly 2 slices');
  });
});
