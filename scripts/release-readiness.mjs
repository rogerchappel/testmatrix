import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const packagePath = resolve(process.argv[2] ?? `${root}/package.json`);
const workflowPath = resolve(process.argv[3] ?? `${root}/.github/workflows/release.yml`);
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
const workflow = readFileSync(workflowPath, 'utf8');
const publishesToNpm = workflow
  .split(/\r?\n/)
  .some((line) => !line.trimStart().startsWith('#') && /\bnpm\s+publish\b/.test(line));

if (pkg.name === 'testmatrix' && publishesToNpm) {
  console.error(
    'Release is not ready: npm package "testmatrix" is an unavailable security-holder identity. ' +
    'Keep npm publication disabled or adopt an explicitly approved, available package name.'
  );
  process.exit(1);
}

console.log(
  publishesToNpm
    ? `Release workflow may publish the approved package identity ${pkg.name}.`
    : `npm publication is disabled for package identity ${pkg.name}.`
);
