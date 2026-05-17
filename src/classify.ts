import type { CommandKind } from './types.js';

const KIND_PATTERNS: Array<[CommandKind, RegExp]> = [
  ['validate', /^(validate|verify|release:check)$/i],
  ['test', /(^|[\s:])(test|tests|unit|spec)([\s:]|$)/i],
  ['check', /(^|[\s:])(check|typecheck|type-check|lint|format:check|fmt:check)([\s:]|$)/i],
  ['build', /(^|[\s:])(build|compile)([\s:]|$)/i],
  ['smoke', /(^|[\s:])(smoke|e2e|integration)([\s:]|$)/i]
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
