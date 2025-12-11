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

/*
 * Browser Worker entry for progressive RUM analysis.
 * Offloads filtering, faceting and totals computation from the main thread.
 */

/* eslint-disable no-restricted-globals */

import { ProgressiveRun } from './progressive.js';
import { StreamingRun } from './streaming.js';

const ctx = /** @type {WorkerGlobalScope} */ (self);
const cancelled = new Set(); // ids cancelled from the client
const streaming = new Map(); // requestId -> StreamingRun

// Internal state
let config = {
  thresholds: [0.12, 0.25, 0.5, 1],
  series: [], // names of built-in series to include
  facets: [], // names of built-in facets to include
  quantiles: [0.5, 0.9, 0.99],
  topK: 50,
  defaultTopK: 50,
  customFacets: {},
  customSeries: {},
};

/** @type {Array<{ date: string, rumBundles: any[] }>} */
let loadedChunks = [];

function respond(id, ok, result) {
  ctx.postMessage({ id, ok, result });
}

ctx.onmessage = async (ev) => {
  const { id, cmd, payload } = ev.data || {};
  try {
    switch (cmd) {
      case 'init': {
        config = {
          thresholds: payload?.thresholds || config.thresholds,
          series: payload?.series || config.series,
          facets: payload?.facets || config.facets,
          quantiles: payload?.quantiles || config.quantiles,
          topK: payload?.topK ?? config.topK,
          defaultTopK: payload?.defaultTopK ?? payload?.topKDefault ?? config.defaultTopK,
          customFacets: config.customFacets || {},
          customSeries: config.customSeries || {},
        };
        loadedChunks = [];
        // Do not echo function-bearing config back to the main thread
        respond(id, true, { ok: true });
        break;
      }
      case 'load': {
        loadedChunks = payload?.chunks || [];
        respond(id, true, { chunks: loadedChunks.length });
        break;
      }
      case 'addData': {
        (payload?.chunks || []).forEach((c) => loadedChunks.push(c));
        respond(id, true, { chunks: loadedChunks.length });
        break;
      }
      case 'computeProgressive': {
        const filterSpec = payload?.filter || {};
        const phases = payload?.thresholds || config.thresholds;
        cancelled.delete(id);
        try {
          const checkCancel = () => {
            if (cancelled.has(id)) throw new Error('cancelled');
          };
          const run = new ProgressiveRun(
            loadedChunks,
            config,
            filterSpec,
            { yieldEvery: 256, cancelCheck: checkCancel },
          );
          for (let i = 0; i < phases.length; i += 1) {
            if (cancelled.has(id)) break;
            // eslint-disable-next-line no-await-in-loop
            const snap = await run.advanceTo(phases[i]);
            if (cancelled.has(id)) break;
            ctx.postMessage({
              id, ok: true, partial: true, result: snap,
            });
            // Small pause so cancel messages can be processed promptly
            // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
            await new Promise((r) => setTimeout(r, 10));
            if (cancelled.has(id)) break;
          }
          const wasCancelled = cancelled.has(id);
          cancelled.delete(id);
          respond(id, true, { done: true, cancelled: wasCancelled });
        } catch (e) {
          const wasCancelled = e?.message === 'cancelled' || cancelled.has(id);
          cancelled.delete(id);
          if (wasCancelled) respond(id, true, { done: true, cancelled: true });
          else throw e;
        }
        break;
      }
      case 'stream:init': {
        const filterSpec = payload?.filter || {};
        const expected = Number(payload?.expectedRequests) || 1;
        const reqId = id; // tie lifecycle to this request id
        const checkCancel = () => {
          if (cancelled.has(reqId)) throw new Error('cancelled');
        };
        const run = new StreamingRun(
          expected,
          config,
          filterSpec,
          { yieldEvery: 256, cancelCheck: checkCancel },
        );
        streaming.set(reqId, run);
        respond(id, true, { ok: true });
        break;
      }
      case 'stream:add': {
        const reqId = payload?.reqId || id;
        const run = streaming.get(reqId);
        if (!run) {
          respond(id, false, { error: 'no streaming run' });
          break;
        }
        // Accept chunks and optional requestsDelta
        await run.ingest(payload?.chunks || [], Number(payload?.requestsDelta) || 0);
        // Optionally advance to a phase (defaults to current)
        if (Number.isFinite(payload?.phase)) {
          await run.advanceTo(Number(payload.phase));
        }
        respond(id, true, run.snapshot());
        break;
      }
      case 'stream:phase': {
        const reqId = payload?.reqId || id;
        const run = streaming.get(reqId);
        if (!run) {
          respond(id, false, { error: 'no streaming run' });
          break;
        }
        await run.advanceTo(Number(payload?.phase) || 0);
        respond(id, true, run.snapshot());
        break;
      }
      case 'stream:end': {
        const reqId = payload?.reqId || id;
        const run = streaming.get(reqId);
        if (!run) {
          respond(id, false, { error: 'no streaming run' });
          break;
        }
        streaming.delete(reqId);
        respond(id, true, { done: true });
        break;
      }
      case 'stream:finalize': {
        const reqId = payload?.reqId || id;
        const run = streaming.get(reqId);
        if (!run) {
          respond(id, false, { error: 'no streaming run' });
          break;
        }
        const snap = await run.finalize();
        respond(id, true, snap);
        break;
      }
      case 'facet:import': {
        const name = payload?.name;
        const url = payload?.url;
        if (!name || !url) {
          respond(id, false, { error: 'name and url required' });
          break;
        }
        // eslint-disable-next-line no-restricted-syntax
        const mod = await import(url);
        const fn = mod?.[name];
        if (typeof fn !== 'function') {
          respond(id, false, { error: `export ${name} is not a function` });
          break;
        }
        config.customFacets[name] = fn;
        respond(id, true, { ok: true });
        break;
      }
      case 'series:import': {
        const name = payload?.name;
        const url = payload?.url;
        if (!name || !url) {
          respond(id, false, { error: 'name and url required' });
          break;
        }
        // eslint-disable-next-line no-restricted-syntax
        const mod = await import(url);
        const fn = mod?.[name];
        if (typeof fn !== 'function') {
          respond(id, false, { error: `export ${name} is not a function` });
          break;
        }
        config.customSeries[name] = fn;
        respond(id, true, { ok: true });
        break;
      }
      case 'cancel': {
        if (payload?.targetId != null) cancelled.add(payload.targetId);
        respond(id, true, { cancelled: true });
        break;
      }
      default:
        respond(id, false, { error: `Unknown cmd: ${cmd}` });
    }
  } catch (e) {
    respond(id, false, { error: e?.message || String(e) });
  }
};
