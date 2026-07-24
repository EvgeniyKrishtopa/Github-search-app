# Git Conventions

Use small, focused branches and commits.

Never mix unrelated changes.

---

## Branch Naming

Format:

```text
<type>/<short-description>
```

Allowed types:

```text
feature/
fix/
refactor/
test/
docs/
chore/
build/
ci/
perf/
style/
revert/
spike/
```

Examples:

```text
feature/contact-form-validation
feature/APP-123-contact-form-validation
fix/splash-navigation-timeout
refactor/contact-storage-layer
docs/update-claude-guidelines
test/contact-form-validation
```

Use lowercase kebab-case.

---

## Commit Messages

Use Conventional Commits.

Format:

```text
<type>(optional-scope): <summary>
```

Types:

```text
feat
fix
refactor
docs
test
perf
style
build
ci
chore
revert
```

Examples:

```text
feat(contact): add contact validation
fix(storage): handle AsyncStorage errors
refactor(navigation): simplify route types
docs: update CLAUDE guidelines
test(contact): cover invalid email validation
```

---

## Commit Rules

Use imperative mood:

- add
- fix
- update
- remove
- improve
- simplify

Keep subject line under 72 characters when practical.

One commit = one logical change.

Do not combine:

- formatting
- refactoring
- feature work

Avoid vague commit messages:

- update
- fix
- changes
- work

Instead, describe the actual change.

---

## OpenSpec Task Granularity

When implementing an OpenSpec change via `tasks.md`, commit once per numbered
group (e.g. `## 1. Vite + dart-sass`), not once per sub-task (`1.1`, `1.2`,
...).

Commit automatically as soon as a group's sub-tasks are all green (installs,
runs, tests pass) — do not wait for the user to ask. This overrides the
general "never commit without being asked" rule specifically for OpenSpec
group boundaries; it does not authorize committing outside that context.

Whether one branch/PR carries a single group or several depends on the
classification Gate 2 records on each group heading in `tasks.md`
(`<!-- isolated -->` / `<!-- judgement-heavy -->` — see
`.claude/docs/review-gates.md`). A **run** — the unit one `/opsx:apply`
invocation produces — is either:

- an **isolated batch**: consecutive `isolated` groups, implemented and
  committed (still one commit per group) on a single branch, then landed
  together in one PR; or
- a **single judgement-heavy group**: implemented one at a time with the
  human in the loop, on its own branch, then PR'd for review before merge.

An unmarked group counts as judgement-heavy. Either way the run is landed via
a pull request into the parent feature branch (the branch active when the
change's implementation began — e.g. `feature/codebase-update`, not `main`),
never by merging locally:

1. Before cutting the run's branch, sync the local parent feature branch with
   `origin` so it includes any earlier run's PR that has since been merged:
   `git fetch origin`, then fast-forward it (`git pull --ff-only`). This
   assumes the previous run's PR was merged before you started this one (see
   step 5). If the parent has no upstream yet (local-only), skip the sync —
   step 4 pushes it.
2. Branch off the parent, implement the run's group(s), and commit each once
   it is green (one commit per group; see above).
3. Push the run's branch to `origin` (`git push -u origin <branch>`).
4. Make sure the parent branch exists on `origin`. If it only exists locally,
   push it first (`git push -u origin <parent-branch>`) — a PR needs its base
   branch on the remote.
5. Open one pull request from the run's branch into the parent branch
   (`gh pr create --base <parent-branch> --head <branch>`) and **stop**. Leave
   the PR open — do not merge it; the human owns the merge. One run's
   commit(s) + push + PR is a session boundary. The next run's branch is cut
   from the parent on the *next* `/opsx:apply` invocation (step 1 re-syncs it
   from `origin`), after the human has merged this run's PR — not
   automatically within the same session. If the run finished the last pending
   group, archive the change in the same session instead of stopping (see
   `opsx-apply-git`).

This keeps each group bisectable (one commit each) and every run reviewable as
its own PR, while the parent feature branch only ever advances through
reviewed, merged PRs.

A group's sub-tasks are steps toward one reviewable unit of work; splitting
them into per-sub-task commits fragments a single logical change and makes
the history noisier without making it more reviewable.

Exception: if a sub-task surfaces an unrelated fix (e.g. a config bug found
while verifying a task), that fix can still land as its own focused commit
rather than being folded into the group commit.

---

## AI Commit Discipline

Before committing AI-generated code verify:

- the diff is small
- the task is satisfied
- tests passed (when applicable)
- validation was executed
- unrelated files were not modified
- secrets were not introduced

Before creating a commit summarize:

- What changed
- Why it changed
- How it was validated
- Remaining risks
