# TestMatrix Tasks

## MVP

- [x] Initialize local git history.
- [x] Add TypeScript CLI package metadata.
- [x] Detect `package.json`, `pyproject.toml`, `Makefile`, `justfile`, and `scripts/validate.sh`.
- [x] Classify commands as `test`, `check`, `build`, `smoke`, `validate`, or `unknown`.
- [x] Block unsafe command names and network-looking command bodies by default.
- [x] Run safe commands with per-command timeouts.
- [x] Print a terminal matrix.
- [x] Write JSON matrix output.
- [x] Add fixtures for safe, unsafe, and mixed-tool repos.
- [x] Add focused tests.
- [x] Add a real CLI smoke command using fixtures.

## Next

- [ ] Add optional concurrency with stable output ordering.
- [ ] Add config-file overrides for local teams.
- [ ] Support richer `pyproject.toml` discovery without adding a heavy parser.
- [ ] Emit GitHub Actions step summaries.
