import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/cli.js';

test('parses core cli options', () => {
  const options = parseArgs(['--cwd', 'fixtures/npm-safe', '--dry-run', '--json', '--only', 'test,check', '--timeout', '5'], '/repo');

  assert.equal(options.dryRun, true);
  assert.equal(options.json, true);
  assert.deepEqual(options.onlyKinds, ['test', 'check']);
  assert.equal(options.timeoutMs, 5000);
});

test('rejects unknown kinds', () => {
  assert.throws(() => parseArgs(['--only', 'deploy']), /unknown command kind/);
});
