---
name: opsx-apply-git
description: Implement tasks from an OpenSpec change in this repo, wrapped in the branch-per-group git workflow from .claude/docs/git-conventions.md (cut a branch per task group, auto-commit when green, merge back, push). Use instead of the vendored /opsx:apply whenever the user wants to implement, continue, or work through OpenSpec tasks — the vendored skill never mentions branches or commits, so used alone it leaves work sitting uncommitted on the parent branch.
---

Implement tasks from an OpenSpec change, but — unlike the vendored `/opsx:apply` (`.claude/commands/opsx/apply.md`, `.claude/skills/openspec-apply-change/SKILL.md`) — do it inside the git workflow this repo's `.claude/docs/git-conventions.md` defines for OpenSpec work. That file is the source of truth; if it changes, follow the updated version over this summary.

This skill exists because the vendored `/opsx:apply` only implements tasks and checks boxes — it says nothing about branches or commits, so followed on its own, a whole session's work (potentially several task groups) sits uncommitted on the parent feature branch until someone notices. That already happened once on this project.

## 0. Read the git conventions first

Before touching any code, read `.claude/docs/git-conventions.md` in full. Its "OpenSpec Task Granularity" section is what this skill implements, and it explicitly overrides the general "never commit without being asked" default — but only at the boundaries this skill manages (see step 4). Do this before step 1, not right before your first `git commit`.

## 1. Determine the parent feature branch

Run `git branch --show-current`. This is normally the parent feature branch already (the branch active when this OpenSpec change's implementation began, e.g. `feature/codebase-update` — never `main`/`master`). If the current branch looks like a short-lived group branch left over from an earlier session (uncommitted or unmerged work, a name matching a task-group description rather than the overall change), stop and ask the user which branch is the actual parent before proceeding — don't guess.

## 2. Standard OpenSpec selection and context (same as `/opsx:apply`)

Follow the vendored flow's steps 1–5 unchanged:
1. Select the change (explicit name, inferred from conversation, or ask via `AskUserQuestion` if ambiguous — announce "Using change: <name>").
2. `openspec status --change "<name>" --json` to get the schema and action context.
3. `openspec instructions apply --change "<name>" --json` for `contextFiles`, progress, and the task list.
4. Read every file under `contextFiles`.
5. Show schema, progress (`N/M tasks complete`), and the remaining tasks overview.

## 3. Work one task group at a time

A "group" is a numbered `##` section in `tasks.md` (e.g. `## 4. React 16 → 19 and react-redux 7 → 9`), not an individual sub-task (`4.1`, `4.2`, ...). For the next group with pending tasks:

1. **Cut a branch** off the current parent branch: `git checkout -b <type>/<short-description>`, typed and named per the "Branch Naming" section of `git-conventions.md` (lowercase kebab-case, e.g. `feature/react-19-react-redux-9` for the group above). Skip this if you're resuming mid-group on a branch already cut for it.
2. **Implement the group's sub-tasks**, following the same guardrails as `/opsx:apply`: minimal, focused changes; mark each `- [ ]` → `- [x]` in `tasks.md` immediately on completion; pause and ask if a task is ambiguous, implementation reveals a design issue, or you hit an error/blocker.
3. Treat a mid-group pause as a stopping point, not a failure to recover from — leave the branch checked out with whatever's committed or uncommitted, report status, and wait. Do not commit a half-finished group just to "close it out."

## 4. Commit, merge, and push once the group is green

Once every sub-task in the group is done and the group's own verification passes (installs, runs, tests — whatever the group's tasks specify, e.g. `yarn typecheck && yarn test:run`, plus `yarn lint` since pre-commit runs it):

1. Review the diff (`git status -s`, `git diff --stat`) — confirm it's scoped to this group, no unrelated files.
2. Commit automatically — **do not wait for the user to ask**, this is the documented override. Use Conventional Commits format (`.claude/docs/git-conventions.md` → Commit Messages), and summarize in the body: what changed, why, how it was validated, remaining risks (per the global AI Commit Discipline standard). If the pre-commit hook (typecheck/lint) fails, fix the root cause and recommit — never `--no-verify`.
3. Checkout the parent branch and merge the group branch: `git merge --no-ff <group-branch>`.
4. Push the parent branch: `git push origin <parent-branch>`. This still goes through the normal permission gate for `git push` (it's in the `ask` list) — that gate is about tool permission, not about whether the workflow calls for pushing, so don't route around it.
5. Report progress the same way `/opsx:apply` does (completed tasks this session, `N/M tasks complete`), then either cut the next group's branch from the now-updated parent (back to step 3.1) or stop if all groups are done — suggest `/opsx:archive`.

## Exceptions

- An unrelated fix surfaced while verifying a task (e.g. a config bug found mid-task) can land as its own focused commit, separate from the group commit — per `git-conventions.md`.
- Destructive or history-rewriting git operations (force-push, `reset --hard`, deleting branches) are never part of this flow; if something goes wrong, stop and ask rather than trying to clean it up destructively.
