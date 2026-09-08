# testmatrix

TestMatrix finds the verification commands hiding in a repo, filters out risky ones, runs the safe set, and leaves behind a compact result matrix. It is built for maintainers and coding agents who need the answer to one plain question: what passed locally?

Until the first npm release is available, install the CLI from its source checkout:

```bash
git clone https://github.com/rogerchappel/testmatrix.git
cd testmatrix
npm install
npm run build
npm install --global .
testmatrix --cwd .
```

The `testmatrix` package currently present on npm is a security-holder package
and does not provide this CLI. Published-package installation instructions will
replace the source-install steps after the first project release is available.
Automated npm publication is disabled while that package identity is
unavailable. Version tags validate and pack the project, then create a GitHub
release containing the tarball; they do not publish to npm.

For repository development:

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

Package scripts named `pre<name>` or `post<name>` are omitted when `<name>` is
also present, because the package manager runs those lifecycle hooks automatically
with their parent script. Similar standalone names are still detected when no
matching parent exists. Makefile metadata and special targets whose names begin
with `.`, such as `.PHONY`, are not treated as runnable commands. Ordinary
multi-target rules and double-colon rules are detected under each declared
target name.

Justfile recipes with parameters are detected by recipe name. Parameters with
defaults do not become command arguments during detection, so a declaration
such as `test filter="":` produces the safe candidate `just test`; callers can
still invoke the recipe separately with an explicit parameter value.

`[tool.testmatrix.scripts]` accepts single-line TOML basic (double-quoted) and
literal (single-quoted) strings. Arguments may be grouped with single or double
quotes; use TOML escapes for quotes that belong inside a basic string. Literal
strings preserve their contents unchanged. For example:

```toml
[tool.testmatrix.scripts]
quoted = "node -e \"console.log(\\\"hello world\\\")\""
check:literal = 'node -e "console.log(\"literal command\")"'
```

This runs `node` with the two arguments `-e` and `console.log("hello world")`.

After TOML decoding, each command must contain a non-empty executable name,
balanced single or double quotes, and a character after every unquoted or
double-quoted backslash. TestMatrix rejects malformed entries during detection,
before any command is spawned, and identifies the source and script name in its
diagnostic.

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

Options that take a value (`--cwd`, `--output`, `--only`, and `--timeout`)
must be followed by that value. A missing value or another option in its place
exits nonzero with an option-specific error, for example:

```text
testmatrix: --output requires a value
```

`--timeout` applies to the command's process tree. On POSIX systems, testmatrix sends
`SIGTERM` to the command's process group and escalates to `SIGKILL` after a 250 ms
grace period. On Windows, it uses `taskkill /T /F` to terminate the tree immediately.
Commands that detach themselves into a different process group are outside this guarantee.

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
npm run package:smoke
npm run release:readiness
npm run release:check
bash scripts/validate.sh
```

The smoke script builds the CLI and runs it against `fixtures/npm-safe`, writing `fixtures/npm-safe/.testmatrix/results.json`.
The package smoke test installs the generated tarball into a clean temporary
consumer and verifies its `testmatrix --version` and `--help` commands.
`release:check` chains the local verification commands with that clean-consumer
check so release-facing changes exercise both behavior and package contents.
The release-readiness check prevents a workflow from publishing the
security-holder `testmatrix` identity. Version tags run the same checks and
retain the packed tarball as a GitHub release asset. npm publication can be
enabled only after the project adopts an available package identity.

## Matrix Shape

The JSON output includes:

- tool/version/cwd/timestamp
- dry-run flag
- per-command source, kind, safety, status, exit code, duration, stdout, stderr
- summary counts for passed, failed, skipped, and timed-out commands

Small tool, clear table, no guessing game.
