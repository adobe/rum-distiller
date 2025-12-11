/*
 * Copyright 2025 Adobe. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Minimal WorkerGlobalScope stub to load analysis.worker.js in Node
class WorkerSelfStub {
  constructor() {
    this.messages = [];
    this.onerror = null;
    this.onmessage = null;
    this.onmessageerror = null;
  }
  postMessage(msg) { this.messages.push(msg); }
}

// Utilities
function findMessageById(stub, id, predicate = () => true) {
  return stub.messages.find((m) => m?.id === id && predicate(m));
}

function mkBundle(id) {
  return {
    id: String(id),
    url: `https://example.com/p/${id % 50}`,
    userAgent: 'desktop:mac',
    time: new Date(2025, 0, 1, 12, 0, id % 60).toISOString(),
    timeSlot: '2025-01-01T12:00:00Z',
    weight: 1,
    events: [
      { checkpoint: 'enter', source: 'https://example.com/ref' },
      { checkpoint: 'cwv-lcp', value: (id * 37) % 1800 },
    ],
  };
}

function mkChunks(nBundles = 4000) {
  const rumBundles = Array.from({ length: nBundles }, (_, i) => mkBundle(i + 1));
  return [{ date: '2025-01-01', rumBundles }];
}

describe('analysis.worker cancellation', () => {
  it('cancels a long progressive run via cancel message', async () => {
    const selfStub = new WorkerSelfStub();
    // attach stub to global scope for the worker module
    // eslint-disable-next-line no-global-assign
    globalThis.self = selfStub;
    await import('../worker/analysis.worker.js');

    // init configuration
    const initId = 1;
    selfStub.onmessage({
      data: {
        id: initId,
        cmd: 'init',
        payload: {
          thresholds: [0.12, 0.25, 0.5, 0.75, 1],
          series: ['pageViews', 'lcp'],
          facets: ['plainURL'],
          quantiles: [0.5, 0.9],
          topK: 10,
        },
      },
    });
    assert.ok(findMessageById(selfStub, initId)?.ok, 'init should respond ok');

    // load many bundles so the worker has time to be cancelled
    const loadId = 2;
    selfStub.onmessage({ data: { id: loadId, cmd: 'load', payload: { chunks: mkChunks() } } });
    assert.ok(findMessageById(selfStub, loadId)?.ok, 'load should respond ok');

    // kick off progressive compute and cancel shortly after
    const runId = 42;
    selfStub.onmessage({ data: { id: runId, cmd: 'computeProgressive', payload: { filter: {} } } });

    // give the worker a short moment to start, then cancel
    await new Promise((r) => setTimeout(r, 5));
    const cancelId = 43;
    selfStub.onmessage({ data: { id: cancelId, cmd: 'cancel', payload: { targetId: runId } } });
    assert.ok(findMessageById(selfStub, cancelId)?.ok, 'cancel command should respond ok');

    // wait until the compute request reports done+cancelled
    const start = Date.now();
    let doneMsg;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      doneMsg = findMessageById(selfStub, runId, (m) => m?.result?.done);
      if (doneMsg) break;
      assert.ok(Date.now() - start < 2000, 'timeout waiting for cancelled result');
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
      await new Promise((r) => setTimeout(r, 10));
    }
    assert.equal(doneMsg.ok, true);
    assert.equal(doneMsg.result.cancelled, true);
  });
});

