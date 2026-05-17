import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { classifyCommand } from './classify.js';
import { assessSafety } from './safety.js';
import { splitCommand } from './shell.js';
import type { CandidateCommand, CliOptions, CommandSource } from './types.js';

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function makeCandidate(
  cwd: string,
  source: CommandSource,
  scriptName: string,
  commandLine: string,
  includeUnsafe: boolean
): CandidateCommand {
  const kind = classifyCommand(scriptName, commandLine);
  const { command, args } = splitCommand(commandLine);
  const safety = assessSafety(scriptName, commandLine, includeUnsafe);

  return {
    id: `${source}:${scriptName}`,
    label: scriptName,
    command,
    args,
    cwd,
    source,
    scriptName,
    kind,
    ...safety
  };
}

export async function detectPackageScripts(cwd: string, includeUnsafe = false): Promise<CandidateCommand[]> {
  const packageJsonPath = join(cwd, 'package.json');
  if (!(await exists(packageJsonPath))) return [];

  const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8')) as { scripts?: Record<string, string> };
  const scripts = pkg.scripts ?? {};

  return Object.entries(scripts).map(([name, script]) =>
    makeCandidate(cwd, 'package.json', name, `npm run ${name}`, includeUnsafe)
  );
}

export async function detectValidateScript(cwd: string, includeUnsafe = false): Promise<CandidateCommand[]> {
  const validatePath = join(cwd, 'scripts', 'validate.sh');
  if (!(await exists(validatePath))) return [];
  return [makeCandidate(cwd, 'scripts/validate.sh', 'validate', 'bash scripts/validate.sh', includeUnsafe)];
}

export async function detectMakefile(cwd: string, includeUnsafe = false): Promise<CandidateCommand[]> {
  const makefilePath = join(cwd, 'Makefile');
  if (!(await exists(makefilePath))) return [];
  const text = await readFile(makefilePath, 'utf8');
  const targets = [...text.matchAll(/^([A-Za-z0-9_.:-]+):(?:\s|$)/gm)].map((match) => match[1]);
  return targets.map((target) => makeCandidate(cwd, 'Makefile', target, `make ${target}`, includeUnsafe));
}

export async function detectJustfile(cwd: string, includeUnsafe = false): Promise<CandidateCommand[]> {
  const justfilePath = join(cwd, 'justfile');
  if (!(await exists(justfilePath))) return [];
  const text = await readFile(justfilePath, 'utf8');
  const recipes = [...text.matchAll(/^([A-Za-z0-9_.:-]+):(?:\s|$)/gm)].map((match) => match[1]);
  return recipes.map((recipe) => makeCandidate(cwd, 'justfile', recipe, `just ${recipe}`, includeUnsafe));
}

export async function detectPyproject(cwd: string, includeUnsafe = false): Promise<CandidateCommand[]> {
  const pyprojectPath = join(cwd, 'pyproject.toml');
  if (!(await exists(pyprojectPath))) return [];
  const text = await readFile(pyprojectPath, 'utf8');
  const commands: CandidateCommand[] = [];

  const toolScripts = text.match(/^\[tool\.testmatrix\.scripts\]$([\s\S]*?)(?:^\[|\z)/m)?.[1] ?? '';
  for (const match of toolScripts.matchAll(/^([A-Za-z0-9_.:-]+)\s*=\s*"([^"]+)"/gm)) {
    commands.push(makeCandidate(cwd, 'pyproject.toml', match[1], match[2], includeUnsafe));
  }

  if (/^\[tool\.pytest\.ini_options\]/m.test(text) || /^\[tool\.pytest\]/m.test(text)) {
    commands.push(makeCandidate(cwd, 'pyproject.toml', 'test', 'python -m pytest', includeUnsafe));
  }

  return commands;
}

export async function detectCommands(options: Pick<CliOptions, 'cwd' | 'includeUnsafe' | 'onlyKinds'>): Promise<CandidateCommand[]> {
  const commandGroups = await Promise.all([
    detectPackageScripts(options.cwd, options.includeUnsafe),
    detectPyproject(options.cwd, options.includeUnsafe),
    detectMakefile(options.cwd, options.includeUnsafe),
    detectJustfile(options.cwd, options.includeUnsafe),
    detectValidateScript(options.cwd, options.includeUnsafe)
  ]);

  const seen = new Set<string>();
  return commandGroups
    .flat()
    .filter((command) => options.onlyKinds.length === 0 || options.onlyKinds.includes(command.kind))
    .filter((command) => {
      const key = `${command.command} ${command.args.join(' ')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label));
}
