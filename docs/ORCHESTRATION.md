# Orchestration

TestMatrix is intended to be a local-first verification layer for humans and agents.

## Agent Workflow

1. Run `node ./bin/testmatrix.js --dry-run` to inspect what would run.
2. Review skipped commands before deciding whether `--include-unsafe` is justified.
3. Run `node ./bin/testmatrix.js --json --output .testmatrix/results.json`.
4. Report the summary counts and any failed command labels.
5. Include `.testmatrix/results.json` in local handoff notes when useful, but do not commit it.

## Maintainer Workflow

```bash
npm install
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Failure Semantics

- Exits `0` when all run commands pass or are skipped.
- Exits `1` when any command fails or times out.
- Skipped unsafe commands are visible in output and JSON.
- Dry runs never execute detected commands.

## Safe Defaults

TestMatrix does not install dependencies for target repos and does not try to fix missing tools. It reports the local reality.
