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
