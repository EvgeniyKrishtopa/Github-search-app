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

Do each group on its own short-lived branch cut from the parent feature
branch (the branch active when the OpenSpec change's implementation began —
e.g. `feature/codebase-update`, not `main`), and land it via a pull request
into that parent — never by merging locally:

1. Before cutting the group branch, sync the local parent feature branch
   with `origin` so it includes any earlier group PR that has since been
   merged: `git fetch origin`, then fast-forward it (`git pull --ff-only`).
   This assumes the previous group's PR was merged before you started this
   one (see step 5). If the parent has no upstream yet (local-only), skip the
   sync — step 4 pushes it.
2. Branch off the parent feature branch, implement the group, and commit once
   it is green (see above).
3. Push the group branch to `origin` (`git push -u origin <group-branch>`).
4. Make sure the parent branch exists on `origin`. If it only exists locally,
   push it first (`git push -u origin <parent-branch>`) — a PR needs its base
   branch on the remote.
5. Open a pull request from the group branch into the parent branch
   (`gh pr create --base <parent-branch> --head <group-branch>`) and **stop**.
   Leave the PR open — do not merge it; the human owns the merge. One group's
   commit + push + PR is a session boundary, so each group lands as its own
   reviewable PR before more work starts. The next group's branch is cut from
   the parent on the *next* `/opsx:apply` invocation (step 1 re-syncs it from
   `origin`), after the human has merged this group's PR — not automatically
   within the same session. If the group just committed was the last one with
   pending tasks, archive the change in the same session instead of stopping
   (see `opsx-apply-git`).

This keeps each group bisectable and reviewable as its own PR, while the
parent feature branch only ever advances through reviewed, merged PRs.

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
