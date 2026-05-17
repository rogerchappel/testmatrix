# Safety

TestMatrix is conservative by default. It should help verify a change, not publish it, deploy it, migrate a database, or reach across the network.

## Blocked By Default

Command names containing these signals are skipped:

- `deploy`
- `publish`
- `release`
- `migrate` or `migration`
- `db` or `database`
- `prod` or `production`

Command bodies containing these signals are skipped:

- package publishes
- GitHub releases
- `git push`
- `curl` or `wget`
- `ssh`, `scp`, or `rsync`
- selected production-style apply/push commands

## Override

Use `--include-unsafe` only after reading the command body:

```bash
node ./bin/testmatrix.js --dry-run
node ./bin/testmatrix.js --include-unsafe --only validate
```

The matrix marks overridden commands as `explicit`.
