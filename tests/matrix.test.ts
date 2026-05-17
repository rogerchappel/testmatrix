import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatrix, formatMatrix } from '../src/matrix.js';
import type { RunResult } from '../src/types.js';

const baseResult: RunResult = {
  id: 'package.json:test',
  label: 'test',
  command: 'npm',
  args: ['run', 'test'],
  cwd: '/tmp/example',
  source: 'package.json',
  scriptName: 'test',
  kind: 'test',
  safety: 'safe',
  reason: 'safe local verification command',
  status: 'passed',
  exitCode: 0,
  durationMs: 12,
  stdout: 'ok',
  stderr: ''
};

test('creates summary counts', () => {
  const matrix = createMatrix('/tmp/example', '0.1.0', false, [
    baseResult,
    { ...baseResult, id: 'package.json:build', label: 'build', kind: 'build', status: 'failed', exitCode: 1 }
  ]);

  assert.equal(matrix.summary.total, 2);
  assert.equal(matrix.summary.passed, 1);
  assert.equal(matrix.summary.failed, 1);
});

test('formats a concise terminal matrix', () => {
  const matrix = createMatrix('/tmp/example', '0.1.0', false, [baseResult]);

  assert.match(formatMatrix(matrix), /PASSED\s+test\s+test/);
});
