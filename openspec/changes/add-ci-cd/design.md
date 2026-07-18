## Context

The repo has no `.github/workflows/` today. Correctness is only enforced by a husky `pre-commit` hook (`yarn typecheck && yarn lint && yarn test:coverage`), which is bypassable and never runs for PRs opened without local hooks installed. Deployment is manual (`yarn deploy`, using the `gh-pages` package to push `dist/` to a `gh-pages` branch). `package.json` pins `packageManager: yarn@1.22.22` but declares no `engines.node` and there's no `.nvmrc`, so CI must pick and pin a Node version explicitly rather than reading it from the repo.

Current coverage baseline (measured via `yarn test:coverage`): statements 92.42%, functions 95.23%, lines 92.18%, branches 61.9%. A 90% gate on statements/lines/functions passes today with zero new tests; branches would fail today, so per the proposal it stays unenforced.

## Goals / Non-Goals

**Goals:**
- Make typecheck, lint, and a 90% coverage floor (statements/lines/functions) non-bypassable required checks on every PR into `main` — this includes configuring GitHub branch protection to mark them "required" (a repo-settings action, not a workflow-file change, but in scope for this change: see tasks.md section 4), since a check that merely runs but isn't required doesn't actually block a merge.
- Add a native, zero-signup code-quality/security scan (CodeQL).
- Surface dependency vulnerabilities and outdated packages without ever turning CI red on them.
- Automate the existing manual deploy step so merging to `main` publishes to GitHub Pages without a developer running `yarn deploy` locally.

**Non-Goals:**
- Raising branch coverage to 90% (separate change; would require writing new tests for `store.ts`, `AccordionItem`, `reposSlice.ts`).
- Adopting a third-party quality gate (SonarCloud/CodeClimate) — explicitly deferred in favor of GitHub-native CodeQL.
- Switching the deploy mechanism to `actions/deploy-pages` (native Pages deployment) — deferred; this change reuses the existing `gh-pages` package/branch approach to minimize new moving parts.

## Decisions

**One workflow file per concern (`ci.yml`, `cd.yml`), not one combined file — but CD is gated on CI's own outcome, not just on `main` having moved.**
CI triggers on `pull_request` (any base branch — so the same typecheck/lint/coverage/CodeQL/audit checks run on every PR regardless of what branch it targets, not just ones aimed at `main`) and on `push` to `main` (so the same checks run again on the merge commit itself, not only on the PR's tip commit — this second trigger stays scoped to `main` specifically, since it's what CD's `workflow_run` gate depends on). CD triggers on `workflow_run` for the CI workflow, filtered to `branches: [main]` and `types: [completed]`, with a job-level condition of `github.event.workflow_run.event == 'push' && github.event.workflow_run.conclusion == 'success'`.

The explicit `event == 'push'` check is required, not optional, once `pull_request` is triggered from any base branch: `workflow_run`'s `branches` filter matches the triggering run's **head branch**, not its target. A fork whose default branch is named `main` (the common case) opening a PR into any branch would otherwise produce a completed CI run with `head_branch: main` — indistinguishable, by branch name alone, from a real push to this repo's `main`. Without the event-type guard, CD would check out and deploy that fork's unmerged commit. Requiring the triggering run to have been a `push` event closes this: forked and same-repo `pull_request` runs can never satisfy the condition, no matter what branch they're named after.

This means CD never runs off a bare `push` event either — a direct push to `main` that fails typecheck/lint/coverage runs CI (via its `push` trigger), CI fails, and CD's `workflow_run` never sees a `success` conclusion, so nothing deploys. Branch protection (making CI checks required on the PR path into `main`) is still worth configuring, but is no longer the *only* thing preventing a bad deploy — this decision removes that dependency instead of leaving it to an optional manual step. Alternative considered: keep CD on a plain `push` trigger and rely solely on branch-protection-required-checks — rejected because that leaves a real window (before protection is configured, or if it's ever turned off) where a broken `main` auto-deploys.

**CI jobs run in parallel, each a separate job, not sequential steps in one job.** Alternative considered: a single job running all checks sequentially (simpler YAML, but one failure hides later results, and total wall-clock time is additive instead of parallel). Separate jobs give independent pass/fail status per check (visible individually in the PR checks list) and run concurrently, so total CI time is bounded by the slowest job, not the sum.

**Coverage threshold via `vite.config.ts` `test.coverage.thresholds`, not a separate CI-only script.** Vitest's built-in threshold enforcement fails the `vitest run --coverage` process itself (non-zero exit) when a metric drops below the configured number, so `yarn test:coverage` becomes the single source of truth for both local runs and CI — no separate coverage-parsing step to maintain. Alternative considered: parse the coverage JSON/text output in a CI step and fail manually — rejected as duplicate logic that can drift from what a developer sees locally.

```ts
// vite.config.ts — test.coverage addition
coverage: {
  thresholds: {
    statements: 90,
    lines: 90,
    functions: 90,
    // branches intentionally unset — current baseline (61.9%) is out of scope
  },
},
```

**CodeQL via `github/codeql-action`'s standard `init` → `analyze` steps, default query suite, no `autobuild`.** No account, no secret — `security-events: write` permission on the `GITHUB_TOKEN` is all it needs. `autobuild` is for compiled languages; for JS/TS (interpreted, nothing to build) it's a no-op step that only adds noise, so it's dropped. Alternative considered (SonarCloud/CodeClimate) rejected per the proposal's decision to avoid new external accounts/secrets for this change.

Note on what "blocks" means here: CodeQL's job itself only fails on an *analysis error*, not on finding an alert — alerts post to the repo's Security tab regardless of the job's pass/fail status. Making CodeQL alerts actually block a PR requires enabling the separate "Code scanning" branch-protection rule (distinct from marking the workflow job itself required). This design surfaces CodeQL findings on every PR (visible in the Security tab and as PR annotations) but does **not** claim it blocks merges out of the box — tasks.md includes enabling that branch-protection rule as an explicit step, not an assumed default.

**`audit`/`outdated` job never fails, using `continue-on-error: true` on those specific steps (not the whole job).** Commands use Yarn Classic syntax to match this repo's pinned `packageManager: yarn@1.22.22`: `yarn audit` (not `yarn npm audit`, which is Berry-only syntax and would error under Classic) and `yarn outdated`. Both exit non-zero when they find something; wrapping only those two steps in `continue-on-error` (rather than setting it at the job level) means a genuine step crash (e.g. network failure reaching the registry) is still distinguishable from "audit found something" in the logs, while neither blocks the PR. Output is still visible in the job's log/summary for a human to review.

**CD checks out `github.event.workflow_run.head_sha` explicitly, not the default checkout a `workflow_run` trigger would otherwise use.** A `workflow_run`-triggered workflow's default checkout resolves to the default branch's *current* HEAD, not the commit that the triggering CI run actually validated. If another commit lands on `main` between CI finishing and CD starting, a default checkout would deploy that newer, not-yet-validated commit — silently reopening the exact gap the CI-gating decision above exists to close. Pinning `head_sha` guarantees the deployed commit is the one CI just passed.

**CD publishes via the `gh-pages` npm package's CLI directly (`npx gh-pages -d dist`), not via the `yarn deploy` script, and does not use `actions/deploy-pages`.** `yarn deploy` chains `predeploy` (`npm run build`) → `deploy` (`gh-pages -d dist`), so invoking it in CD would both build twice and have the actually-published bundle come from an `npm run build` invocation instead of the `yarn build` the workflow appears to validate. Instead, CD runs `yarn build` once, then calls `gh-pages`'s CLI directly to publish that same `dist/`, skipping the npm-based `predeploy`/`deploy` script pair entirely for the automated path (local developers can still run `yarn deploy` manually — this doesn't change what exists today). The CLI invocation includes `-u "github-actions-bot <github-actions-bot@users.noreply.github.com>"` so `gh-pages`' internal git commit has an identity to commit as — a fresh Actions runner has no `git config user.name`/`user.email` set, which would otherwise fail the commit outright.

**The `gh-pages` CLI call must also carry the `GITHUB_TOKEN` in its own `-r` (remote URL) argument — `permissions: contents: write` on the workflow is necessary but not sufficient.** `gh-pages` v3 doesn't push through the workspace's git config (where `actions/checkout` writes its token as an `http.extraheader` credential); it clones the repo into its own separate cache directory and commits/pushes from that clone, which never sees the workspace's credential. Without an authenticated remote URL passed explicitly, that push fails with a git auth error on every single deploy, silently — the build and every prior step still report success, only the final publish step fails. The fix (and this project's documented GitHub Actions pattern) is passing `-r "https://x-access-token:${GITHUB_TOKEN}@github.com/<owner>/<repo>.git"`, with `GITHUB_TOKEN` supplied via the step's `env:` from `secrets.GITHUB_TOKEN` (never inlined as a literal in the command string — GitHub masks secret values in logs when they come from `env`/`secrets`, and this also avoids the token appearing in shell history or process listings any more than necessary).

The CD job also declares a `concurrency` group (e.g. `group: pages-deploy`, no `cancel-in-progress`) so two merges landing close together queue sequentially rather than racing two simultaneous pushes to the `gh-pages` branch — without this, the run built from the older commit could finish last and overwrite a newer deploy.

Requires `permissions: contents: write` on the CD workflow so the default `GITHUB_TOKEN` can push to the `gh-pages` branch; `gh-pages` package handles the actual git operations (it's already a devDependency, no new install).

**Node version pinned explicitly in both workflows (not read from an `.nvmrc`), matching the Node major used in local development.** Since the repo declares no `engines.node`/`.nvmrc`, the workflow's `actions/setup-node` step hardcodes a version — tasks.md calls out confirming/adding an `engines.node` entry so this doesn't silently drift from what's actually supported.

## Risks / Trade-offs

- **CodeQL adds real wall-clock time to every PR** (JS/TS analysis typically 1-3 min) → Mitigation: it runs as its own parallel job, not blocking the faster typecheck/lint/coverage jobs from reporting first.
- **`GITHUB_TOKEN`'s default permissions may not include `contents: write` for the `gh-pages` push**, depending on the repo's Actions settings (Settings → Actions → General → Workflow permissions) → Mitigation: CD workflow explicitly declares `permissions: contents: write`; tasks.md includes a step to verify this setting rather than assuming it.
- **A hardcoded Node version in CI can silently diverge from what contributors run locally** → Mitigation: tasks.md adds `engines.node` to `package.json` as the single declared version, and both workflows reference the same value.
- **90% is a snapshot, not a durable target** — future code could lower statements/functions/lines coverage right up against 90% without failing, and a large new untested file could tip it over → accepted trade-off; revisiting the number is a future change, not blocking this one.
- **`workflow_run` adds one propagation hop between merge and deploy** — CD only starts once GitHub reports CI's conclusion for the push event, typically seconds after CI finishes, but it means "merge" and "deploy triggered" aren't the same instant → accepted trade-off; the alternative (no gate on CD at all) was the CONFIRMED risk this design change is fixing.
- **CodeQL alerts are visible, not blocking, unless the "Code scanning" branch-protection rule is separately enabled** → Mitigation: called out explicitly rather than implied; tasks.md includes enabling that rule as its own step so it isn't silently assumed.
- **CodeQL diffs a PR's alerts against a baseline analysis of its base branch, but `push`-triggered CI (which produces that baseline) only runs on `main`** — a PR between two non-`main` branches has no baseline for its actual base, so its alert annotations may show pre-existing alerts as "new" → accepted trade-off; cosmetic noise on the rarer non-`main`-targeted PRs, not worth scoping `push` CI beyond `main` to fix.

## Open Questions

- Should the 90% coverage check be marked "required" in GitHub branch protection immediately, or left as visible-but-optional until the team has watched it run clean on a few PRs? CodeQL's blocking behavior is no longer bundled into this question — enabling "Code scanning" branch protection for CodeQL is now a required task (see tasks.md), not an open toggle. (Coverage-required-check timing captured as a task either way, since branch protection is a repo-settings change, not a workflow-file change.)
