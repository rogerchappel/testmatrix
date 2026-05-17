import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { detectCommands } from '../src/detect.js';

test('detects and classifies npm fixture commands', async () => {
  const cwd = resolve('fixtures/npm-safe');
  const commands = await detectCommands({ cwd, includeUnsafe: false, onlyKinds: [] });
  const labels = commands.map((command) => command.label);

  assert.deepEqual(labels.sort(), ['build', 'check', 'deploy', 'smoke', 'test', 'validate']);
  assert.equal(commands.find((command) => command.label === 'deploy')?.safety, 'blocked');
  assert.equal(commands.find((command) => command.label === 'test')?.kind, 'test');
});

test('filters detected commands by kind', async () => {
  const cwd = resolve('fixtures/npm-safe');
  const commands = await detectCommands({ cwd, includeUnsafe: false, onlyKinds: ['smoke'] });

  assert.deepEqual(commands.map((command) => command.label), ['smoke']);
});

test('blocks unsafe package script bodies', async () => {
  const cwd = resolve('fixtures/npm-unsafe');
  const commands = await detectCommands({ cwd, includeUnsafe: false, onlyKinds: [] });

  assert.equal(commands.find((command) => command.label === 'fetch')?.safety, 'blocked');
});

test('detects mixed tool fixtures without running them', async () => {
  const cwd = resolve('fixtures/mixed-safe');
  const commands = await detectCommands({ cwd, includeUnsafe: false, onlyKinds: [] });
  const ids = commands.map((command) => command.id).sort();

  assert.ok(ids.includes('Makefile:test'));
  assert.ok(ids.includes('Makefile:build'));
  assert.ok(ids.includes('justfile:smoke'));
  assert.ok(ids.includes('pyproject.toml:check'));
  assert.ok(ids.includes('package.json:typecheck'));
});
