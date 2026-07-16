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
e.g. `feature/codebase-update`, not `main`):

1. Branch off the parent feature branch before starting the group's tasks.
2. Implement the group, commit once it is green (see above).
3. Merge the group branch back into the parent feature branch.
4. Push the parent feature branch to `origin`.
5. Cut the next group's branch from the now-updated parent feature branch.

This keeps each group bisectable and reviewable on its own branch while the
parent feature branch always reflects the latest completed group.

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
