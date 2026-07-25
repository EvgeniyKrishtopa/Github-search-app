# Dependency Health Loop

## Goal

Periodically check this project's dependencies for new security advisories
and newly-outdated packages, compare against the previous run, and produce a
short draft report — without installing, upgrading, or touching any
dependency file.

## Expected Output

Each run should produce or update:

- `ops/dependency-health/PROGRESS.md`
- `ops/dependency-health/outputs/dependency-health.md` (only when there is
  something new to report — see "quiet mode" in LOOP_INSTRUCTIONS.md)

## Scope

Claude may run `yarn audit --json` and `yarn outdated --json` (the same
commands this repo's `ci.yml` `dependency-health` job already runs), read
`ops/dependency-health/PROGRESS.md`, and write to
`ops/dependency-health/PROGRESS.md` and `ops/dependency-health/outputs/`.

Claude must not run `yarn add`, `npm install`, or any other install/upgrade
command, and must not edit `package.json` or `yarn.lock`. (This is also
already blocked at the permission level by this repo's
`.claude/settings.json` deny list — this loop does not rely on the prompt
alone for that boundary.)
