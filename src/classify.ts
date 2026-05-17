import type { CommandKind } from './types.js';

const KIND_PATTERNS: Array<[CommandKind, RegExp]> = [
  ['validate', /^(validate|verify|release:check)$/i],
  ['test', /(^|:)(test|tests|unit|spec)(:|$)/i],
  ['check', /(^|:)(check|typecheck|type-check|lint|format:check|fmt:check)(:|$)/i],
  ['build', /(^|:)(build|compile)(:|$)/i],
  ['smoke', /(^|:)(smoke|e2e|integration)(:|$)/i]
];

export function classifyCommand(name: string, command = ''): CommandKind {
  const haystack = `${name} ${command}`;
  for (const [kind, pattern] of KIND_PATTERNS) {
    if (pattern.test(haystack)) {
      return kind;
    }
  }
  return 'unknown';
}
