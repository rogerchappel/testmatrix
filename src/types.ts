export type CommandKind = 'test' | 'check' | 'build' | 'smoke' | 'validate' | 'unknown';

export type CommandSource =
  | 'package.json'
  | 'pyproject.toml'
  | 'Makefile'
  | 'justfile'
  | 'scripts/validate.sh';

export type SafetyLevel = 'safe' | 'blocked' | 'explicit';

export interface CandidateCommand {
  id: string;
  label: string;
  command: string;
  args: string[];
  cwd: string;
  source: CommandSource;
  scriptName?: string;
  kind: CommandKind;
  safety: SafetyLevel;
  reason: string;
}

export interface RunResult extends CandidateCommand {
  status: 'passed' | 'failed' | 'skipped' | 'timed-out';
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
}

export interface ResultMatrix {
  tool: 'testmatrix';
  version: string;
  cwd: string;
  generatedAt: string;
  dryRun: boolean;
  commands: RunResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    timedOut: number;
  };
}

export interface CliOptions {
  cwd: string;
  dryRun: boolean;
  json: boolean;
  includeUnsafe: boolean;
  onlyKinds: CommandKind[];
  output?: string;
  timeoutMs: number;
}
