import type { SafetyLevel } from './types.js';

const BLOCKED_NAME_PATTERNS = [
  /(^|:)(deploy|publish|release|migrate|migration|db|database|seed|prod|production)(:|$)/i
];

const BLOCKED_COMMAND_PATTERNS = [
  /\b(npm|pnpm|yarn|bun)\s+publish\b/i,
  /\bgh\s+release\b/i,
  /\bgit\s+push\b/i,
  /\bcurl\b/i,
  /\bwget\b/i,
  /\bssh\b/i,
  /\bscp\b/i,
  /\brsync\b/i,
  /\bterraform\s+apply\b/i,
  /\bkubectl\s+apply\b/i,
  /\bdocker\s+push\b/i,
  /\bprisma\s+migrate\s+deploy\b/i,
  /\bdrizzle-kit\s+migrate\b/i
];

export interface SafetyDecision {
  safety: SafetyLevel;
  reason: string;
}

export function assessSafety(name: string, command: string, includeUnsafe: boolean): SafetyDecision {
  const blockedByName = BLOCKED_NAME_PATTERNS.find((pattern) => pattern.test(name));
  const blockedByCommand = BLOCKED_COMMAND_PATTERNS.find((pattern) => pattern.test(command));

  if (blockedByName || blockedByCommand) {
    return includeUnsafe
      ? { safety: 'explicit', reason: 'included by --include-unsafe' }
      : { safety: 'blocked', reason: 'blocked by safety policy' };
  }

  return { safety: 'safe', reason: 'safe local verification command' };
}
