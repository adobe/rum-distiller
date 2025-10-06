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

/**
 * CPU Profiling script with flamegraph generation
 *
 * Usage:
 *   npm run profile              # Profile all benchmarks
 *   npm run profile filtering    # Profile specific benchmark
 *   npm run profile -- --tool=0x # Use specific profiling tool
 *
 * Profiling Tools:
 *   - native: Node.js built-in profiler (--prof)
 *   - 0x: Interactive flamegraph (requires: npm install -g 0x)
 *   - clinic: Clinic.js suite (requires: npm install -g clinic)
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const PROFILE_DIR = 'test/benchmarks/profiles';
const TOOLS = {
  native: {
    name: 'Node.js Native Profiler',
    command: 'node',
    args: ['--prof', '--prof-process'],
    outputFormat: 'txt',
  },
  '0x': {
    name: '0x Flamegraph',
    command: '0x',
    args: [],
    outputFormat: 'html',
    checkInstalled: 'which 0x',
  },
  clinic: {
    name: 'Clinic.js',
    command: 'clinic',
    args: ['flame', '--'],
    outputFormat: 'html',
    checkInstalled: 'which clinic',
  },
};

/**
 * Parses command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const benchmark = args.find((arg) => !arg.startsWith('--')) || 'all';
  const toolArg = args.find((arg) => arg.startsWith('--tool='));
  const tool = toolArg ? toolArg.split('=')[1] : 'native';

  return { benchmark, tool };
}

/**
 * Ensures profile directory exists
 */
function ensureProfileDir() {
  if (!existsSync(PROFILE_DIR)) {
    mkdirSync(PROFILE_DIR, { recursive: true });
  }
}

/**
 * Checks if a profiling tool is installed
 */
async function checkToolInstalled(tool) {
  if (!tool.checkInstalled) return true;

  return new Promise((resolve) => {
    const check = spawn('sh', ['-c', tool.checkInstalled]);
    check.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Runs profiling with native Node.js profiler
 */
async function profileWithNative(benchmarkFile) {
  console.log('\n=== Profiling with Node.js Native Profiler ===\n');
  console.log(`Profiling: ${benchmarkFile}\n`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const profileFile = join(PROFILE_DIR, `profile-${timestamp}.txt`);

  return new Promise((resolve, reject) => {
    const args = ['--prof', benchmarkFile];
    console.log(`Running: node ${args.join(' ')}\n`);

    const proc = spawn('node', args, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Profiling failed with code ${code}`));
        return;
      }

      // Process the profile
      console.log('\nProcessing profile data...\n');

      // Find the generated isolate file
      const { readdirSync } = await import('fs');
      const isolateFiles = readdirSync('.').filter((f) => f.startsWith('isolate-'));

      if (isolateFiles.length === 0) {
        reject(new Error('No profile data generated'));
        return;
      }

      const isolateFile = isolateFiles[isolateFiles.length - 1];
      console.log(`Found profile: ${isolateFile}\n`);

      const processProc = spawn('node', ['--prof-process', isolateFile], {
        stdio: ['ignore', 'pipe', 'inherit'],
      });

      const { writeFileSync } = await import('fs');
      let output = '';

      processProc.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
      });

      processProc.on('close', () => {
        writeFileSync(profileFile, output);
        console.log(`\nProfile saved to: ${profileFile}\n`);

        // Cleanup isolate file
        const { unlinkSync } = await import('fs');
        unlinkSync(isolateFile);

        resolve(profileFile);
      });
    });

    proc.on('error', reject);
  });
}

/**
 * Runs profiling with 0x
 */
async function profileWith0x(benchmarkFile) {
  console.log('\n=== Profiling with 0x (Flamegraph) ===\n');
  console.log(`Profiling: ${benchmarkFile}\n`);

  const installed = await checkToolInstalled(TOOLS['0x']);
  if (!installed) {
    throw new Error('0x is not installed. Install with: npm install -g 0x');
  }

  return new Promise((resolve, reject) => {
    const args = [benchmarkFile];
    console.log(`Running: 0x ${args.join(' ')}\n`);

    const proc = spawn('0x', args, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Profiling failed with code ${code}`));
        return;
      }

      console.log('\n✅ Flamegraph generated! Opening in browser...\n');
      resolve('flamegraph');
    });

    proc.on('error', reject);
  });
}

/**
 * Runs profiling with Clinic.js
 */
async function profileWithClinic(benchmarkFile) {
  console.log('\n=== Profiling with Clinic.js ===\n');
  console.log(`Profiling: ${benchmarkFile}\n`);

  const installed = await checkToolInstalled(TOOLS.clinic);
  if (!installed) {
    throw new Error('clinic is not installed. Install with: npm install -g clinic');
  }

  return new Promise((resolve, reject) => {
    const args = ['flame', '--', benchmarkFile];
    console.log(`Running: clinic ${args.join(' ')}\n`);

    const proc = spawn('clinic', args, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Profiling failed with code ${code}`));
        return;
      }

      console.log('\n✅ Clinic.js flamegraph generated!\n');
      resolve('clinic-flamegraph');
    });

    proc.on('error', reject);
  });
}

/**
 * Gets the benchmark file path
 */
function getBenchmarkFile(benchmark) {
  const benchmarkMap = {
    filtering: 'test/benchmarks/filtering.bench.js',
    facets: 'test/benchmarks/facets.bench.js',
    grouping: 'test/benchmarks/grouping.bench.js',
    e2e: 'test/benchmarks/e2e.bench.js',
    all: 'test/benchmarks/index.js',
  };

  const file = benchmarkMap[benchmark];
  if (!file) {
    throw new Error(`Unknown benchmark: ${benchmark}. Available: ${Object.keys(benchmarkMap).join(', ')}`);
  }

  return file;
}

/**
 * Main profiling function
 */
async function profile() {
  const { benchmark, tool } = parseArgs();

  console.log('=== RUM Distiller Performance Profiler ===\n');
  console.log(`Benchmark: ${benchmark}`);
  console.log(`Tool: ${tool}\n`);

  ensureProfileDir();

  const benchmarkFile = getBenchmarkFile(benchmark);

  try {
    let result;

    switch (tool) {
      case 'native':
        result = await profileWithNative(benchmarkFile);
        break;
      case '0x':
        result = await profileWith0x(benchmarkFile);
        break;
      case 'clinic':
        result = await profileWithClinic(benchmarkFile);
        break;
      default:
        throw new Error(`Unknown profiling tool: ${tool}. Available: ${Object.keys(TOOLS).join(', ')}`);
    }

    console.log('\n✅ Profiling complete!\n');
    if (result && typeof result === 'string' && result.includes('.txt')) {
      console.log(`View the profile at: ${result}\n`);
    }

    console.log('Tips:');
    console.log('  - Look for hot paths in the flame graph');
    console.log('  - Identify functions with high self-time');
    console.log('  - Check for unexpected function calls');
    console.log('  - Compare profiles before/after optimizations\n');
  } catch (error) {
    console.error(`\n❌ Profiling failed: ${error.message}\n`);
    process.exit(1);
  }
}

// Run profiler
profile().catch((error) => {
  console.error(error);
  process.exit(1);
});
