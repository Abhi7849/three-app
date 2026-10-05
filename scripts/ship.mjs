#!/usr/bin/env node
/**
 * scripts/ship.mjs
 * Usage:  npm run ship -- "commit message"
 *
 * 1. Build
 * 2. Run tests (abort on failure)
 * 3. Commit
 * 4. Push (skipped when no 'origin' remote is configured)
 */

import { execSync } from 'child_process';
import process from 'process';

const msg = process.argv.slice(2).join(' ').trim();
if (!msg) {
  console.error('Usage: npm run ship -- "your commit message"');
  process.exit(1);
}

function run(cmd, label) {
  console.log(`\n▶ ${label}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch {
    console.error(`\n✖ "${label}" failed — aborting ship.`);
    process.exit(1);
  }
}

run('npm run build', 'Build');
run('npm test', 'Tests');

run(`git add -A`, 'Stage all');
run(`git commit -m "${msg.replace(/"/g, '\\"')}"`, 'Commit');

// Push only when a remote exists
try {
  const remotes = execSync('git remote').toString().trim();
  if (remotes.includes('origin')) {
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    run(`git push origin ${branch}`, `Push → origin/${branch}`);
  } else {
    console.log('\nℹ No "origin" remote — committed locally only.');
  }
} catch {
  console.log('\nℹ Could not determine remote — committed locally only.');
}

console.log('\n✔ Ship complete!');
