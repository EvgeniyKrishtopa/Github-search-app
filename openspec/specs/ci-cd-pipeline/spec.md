# ci-cd-pipeline Specification

## Purpose
TBD - created by archiving change add-ci-cd. Update Purpose after archive.
## Requirements
### Requirement: Pull request correctness gate
The system SHALL run typecheck, lint, and a test-coverage check on every pull request, regardless of the pull request's target branch, and SHALL fail the corresponding check when any of them fails. The coverage check SHALL enforce a minimum of 90% on statements, lines, and functions; branch coverage SHALL NOT be enforced. For pull requests targeting `main` specifically, these checks SHALL be configured as required status checks, so a failure blocks the merge; for pull requests targeting any other branch, the checks SHALL still run and report failure, but are not guaranteed to be required (no merge-blocking guarantee outside of `main`).

#### Scenario: Typecheck failure blocks a PR into main
- **WHEN** a pull request targeting `main` contains a TypeScript type error
- **THEN** the typecheck check reports failure and the pull request shows a failing required check

#### Scenario: Lint failure blocks a PR into main
- **WHEN** a pull request targeting `main` contains an ESLint violation
- **THEN** the lint check reports failure and the pull request shows a failing required check

#### Scenario: Coverage below threshold blocks a PR into main
- **WHEN** a pull request targeting `main` produces statement, line, or function coverage below 90%
- **THEN** the coverage check reports failure and the pull request shows a failing required check

#### Scenario: Low branch coverage does not block a PR into main
- **WHEN** a pull request targeting `main` produces branch coverage below 90% while statements, lines, and functions all meet 90%
- **THEN** the coverage check reports success

#### Scenario: Checks still run and report on a PR into a non-main branch
- **WHEN** a pull request targeting a branch other than `main` contains a TypeScript type error, an ESLint violation, or coverage below 90% on statements/lines/functions
- **THEN** the corresponding check reports failure, visible on the pull request, without any guarantee that the failure blocks merging

### Requirement: Code quality and security scanning
The system SHALL run a CodeQL analysis on every pull request, regardless of target branch, and on every push to `main`. The analysis job SHALL report failure only on an analysis error, not on the presence of alerts; alerts SHALL be surfaced separately (e.g. the repository's Security tab) regardless of the job's pass/fail status.

#### Scenario: CodeQL finds an alert
- **WHEN** CodeQL analysis completes successfully and identifies a code-quality or security alert
- **THEN** the analysis job reports success and the alert is visible in the repository's code scanning results

#### Scenario: CodeQL analysis errors out
- **WHEN** the CodeQL analysis step itself fails to complete (e.g. a build/analysis error)
- **THEN** the analysis job reports failure

### Requirement: Dependency health reporting
The system SHALL run a dependency audit (`yarn audit`) and an outdated-dependency check (`yarn outdated`) on every pull request, regardless of target branch. Findings from either command SHALL never cause the job to report failure.

#### Scenario: Audit finds a vulnerability
- **WHEN** `yarn audit` identifies one or more vulnerabilities, including high or critical severity
- **THEN** the dependency health job reports success and the vulnerabilities are visible in the job's output

#### Scenario: Outdated packages exist
- **WHEN** `yarn outdated` identifies one or more outdated packages
- **THEN** the dependency health job reports success and the outdated packages are visible in the job's output

### Requirement: Deployment gated on CI success
The system SHALL trigger deployment to GitHub Pages only after the CI workflow completes successfully for a commit on `main`. Deployment SHALL NOT be triggered directly by a `push` event independent of CI's outcome.

#### Scenario: Direct push to main fails CI
- **WHEN** a commit is pushed directly to `main` and the CI workflow run for that commit does not conclude successfully
- **THEN** no deployment is triggered

#### Scenario: Merge to main passes CI
- **WHEN** a pull request is merged into `main` and the CI workflow run for the resulting commit concludes successfully
- **THEN** a deployment is triggered for that commit

#### Scenario: A pull-request-triggered CI run never deploys, regardless of its head branch or outcome
- **WHEN** a CI workflow run triggered by a `pull_request` event concludes successfully, including one whose head branch happens to be named `main` (e.g. a fork's default branch)
- **THEN** no deployment is triggered — only a CI run triggered by a `push` event to `main` can trigger deployment

### Requirement: Deployment concurrency safety
The system SHALL serialize deployment runs so that no two deployments publish to the GitHub Pages source branch concurrently.

#### Scenario: Two merges land close together
- **WHEN** a second deployment-triggering commit on `main` occurs while a prior deployment run is still in progress
- **THEN** the second deployment run waits for the first to complete before publishing, rather than running concurrently

### Requirement: Single build artifact published
The system SHALL build the application exactly once per deployment run and SHALL publish that build's output. Deployment SHALL NOT rely on a build path that produces a second, potentially divergent build of the same commit.

#### Scenario: Deployment run builds and publishes
- **WHEN** a deployment run executes
- **THEN** the application is built exactly once and the resulting build output is what gets published to GitHub Pages

