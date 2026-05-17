import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectCommands } from './detect.js';
import { createMatrix, formatMatrix } from './matrix.js';
import { runCommands } from './runner.js';
import type { CliOptions, CommandKind } from './types.js';

const VALID_KINDS = new Set<CommandKind>(['test', 'check', 'build', 'smoke', 'validate', 'unknown']);

function usage(): string {
  return `Usage: testmatrix [options]

Detect, classify, and run safe local verification commands.

Options:
  --cwd <path>             Repo path to inspect (default: current directory)
  --dry-run                Detect and classify without running commands
  --json                   Print the JSON matrix
  --output <path>          Write JSON matrix to a file
  --only <kind[,kind]>     Limit to test,check,build,smoke,validate,unknown
  --include-unsafe         Run commands blocked by the default safety policy
  --timeout <seconds>      Per-command timeout (default: 120)
  -h, --help               Show help
  --version                Show version
`;
}

async function readVersion(): Promise<string> {
  const here = dirname(fileURLToPath(import.meta.url));
  const packageJson = new URL('../../package.json', `file://${here}/`);
  const pkg = JSON.parse(await readFile(packageJson, 'utf8')) as { version?: string };
  return pkg.version ?? '0.0.0';
}

export function parseArgs(args: string[], envCwd = process.cwd()): CliOptions & { help: boolean; version: boolean } {
  const options: CliOptions & { help: boolean; version: boolean } = {
    cwd: envCwd,
    dryRun: false,
    json: false,
    includeUnsafe: false,
    onlyKinds: [],
    timeoutMs: 120_000,
    help: false,
    version: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case '--cwd':
        options.cwd = resolve(args[++index] ?? '');
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--json':
        options.json = true;
        break;
      case '--output':
        options.output = args[++index];
        break;
      case '--only':
        options.onlyKinds = (args[++index] ?? '')
          .split(',')
          .filter(Boolean)
          .map((kind) => {
            if (!VALID_KINDS.has(kind as CommandKind)) {
              throw new Error(`unknown command kind: ${kind}`);
            }
            return kind as CommandKind;
          });
        break;
      case '--include-unsafe':
        options.includeUnsafe = true;
        break;
      case '--timeout': {
        const seconds = Number(args[++index] ?? '');
        if (!Number.isFinite(seconds) || seconds <= 0) {
          throw new Error('--timeout must be a positive number of seconds');
        }
        options.timeoutMs = seconds * 1000;
        break;
      }
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '--version':
        options.version = true;
        break;
      default:
        throw new Error(`unknown option: ${arg}`);
    }
  }

  return options;
}

export async function main(args: string[]): Promise<void> {
  const options = parseArgs(args);

  if (options.help) {
    process.stdout.write(usage());
    return;
  }

  const version = await readVersion();
  if (options.version) {
    process.stdout.write(`${version}\n`);
    return;
  }

  const cwd = resolve(options.cwd);
  const detected = await detectCommands({ cwd, includeUnsafe: options.includeUnsafe, onlyKinds: options.onlyKinds });
  const results = await runCommands(detected, options.timeoutMs, options.dryRun);
  const matrix = createMatrix(cwd, version, options.dryRun, results);
  const json = JSON.stringify(matrix, null, 2);

  if (options.output) {
    const outputPath = resolve(cwd, options.output);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${json}\n`);
  }

  process.stdout.write(options.json ? `${json}\n` : formatMatrix(matrix));

  if (matrix.summary.failed > 0 || matrix.summary.timedOut > 0) {
    process.exitCode = 1;
  }
}
