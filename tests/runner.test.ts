import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { runCommand } from '../src/runner.js';
import type { CandidateCommand } from '../src/types.js';

const cwd = resolve('fixtures/npm-safe');

function command(overrides: Partial<CandidateCommand> = {}): CandidateCommand {
  return {
    id: 'fixture:test',
    label: 'test',
    command: 'node',
    args: ['-e', "console.log('runner ok')"],
    cwd,
    source: 'package.json',
    scriptName: 'test',
    kind: 'test',
    safety: 'safe',
    reason: 'safe local verification command',
    ...overrides
  };
}

test('runs a safe command', async () => {
  const result = await runCommand(command(), 5000, false);

  assert.equal(result.status, 'passed');
  assert.match(result.stdout, /runner ok/);
});

test('skips blocked commands', async () => {
  const result = await runCommand(command({ safety: 'blocked', reason: 'blocked by safety policy' }), 5000, false);

  assert.equal(result.status, 'skipped');
  assert.match(result.stderr, /blocked/);
});

test('times out a command tree and does not leave its descendant running', async () => {
  const startedAt = Date.now();

  const result = await runCommand(command({ args: [resolve('tests/fixtures/timeout-tree.cjs')] }), 250, false);

  assert.equal(result.status, 'timed-out');
  assert.ok(Date.now() - startedAt < 1000, `timeout took ${Date.now() - startedAt}ms`);
  const descendantMatch = /descendant:(\d+)/.exec(result.stdout);
  assert.ok(descendantMatch, `missing descendant pid in stdout: ${result.stdout}`);
  const descendantPid = Number(descendantMatch[1]);
  assert.ok(Number.isInteger(descendantPid));

  await assert.rejects(async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      process.kill(descendantPid, 0);
      await delay(25);
    }
  }, { code: 'ESRCH' });
});
