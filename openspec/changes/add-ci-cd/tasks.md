## 1. Repo prerequisites

- [x] 1.1 Add `coverage.thresholds` (`statements: 90, lines: 90, functions: 90`, branches intentionally unset) to `vite.config.ts`'s `test.coverage` config.
- [x] 1.2 Add an `engines.node` entry to `package.json` pinning the Node major version CI will use.
- [x] 1.3 Run `yarn test:coverage` locally and confirm it still passes against the new thresholds with the existing test suite (no new tests required).

## 2. CI workflow

- [x] 2.1 Create `.github/workflows/ci.yml` triggered on `pull_request` (any base branch, no `branches` filter) and `push` (to `main` only).
- [x] 2.2 Add a `typecheck` job running `yarn typecheck`.
- [x] 2.3 Add a `lint` job running `yarn lint`.
- [x] 2.4 Add a `test-coverage` job running `yarn test:coverage`.
- [x] 2.5 Add a `codeql` job using `github/codeql-action`'s `init` → `analyze` steps (no `autobuild`), with `security-events: write` permission.
- [x] 2.6 Add a `dependency-health` job running `yarn audit` and `yarn outdated` as separate steps, each with `continue-on-error: true`, so findings are visible but never fail the job.
- [x] 2.7 Pin the same Node version from task 1.2 in every job's `actions/setup-node` step.

## 3. CD workflow

- [x] 3.1 Create `.github/workflows/cd.yml` triggered on `workflow_run` for the CI workflow, filtered to `branches: [main]`, `types: [completed]`.
- [x] 3.2 Add a job-level `if: github.event.workflow_run.event == 'push' && github.event.workflow_run.conclusion == 'success'` condition — the `event == 'push'` check is required, not just the conclusion check, so a `pull_request`-triggered CI run (including from a fork whose default branch happens to be named `main`) can never satisfy the gate.
- [x] 3.3 Add a `concurrency` group (e.g. `group: pages-deploy`) to the deploy job so overlapping runs queue instead of racing.
- [x] 3.4 Check out `github.event.workflow_run.head_sha` explicitly (not the default-branch HEAD the `workflow_run` event would otherwise check out) so the deployed commit is exactly the one CI validated, even if `main` has moved again since.
- [x] 3.5 Pin the same Node version from task 1.2 in the deploy job's `actions/setup-node` step, matching CI.
- [x] 3.6 Add a build step (`yarn build`) followed by a publish step calling the `gh-pages` package's CLI directly (`npx gh-pages -d dist -u "github-actions-bot <github-actions-bot@users.noreply.github.com>" -r "https://x-access-token:${GITHUB_TOKEN}@github.com/<owner>/<repo>.git"`, with `GITHUB_TOKEN` from the step's `env: secrets.GITHUB_TOKEN`) — not `yarn deploy`, to avoid its `predeploy`/npm double-build path. The `-r` argument is required, not optional: `gh-pages` pushes from its own separate clone, which never sees the workspace's checkout-provided git credentials, so without an authenticated remote URL the push fails silently after a successful build.
- [x] 3.7 Declare `permissions: contents: write` on the workflow so the default `GITHUB_TOKEN` can push to `gh-pages`.

## 4. Repo settings and verification

- [x] 4.1 Verify the repo's Actions workflow permissions (Settings → Actions → General → Workflow permissions) allow read/write, so `GITHUB_TOKEN` can push to `gh-pages`.
- [x] 4.2 Enable the "Code scanning" branch-protection rule for CodeQL so alerts actually block merges (this is what gates on CodeQL findings, not the job's own pass/fail status — required, not optional, per this change's goals).
- [x] 4.3 Configure branch protection on `main` to require the `typecheck`, `lint`, and `test-coverage` checks before merging.
- [x] 4.4 Open a test pull request targeting `main` to confirm all CI jobs run and report as expected (including that a deliberately broken commit fails the correct checks and blocks merge). Verified via PR #11 against a throwaway sandbox trunk branch (real `main` predates the toolchain this pipeline requires — see design.md note); typecheck/lint failed on an intentional TS error while test-coverage/codeql/dependency-health stayed unaffected, then passed again after revert. The branch-protection ruleset's *configuration* was checked separately via `gh api` (contexts, target ref, code-scanning rule) — its actual blocking *behavior* has not been exercised, since no PR has targeted real `main` since well before this change and the ruleset has zero rule-suite evaluations to date. That first real evaluation happens whenever `main` receives its next PR, folded into the deferred scope of 4.6.
- [x] 4.5 Open a second test pull request targeting a non-`main` branch (e.g. a feature branch) to confirm CI still runs and reports (no `branches` filter accidentally scoping `pull_request` to `main` only), and confirm its completion does not trigger the CD workflow. Verified via PR #12 (`sandbox/test-pr-non-main-path` → `feature/add-CI/CD`): all five CI jobs ran and passed. `gh run list` shows only "CI" runs, never "CD" — confirmed structurally rather than just by absence: GitHub's `workflow_run` trigger only registers for workflow files present on the repo's default branch, and `cd.yml` isn't on `main` yet, so CD categorically cannot fire until it is (see 4.6).
- [ ] 4.6 Merge the `main`-targeted test pull request (or push to `main`) and confirm the CD workflow runs via `workflow_run` only after CI succeeds, and that the site deploys correctly. **Deferred**: GitHub's `workflow_run` trigger only registers for workflow files present on the repository's default branch, so this is structurally unverifiable until `cd.yml` is genuinely merged to `main` — which real `main` isn't ready for yet (it predates the Vite/TypeScript/yarn-script toolchain this whole pipeline assumes; see design.md). Requires a separate, deliberate decision about merging the accumulated modernization work to `main` before this task can be completed.

## 5. Documentation

- [x] 5.1 Once group 4 is fully verified, update `CLAUDE.md` to document the CI/CD pipeline: the CI/CD workflows and what they check, the 90% coverage threshold (statements/lines/functions, branches unenforced) and its baseline, the `engines.node` pin, and that `main`-targeted PRs require these checks (via branch protection) while other-branch PRs run them advisory-only. Written with group 4's 4.1-4.5 verified and 4.6 explicitly noted as a known gap (CD's live deploy trigger pending the separate main-merge decision), per the user's decision to document the pipeline as currently implemented rather than wait.
