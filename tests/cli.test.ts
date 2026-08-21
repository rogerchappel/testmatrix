import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from '../src/cli.js';

test('parses core cli options', () => {
  const options = parseArgs(['--cwd', 'fixtures/npm-safe', '--dry-run', '--json', '--only', 'test,check', '--timeout', '5'], '/repo');

  assert.equal(options.cwd, resolve('fixtures/npm-safe'));
  assert.equal(options.dryRun, true);
  assert.equal(options.json, true);
  assert.deepEqual(options.onlyKinds, ['test', 'check']);
  assert.equal(options.timeoutMs, 5000);
});

test('preserves valid values for every value-taking option', () => {
  const options = parseArgs([
    '--cwd',
    'fixtures/npm-safe',
    '--output',
    '.testmatrix/custom.json',
    '--only',
    'build,smoke',
    '--timeout',
    '2.5'
  ]);

  assert.equal(options.cwd, resolve('fixtures/npm-safe'));
  assert.equal(options.output, '.testmatrix/custom.json');
  assert.deepEqual(options.onlyKinds, ['build', 'smoke']);
  assert.equal(options.timeoutMs, 2500);
});

for (const option of ['--cwd', '--output', '--only', '--timeout']) {
  test(`${option} rejects a missing value`, () => {
    assert.throws(() => parseArgs([option]), new RegExp(`${option} requires a value`));
  });

  test(`${option} rejects another option as its value`, () => {
    assert.throws(() => parseArgs([option, '--json']), new RegExp(`${option} requires a value`));
  });

  test(`${option} produces a concise CLI error and nonzero exit`, () => {
    const result = spawnSync(process.execPath, ['./bin/testmatrix.js', option, '--json'], {
      cwd: resolve('.'),
      encoding: 'utf8'
    });

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `testmatrix: ${option} requires a value\n`);
  });
}

test('rejects unknown kinds', () => {
  assert.throws(() => parseArgs(['--only', 'deploy']), /unknown command kind/);
});

test('reports malformed pyproject commands without spawning them', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'testmatrix-cli-malformed-'));
  const marker = join(cwd, 'spawned');
  try {
    writeFileSync(join(cwd, 'pyproject.toml'), [
      '[tool.testmatrix.scripts]',
      `broken = "node -e \'require(\\\"node:fs\\\").writeFileSync(\\\"${marker}\\\", \\\"yes\\\")"`
    ].join('\n'));

    const result = spawnSync(process.execPath, ['./bin/testmatrix.js', '--cwd', cwd], {
      cwd: resolve('.'),
      encoding: 'utf8'
    });

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^testmatrix: invalid pyproject\.toml command "broken": command has an unterminated single quote\n$/);
    assert.equal(existsSync(marker), false);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
