import test from 'node:test';
import assert from 'node:assert/strict';
import { splitCommand } from '../src/shell.js';

test('splits quoted and escaped command arguments', () => {
  assert.deepEqual(splitCommand('node -e "console.log(\\"hello world\\")"'), {
    command: 'node',
    args: ['-e', 'console.log("hello world")']
  });
});

test('preserves empty and escaped unquoted arguments', () => {
  assert.deepEqual(splitCommand('command "" two\\ words'), {
    command: 'command',
    args: ['', 'two words']
  });
});

test('rejects empty commands', () => {
  assert.throws(() => splitCommand('   \t'), /command is empty/);
});

test('rejects unmatched single quotes', () => {
  assert.throws(() => splitCommand("node -e 'console.log(1)"), /unterminated single quote/);
});

test('rejects unmatched double quotes', () => {
  assert.throws(() => splitCommand('node -e "console.log(1)'), /unterminated double quote/);
});

test('rejects an unterminated escape', () => {
  assert.throws(() => splitCommand('node script.js\\'), /unterminated escape/);
});

test('accepts closed quotes and escaped spaces', () => {
  assert.deepEqual(splitCommand("node -e 'console.log(1)' two\\ words"), {
    command: 'node',
    args: ['-e', 'console.log(1)', 'two words']
  });
});
