#!/usr/bin/env node
/**
 * scripts/autofix.mjs
 * ─────────────────────────────────────────────────────────
 * Automated test-and-fix loop.
 *
 * Usage:
 *   node scripts/autofix.mjs            # up to 5 attempts
 *   node scripts/autofix.mjs --tries 3  # custom max attempts
 *
 * What it does:
 *   1. Runs `npm test`
 *   2. If all tests pass → exits 0 (success)
 *   3. If tests fail    → parses the failure output, logs
 *      a summary, waits a beat, then re-runs (up to MAX tries)
 *   4. If still failing after MAX tries → exits 1
 *
 * NOTE: This loop handles transient / timing failures
 * (race conditions, port collisions, slow CI). For logic
 * failures you need to edit the source — this script tells
 * you exactly which test failed and why.
 * ─────────────────────────────────────────────────────────
 */

import { execSync } from 'child_process';
import process from 'process';

// ── Config ────────────────────────────────────────────────
const MAX_TRIES = (() => {
  const idx = process.argv.indexOf('--tries');
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) : 5;
})();

const RETRY_DELAY_MS = 2000;

// ── Helpers ───────────────────────────────────────────────
const green = s => `\x1b[32m${s}\x1b[0m`;
const red   = s => `\x1b[31m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const bold  = s => `\x1b[1m${s}\x1b[0m`;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function parseFailures(output) {
  const lines = output.split('\n');
  const failures = [];
  let current = null;
  for (const line of lines) {
    if (/^\s+(not ok|✘|FAILED|×)\s+/.test(line) || /›.*FAILED/.test(line)) {
      failures.push(line.trim());
    }
    if (/Error:/.test(line) && current !== line) {
      current = line;
      failures.push('  ' + line.trim());
    }
  }
  return failures.length ? failures : ['(see output above for details)'];
}

// ── Main loop ─────────────────────────────────────────────
async function run() {
  console.log(bold('\n🔄  AUTO-FIX TEST LOOP'));
  console.log(`    Max attempts: ${MAX_TRIES}\n`);

  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    console.log(bold(`── Attempt ${attempt} / ${MAX_TRIES} ──────────────────────────`));

    let rawOut = '', rawErr = '', exitCode = 0;
    try {
      rawOut = execSync('npm test', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      rawOut = err.stdout || '';
      rawErr = err.stderr || '';
      exitCode = err.status ?? 1;
    }

    const combined = rawOut + '\n' + rawErr;

    // Print output
    if (rawOut) process.stdout.write(rawOut);
    if (rawErr) process.stderr.write(rawErr);

    if (exitCode === 0) {
      // ── All tests passed ──────────────────────────────
      const passedMatch = combined.match(/(\d+)\s+passed/);
      const count = passedMatch ? passedMatch[1] : '?';
      console.log(green(`\n✔  All ${count} tests passed on attempt ${attempt}!\n`));
      process.exit(0);
    }

    // ── Tests failed ──────────────────────────────────
    const failures = parseFailures(combined);
    console.log(red(`\n✖  Tests failed on attempt ${attempt}:`));
    failures.forEach(f => console.log(yellow('   ' + f)));

    if (attempt < MAX_TRIES) {
      console.log(`\n   Waiting ${RETRY_DELAY_MS}ms before retry…\n`);
      await sleep(RETRY_DELAY_MS);
    }
  }

  console.log(red(`\n✖  Tests still failing after ${MAX_TRIES} attempts.`));
  console.log('   → Fix the failing test or source file, then re-run.\n');
  process.exit(1);
}

run();
