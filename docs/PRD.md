# TestMatrix PRD

Status: in-progress

## Summary

TestMatrix detects a repo's local verification commands, runs the safe ones, and writes a concise result matrix for humans and agents. It answers: "what should I run here, and what actually passed?"

## Problem

Many repos have npm, pnpm, uv, make, shell scripts, and custom validate paths. Agents waste time guessing, while maintainers get inconsistent verification summaries.

## Users

- OSS maintainers who want a simple local verification wrapper.
- Agents that need deterministic test/check/build/smoke discovery.
- Contributors preparing a final change summary.

## V1

- Detect package managers and scripts from package.json, pyproject.toml, Makefile, justfile, and scripts/validate.sh.
- Classify commands as test, check, build, smoke, validate, or unknown.
- Run selected safe commands with timeouts and capture exit codes.
- Produce terminal summary and JSON result matrix.
- Include dry-run mode, fixtures, tests, and a real CLI smoke.

## Non-goals

- CI orchestration.
- Installing missing dependencies automatically.
- Running destructive deploy/publish commands.

## Safety

Default command set excludes publish, deploy, release, migration, and network-looking scripts unless explicitly requested.

## Attribution

Inspired by repeated hand-written "tests run" summaries in agentic coding work, reframed as a deterministic local verification helper.
