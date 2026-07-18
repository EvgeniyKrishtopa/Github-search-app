## 1. Repo prerequisites

- [ ] 1.1 Add `coverage.thresholds` (`statements: 90, lines: 90, functions: 90`, branches intentionally unset) to `vite.config.ts`'s `test.coverage` config.
- [ ] 1.2 Add an `engines.node` entry to `package.json` pinning the Node major version CI will use.
- [ ] 1.3 Run `yarn test:coverage` locally and confirm it still passes against the new thresholds with the existing test suite (no new tests required).

## 2. CI workflow

- [ ] 2.1 Create `.github/workflows/ci.yml` triggered on `pull_request` (any base branch, no `branches` filter) and `push` (to `main` only).
- [ ] 2.2 Add a `typecheck` job running `yarn typecheck`.
- [ ] 2.3 Add a `lint` job running `yarn lint`.
- [ ] 2.4 Add a `test-coverage` job running `yarn test:coverage`.
- [ ] 2.5 Add a `codeql` job using `github/codeql-action`'s `init` → `analyze` steps (no `autobuild`), with `security-events: write` permission.
- [ ] 2.6 Add a `dependency-health` job running `yarn audit` and `yarn outdated` as separate steps, each with `continue-on-error: true`, so findings are visible but never fail the job.
- [ ] 2.7 Pin the same Node version from task 1.2 in every job's `actions/setup-node` step.

## 3. CD workflow

- [ ] 3.1 Create `.github/workflows/cd.yml` triggered on `workflow_run` for the CI workflow, filtered to `branches: [main]`, `types: [completed]`.
- [ ] 3.2 Add a job-level `if: github.event.workflow_run.event == 'push' && github.event.workflow_run.conclusion == 'success'` condition — the `event == 'push'` check is required, not just the conclusion check, so a `pull_request`-triggered CI run (including from a fork whose default branch happens to be named `main`) can never satisfy the gate.
- [ ] 3.3 Add a `concurrency` group (e.g. `group: pages-deploy`) to the deploy job so overlapping runs queue instead of racing.
- [ ] 3.4 Check out `github.event.workflow_run.head_sha` explicitly (not the default-branch HEAD the `workflow_run` event would otherwise check out) so the deployed commit is exactly the one CI validated, even if `main` has moved again since.
- [ ] 3.5 Pin the same Node version from task 1.2 in the deploy job's `actions/setup-node` step, matching CI.
- [ ] 3.6 Add a build step (`yarn build`) followed by a publish step calling the `gh-pages` package's CLI directly (`npx gh-pages -d dist -u "github-actions-bot <github-actions-bot@users.noreply.github.com>"`) — not `yarn deploy`, to avoid its `predeploy`/npm double-build path.
- [ ] 3.7 Declare `permissions: contents: write` on the workflow so the default `GITHUB_TOKEN` can push to `gh-pages`.

## 4. Repo settings and verification

- [ ] 4.1 Verify the repo's Actions workflow permissions (Settings → Actions → General → Workflow permissions) allow read/write, so `GITHUB_TOKEN` can push to `gh-pages`.
- [ ] 4.2 Enable the "Code scanning" branch-protection rule for CodeQL so alerts actually block merges (this is what gates on CodeQL findings, not the job's own pass/fail status — required, not optional, per this change's goals).
- [ ] 4.3 Configure branch protection on `main` to require the `typecheck`, `lint`, and `test-coverage` checks before merging.
- [ ] 4.4 Open a test pull request targeting `main` to confirm all CI jobs run and report as expected (including that a deliberately broken commit fails the correct checks and blocks merge).
- [ ] 4.5 Open a second test pull request targeting a non-`main` branch (e.g. a feature branch) to confirm CI still runs and reports (no `branches` filter accidentally scoping `pull_request` to `main` only), and confirm its completion does not trigger the CD workflow.
- [ ] 4.6 Merge the `main`-targeted test pull request (or push to `main`) and confirm the CD workflow runs via `workflow_run` only after CI succeeds, and that the site deploys correctly.
