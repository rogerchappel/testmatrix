import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
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
