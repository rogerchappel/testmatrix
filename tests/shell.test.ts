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
