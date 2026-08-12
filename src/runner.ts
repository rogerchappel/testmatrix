import { spawn } from 'node:child_process';
import type { CandidateCommand, RunResult } from './types.js';

const TERMINATION_GRACE_MS = 250;

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
      shell: false,
      detached: process.platform !== 'win32'
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let escalation: NodeJS.Timeout | undefined;

    const killProcessTree = (signal: NodeJS.Signals): void => {
      if (child.pid === undefined) return;

      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
          stdio: 'ignore',
          windowsHide: true
        }).unref();
        return;
      }

      try {
        process.kill(-child.pid, signal);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
      }
    };

    const timeout = setTimeout(() => {
      timedOut = true;
      killProcessTree('SIGTERM');
      if (process.platform !== 'win32') {
        escalation = setTimeout(() => killProcessTree('SIGKILL'), TERMINATION_GRACE_MS);
      }
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      if (escalation) clearTimeout(escalation);
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
      if (escalation) clearTimeout(escalation);
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
