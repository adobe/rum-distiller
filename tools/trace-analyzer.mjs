#!/usr/bin/env node
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
/* eslint-disable no-console, no-continue */
/*
 * Quick-and-dirty Chrome trace analyzer focused on v8 CPU profile chunks.
 * Usage: node tools/trace-analyzer.mjs <trace1.json[.gz]> [trace2.json[.gz] ...]
 */
import fs from 'node:fs';
import zlib from 'node:zlib';

function openMaybeGz(path) {
  const buf = fs.readFileSync(path);
  const gz = path.endsWith('.gz');
  const json = gz ? zlib.gunzipSync(buf).toString('utf8') : buf.toString('utf8');
  return JSON.parse(json);
}

function analyzeTrace(trace) {
  // Aggregate time by (url, functionName)
  const urlTotals = new Map(); // key: `${url}#${fn}` => { time, samples }
  // Multiple ProfileChunk parts appear; we need to stitch by id within each chunk
  const events = trace.traceEvents || [];
  for (const ev of events) {
    if (ev.cat !== 'disabled-by-default-v8.cpu_profiler' || ev.name !== 'ProfileChunk') continue;
    const { cpuProfile, timeDeltas } = ev.args.data || {};
    if (!cpuProfile || !cpuProfile.nodes || !Array.isArray(timeDeltas)) continue;
    const nodesById = new Map(cpuProfile.nodes.map((n) => [n.id, n]));
    const samples = cpuProfile.samples || [];
    // Align timeDeltas length to samples length (Chrome includes extra 0/2 markers sometimes)
    const deltas = timeDeltas.slice(0, samples.length);
    for (let i = 0; i < samples.length; i += 1) {
      const node = nodesById.get(samples[i]);
      if (!node || !node.callFrame) continue;
      const { url = '(inline)', functionName = '(anonymous)' } = node.callFrame;
      const key = `${url}#${functionName}`;
      const prev = urlTotals.get(key) || { time: 0, samples: 0 };
      prev.time += deltas[i] || 0; // microseconds
      prev.samples += 1;
      urlTotals.set(key, prev);
    }
  }
  // Group by url host/category
  const entries = [...urlTotals.entries()]
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => b.time - a.time);
  return entries;
}

function fmt(us) {
  // microseconds -> ms
  return `${(us / 1000).toFixed(2)}ms`;
}

if (process.argv.length < 3) {
  console.error('Usage: node tools/trace-analyzer.mjs <trace.json[.gz]> [...]');
  process.exit(1);
}

for (const p of process.argv.slice(2)) {
  try {
    const trace = openMaybeGz(p);
    const entries = analyzeTrace(trace);
    console.log(`\n== ${p} ==`);
    const top = entries
      .filter((e) => e.key.includes('rum-distiller') || e.key.includes('/tools/oversight/'))
      .slice(0, 25);
    if (top.length === 0) {
      console.log('No rum-distiller or oversight frames found. Showing global top 25.');
      top.push(...entries.slice(0, 25));
    }
    for (const { key, time, samples } of top) {
      console.log(`${fmt(time)}\t(samples=${samples})\t${key}`);
    }
  } catch (e) {
    console.error(`Failed to analyze ${p}:`, e.message);
  }
}
