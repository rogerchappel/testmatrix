import { spawn } from 'node:child_process';
import type { CandidateCommand, RunResult } from './types.js';

function truncate(value: string, maxLength = 12_000): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}\n[truncated]` : value;
}

export async function runCommand(command: CandidateCommand, timeoutMs: number, dryRun: boolean): Promise<RunResult> {
  const startedAt = Date.now();

  if (dryRun || command.safety === 'blocked') {
    return {
      ...command,
      status: 'skipped',
      exitCode: null,
      durationMs: 0,
      stdout: '',
      stderr: dryRun ? 'dry run' : command.reason
    };
  }

  return new Promise((resolve) => {
    const child = spawn(command.command, command.args, {
      cwd: command.cwd,
      env: { ...process.env, CI: process.env.CI ?? '1' },
      shell: false
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      resolve({
        ...command,
        status: 'failed',
        exitCode: null,
        durationMs: Date.now() - startedAt,
        stdout: truncate(stdout),
        stderr: truncate(`${stderr}${error.message}\n`)
      });
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      resolve({
        ...command,
        status: timedOut ? 'timed-out' : code === 0 ? 'passed' : 'failed',
        exitCode: code,
        durationMs: Date.now() - startedAt,
        stdout: truncate(stdout),
        stderr: truncate(stderr)
      });
    });
  });
}

export async function runCommands(commands: CandidateCommand[], timeoutMs: number, dryRun = false): Promise<RunResult[]> {
  const results: RunResult[] = [];
  for (const command of commands) {
    results.push(await runCommand(command, timeoutMs, dryRun));
  }
  return results;
}
