#!/usr/bin/env node
/**
 * scripts/ship.mjs
 * ─────────────────────────────────────────────────────────
 * Full pipeline: build → autofix test loop → commit → push
 *
 * Usage:
 *   npm run ship -- "your commit message"
 *   npm run ship -- "fix: orbit controls" --tries 3
 *
 * Flags:
 *   --tries N   max test retry attempts (default 5)
 *   --branch X  push to branch X instead of current branch
 * ─────────────────────────────────────────────────────────
 */

import { execSync, spawnSync } from 'child_process';
import process from 'process';

// ── Parse args ────────────────────────────────────────────
const args = process.argv.slice(2);
const triesIdx = args.indexOf('--tries');
const MAX_TRIES = triesIdx !== -1 ? parseInt(args[triesIdx + 1], 10) : 5;
const branchIdx = args.indexOf('--branch');
const FORCE_BRANCH = branchIdx !== -1 ? args[branchIdx + 1] : null;

// Message = everything that isn't a flag or its value
const flagArgs = new Set();
['--tries', '--branch'].forEach(f => {
  const i = args.indexOf(f);
  if (i !== -1) { flagArgs.add(i); flagArgs.add(i + 1); }
});
const msg = args.filter((_, i) => !flagArgs.has(i)).join(' ').trim();

if (!msg) {
  console.error('Usage: npm run ship -- "commit message" [--tries N] [--branch X]');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────
const green  = s => `\x1b[32m${s}\x1b[0m`;
const red    = s => `\x1b[31m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const bold   = s => `\x1b[1m${s}\x1b[0m`;

function step(label, cmd) {
  console.log(bold(`\n▶  ${label}`));
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch {
    console.error(red(`\n✖  "${label}" failed — aborting ship.`));
    process.exit(1);
  }
}

function query(cmd) {
  try { return execSync(cmd, { encoding: 'utf8' }).trim(); }
  catch { return ''; }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Step 1: Build ─────────────────────────────────────────
step('Build', 'npm run build');

// ── Step 2: Auto-fix test loop ────────────────────────────
console.log(bold(`\n▶  Test loop (max ${MAX_TRIES} attempts)`));

async function testLoop() {
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    console.log(bold(`\n   Attempt ${attempt}/${MAX_TRIES}…`));
    const r = spawnSync('npm', ['test'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      shell: process.platform === 'win32',  // needed on Windows for npm, no arg-injection risk
    });
    const out = (r.stdout || '') + (r.stderr || '');
    process.stdout.write(r.stdout || '');
    if (r.stderr) process.stderr.write(r.stderr);

    if (r.status === 0) {
      const m = out.match(/(\d+)\s+passed/);
      console.log(green(`\n   ✔  ${m ? m[1] : '?'} tests passed (attempt ${attempt})`));
      return true;
    }
    if (attempt < MAX_TRIES) {
      console.log(yellow(`   ⚠  Failed — retrying in 2s…`));
      await sleep(2000);
    }
  }
  return false;
}

(async () => {
  const passed = await testLoop();
  if (!passed) {
    console.error(red(`\n✖  Tests still failing after ${MAX_TRIES} attempts — aborting ship.`));
    process.exit(1);
  }

  // ── Step 3: Commit ─────────────────────────────────────
  step('Stage all', 'git add -A');

  // Check if there's anything to commit
  const status = query('git status --porcelain');
  if (!status) {
    console.log(yellow('\nℹ  Nothing to commit — working tree clean.'));
  } else {
    step('Commit', `git commit -m "${msg.replace(/"/g, '\\"')}"`);
  }

  // ── Step 4: Push (if origin exists) ───────────────────
  const remotes = query('git remote');
  if (remotes.includes('origin')) {
    const branch = FORCE_BRANCH || query('git rev-parse --abbrev-ref HEAD');
    step(`Push → origin/${branch}`, `git push origin ${branch}`);
    console.log(green(`\n✔  Shipped! Pushed to origin/${branch}`));
  } else {
    console.log(yellow('\nℹ  No "origin" remote — committed locally only.'));
    console.log('   Add remote: git remote add origin https://<TOKEN>@github.com/<USER>/three-app.git');
    console.log(green('\n✔  Local ship complete!'));
  }
})();
