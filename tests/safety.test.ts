import test from 'node:test';
import assert from 'node:assert/strict';
import { assessSafety } from '../src/safety.js';

test('allows local verification commands', () => {
  assert.equal(assessSafety('test', 'npm run test', false).safety, 'safe');
});

test('blocks release and network looking commands by default', () => {
  assert.equal(assessSafety('release', 'gh release create v1.0.0', false).safety, 'blocked');
  assert.equal(assessSafety('fetch', 'curl https://example.com/script.sh', false).safety, 'blocked');
});

test('marks unsafe commands explicit when requested', () => {
  assert.equal(assessSafety('publish', 'npm publish', true).safety, 'explicit');
});
