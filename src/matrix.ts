import type { ResultMatrix, RunResult } from './types.js';

export function createMatrix(cwd: string, version: string, dryRun: boolean, commands: RunResult[]): ResultMatrix {
  return {
    tool: 'testmatrix',
    version,
    cwd,
    generatedAt: new Date().toISOString(),
    dryRun,
    commands,
    summary: {
      total: commands.length,
      passed: commands.filter((command) => command.status === 'passed').length,
      failed: commands.filter((command) => command.status === 'failed').length,
      skipped: commands.filter((command) => command.status === 'skipped').length,
      timedOut: commands.filter((command) => command.status === 'timed-out').length
    }
  };
}

export function formatMatrix(matrix: ResultMatrix): string {
  const lines = [
    'TestMatrix',
    `cwd: ${matrix.cwd}`,
    `summary: ${matrix.summary.passed} passed, ${matrix.summary.failed} failed, ${matrix.summary.skipped} skipped, ${matrix.summary.timedOut} timed out`,
    ''
  ];

  for (const command of matrix.commands) {
    const argv = [command.command, ...command.args].join(' ');
    lines.push(
      `${command.status.toUpperCase().padEnd(9)} ${command.kind.padEnd(8)} ${command.label}  ${argv}`
    );
    if (command.status !== 'passed' && command.stderr.trim()) {
      lines.push(`  ${command.stderr.trim().split('\n')[0]}`);
    }
  }

  return `${lines.join('\n')}\n`;
}
