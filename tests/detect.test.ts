import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { detectCommands } from '../src/detect.js';
import { runCommand } from '../src/runner.js';

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
  assert.ok(ids.includes('Makefile:alpha'));
  assert.ok(ids.includes('Makefile:beta'));
  assert.ok(ids.includes('Makefile:gamma'));
  assert.ok(ids.includes('justfile:smoke'));
  assert.ok(ids.includes('pyproject.toml:check'));
  assert.ok(ids.includes('package.json:typecheck'));
});

test('detects just recipes with defaulted parameters', async () => {
  const cwd = resolve('fixtures/just-parameters');
  const commands = await detectCommands({ cwd, includeUnsafe: false, onlyKinds: [] });

  assert.equal(commands.length, 1);
  assert.deepEqual(commands[0], {
    id: 'justfile:test',
    label: 'test',
    command: 'just',
    args: ['test'],
    cwd,
    source: 'justfile',
    scriptName: 'test',
    kind: 'test',
    safety: 'safe',
    reason: 'safe local verification command'
  });
});

test('detects each ordinary multi-target and double-colon Make rule target', async () => {
  const cwd = resolve('fixtures/mixed-safe');
  const commands = await detectCommands({ cwd, includeUnsafe: false, onlyKinds: [] });
  const makeCommands = commands.filter((command) => command.source === 'Makefile');

  assert.deepEqual(
    makeCommands.map(({ id, args }) => ({ id, args })).sort((a, b) => a.id.localeCompare(b.id)),
    [
      { id: 'Makefile:alpha', args: ['alpha'] },
      { id: 'Makefile:beta', args: ['beta'] },
      { id: 'Makefile:build', args: ['build'] },
      { id: 'Makefile:gamma', args: ['gamma'] },
      { id: 'Makefile:test', args: ['test'] }
    ]
  );
});

test('omits npm lifecycle hooks that their parent script runs automatically', async () => {
  const cwd = resolve('fixtures/lifecycle-safe');
  const commands = await detectCommands({ cwd, includeUnsafe: false, onlyKinds: [] });

  assert.deepEqual(commands.filter((command) => command.source === 'package.json').map((command) => command.id).sort(), [
    'package.json:pretest-report',
    'package.json:test'
  ]);
});

test('preserves and runs nontrivial package script names as exact arguments', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'testmatrix-script-names-'));
  const scripts = {
    'test unit': 'node -e "console.log(\'space\')"',
    'check"quoted': 'node -e "console.log(\'quote\')"',
    'smoke\\path': 'node -e "console.log(\'backslash\')"'
  };

  try {
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ scripts }));
    const commands = await detectCommands({ cwd, includeUnsafe: false, onlyKinds: [] });

    assert.deepEqual(
      commands.map(({ scriptName, command, args, safety }) => ({ scriptName: scriptName!, command, args, safety }))
        .sort((a, b) => a.scriptName.localeCompare(b.scriptName)),
      Object.keys(scripts).sort().map((scriptName) => ({
        scriptName,
        command: 'npm',
        args: ['run', scriptName],
        safety: 'safe'
      }))
    );

    for (const candidate of commands) {
      const result = await runCommand(candidate, 5_000, false);
      assert.equal(result.status, 'passed', `${candidate.scriptName}: ${result.stderr}`);
    }
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('omits Make special targets from runnable candidates', async () => {
  const cwd = resolve('fixtures/lifecycle-safe');
  const commands = await detectCommands({ cwd, includeUnsafe: false, onlyKinds: [] });

  assert.ok(commands.some((command) => command.id === 'Makefile:test'));
  assert.ok(!commands.some((command) => command.id === 'Makefile:.PHONY'));
});

test('decodes, tokenizes, and safely runs quoted pyproject commands', async () => {
  const cwd = resolve('fixtures/quoted-safe');
  const commands = await detectCommands({ cwd, includeUnsafe: false, onlyKinds: [] });
  const quoted = commands.find((command) => command.label === 'quoted');

  assert.ok(quoted);
  assert.equal(quoted.command, 'node');
  assert.deepEqual(quoted.args, ['-e', 'console.log("hello world")']);
  assert.equal(quoted.safety, 'safe');

  const result = await runCommand(quoted, 5_000, false);
  assert.equal(result.status, 'passed');
  assert.equal(result.stdout, 'hello world\n');
});

test('detects, tokenizes, classifies, and safely runs literal pyproject commands', async () => {
  const cwd = resolve('fixtures/quoted-safe');
  const commands = await detectCommands({ cwd, includeUnsafe: false, onlyKinds: [] });
  const literal = commands.find((command) => command.label === 'check:literal');

  assert.ok(literal);
  assert.equal(literal.command, 'node');
  assert.deepEqual(literal.args, ['-e', 'console.log("literal command")']);
  assert.equal(literal.kind, 'check');
  assert.equal(literal.safety, 'safe');

  const result = await runCommand(literal, 5_000, false);
  assert.equal(result.status, 'passed');
  assert.equal(result.stdout, 'literal command\n');
});

test('assesses safety against the full decoded pyproject command', async () => {
  const cwd = resolve('fixtures/quoted-safe');
  const commands = await detectCommands({ cwd, includeUnsafe: false, onlyKinds: [] });

  assert.equal(commands.find((command) => command.label === 'unsafe')?.safety, 'blocked');
});

test('rejects malformed pyproject commands before they can be run', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'testmatrix-malformed-'));
  try {
    await writeFile(join(cwd, 'pyproject.toml'), [
      '[tool.testmatrix.scripts]',
      'broken = "node -e \'console.log(1)"'
    ].join('\n'));

    await assert.rejects(
      detectCommands({ cwd, includeUnsafe: false, onlyKinds: [] }),
      /invalid pyproject\.toml command "broken": command has an unterminated single quote/
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
