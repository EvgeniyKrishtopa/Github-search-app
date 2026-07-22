## Why

Correctness (typecheck, lint, test coverage) is currently only enforced by a local husky pre-commit hook, which a contributor can bypass (`--no-verify`) or simply never run if they haven't installed hooks. Deployment to GitHub Pages is a fully manual `yarn deploy` step run from a developer's machine. There is no automated, non-bypassable gate on pull requests, and no visibility into dependency vulnerabilities or outdated packages.

## What Changes

- Add a GitHub Actions CI workflow triggered on `pull_request` (any base branch, not just `main`) and on `push` to `main` (the latter is what lets CD detect a successful run on `main` via `workflow_run` — CD cannot gate on CI if CI never runs against `main` itself):
  - `typecheck` job running `yarn typecheck` — fails on error; blocks merging for PRs targeting `main` (required status check), reports but doesn't guarantee blocking for PRs targeting other branches.
  - `lint` job running `yarn lint` — fails on error; same required-only-for-`main` scope as above.
  - `test-coverage` job running `yarn test:coverage` with an enforced minimum of 90% on statements, lines, and functions (branches unenforced) — same required-only-for-`main` scope as above.
  - CodeQL analysis job (GitHub-native, `github/codeql-action`) as the code-quality/security scan — surfaces alerts in the Security tab on every PR; actually blocking merges on findings requires separately enabling the "Code scanning" branch-protection rule (included as a task, not assumed as a default).
  - `audit` job running `yarn audit` and `yarn outdated` (Yarn Classic syntax, matching this repo's pinned `packageManager`) — always reports findings but never fails the job (report-only).
- Add a GitHub Actions CD workflow triggered via `workflow_run` on the CI workflow completing successfully on `main` (not a bare `push`, so a broken direct push to `main` can never auto-deploy):
  - Builds the app (`yarn build`) once and publishes `dist/` to the `gh-pages` branch by calling the `gh-pages` package's CLI directly, rather than the `yarn deploy` script (which would build a second time via its `predeploy`/npm hook).
- Add a coverage threshold configuration (`coverage.thresholds` in `vite.config.ts`) for statements/lines/functions at 90%, with branches left unconfigured given the current 61.9% baseline (raising branch coverage is out of scope for this change).

## Capabilities

### New Capabilities
- `ci-cd-pipeline`: Automated GitHub Actions workflows that gate pull requests on typecheck/lint/coverage/code-quality checks, report on dependency health, and automatically deploy `main` to GitHub Pages on merge.

### Modified Capabilities
(none — no existing spec's requirements change)

## Impact

- **New files**: `.github/workflows/ci.yml`, `.github/workflows/cd.yml`.
- **Modified files**: `vite.config.ts` (coverage thresholds), `package.json` (adds `engines.node`, pinning the Node version both workflows use), `CLAUDE.md` (documents the CI/CD pipeline once implementation is fully verified — see tasks.md group 5).
- **Dependencies**: none new — CodeQL is a GitHub-native Action (`github/codeql-action`), no external account or secret required. CD calls the already-installed `gh-pages` package's CLI directly (`npx gh-pages -d dist`) rather than the `yarn deploy` script, to avoid that script's `predeploy`-triggered second build.
- **Secrets**: the CD workflow needs push rights to the `gh-pages` branch — the default `GITHUB_TOKEN` covers this as long as the repo's Actions settings grant write permission (verified as part of implementation, not a new secret to create).
- **No effect** on husky's local pre-commit hook — it stays as a fast local pre-check; CI becomes the authoritative, non-bypassable gate.
