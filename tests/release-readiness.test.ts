import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const script = resolve('scripts/release-readiness.mjs');

test('accepts the current release workflow with npm publication disabled', () => {
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /npm publication is disabled/);
});

test('rejects publishing the unavailable security-holder identity', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'testmatrix-release-readiness-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const packagePath = join(directory, 'package.json');
  const workflowPath = join(directory, 'release.yml');
  writeFileSync(packagePath, '{"name":"testmatrix"}\n');
  writeFileSync(workflowPath, 'steps:\n  - run: npm publish --provenance\n');

  const result = spawnSync(process.execPath, [script, packagePath, workflowPath], { encoding: 'utf8' });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /unavailable security-holder identity/);
});
