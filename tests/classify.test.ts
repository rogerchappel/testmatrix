import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCommand } from '../src/classify.js';

test('classifies common verification script names', () => {
  assert.equal(classifyCommand('test'), 'test');
  assert.equal(classifyCommand('typecheck'), 'check');
  assert.equal(classifyCommand('build'), 'build');
  assert.equal(classifyCommand('smoke'), 'smoke');
  assert.equal(classifyCommand('validate'), 'validate');
});

test('leaves unrelated commands unknown', () => {
  assert.equal(classifyCommand('storybook'), 'unknown');
});
