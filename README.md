# testmatrix

TestMatrix finds the verification commands hiding in a repo, filters out risky ones, runs the safe set, and leaves behind a compact result matrix. It is built for maintainers and coding agents who need the answer to one plain question: what passed locally?

```bash
npm install
npm run build
node ./bin/testmatrix.js --cwd fixtures/npm-safe
```

## What It Detects

- `package.json` scripts
- `scripts/validate.sh`
- `Makefile` targets
- `justfile` recipes
- `pyproject.toml` entries under `[tool.testmatrix.scripts]`
- pytest projects via `python -m pytest`

Commands are classified as `test`, `check`, `build`, `smoke`, `validate`, or `unknown`.

## Safety Defaults

By default, TestMatrix skips command names and command bodies that look like deploys, publishes, releases, migrations, production work, or network shelling. Skipped commands still appear in the matrix so the omission is visible.

Run a detection-only pass:

```bash
node ./bin/testmatrix.js --dry-run --cwd fixtures/npm-safe
```

Write JSON for an agent handoff:

```bash
node ./bin/testmatrix.js --cwd fixtures/npm-safe --json --output .testmatrix/results.json
```

Only run one class of command:

```bash
node ./bin/testmatrix.js --only test,check
```

Include blocked commands only when you have reviewed them:

```bash
node ./bin/testmatrix.js --include-unsafe
```

## Development

```bash
npm test
npm run check
npm run build
npm run smoke
npm run release:check
bash scripts/validate.sh
```

The smoke script builds the CLI and runs it against `fixtures/npm-safe`, writing `fixtures/npm-safe/.testmatrix/results.json`.
`release:check` chains the local verification commands with the package dry-run
so release-facing changes exercise both behavior and package contents.

## Matrix Shape

The JSON output includes:

- tool/version/cwd/timestamp
- dry-run flag
- per-command source, kind, safety, status, exit code, duration, stdout, stderr
- summary counts for passed, failed, skipped, and timed-out commands

Small tool, clear table, no guessing game.
