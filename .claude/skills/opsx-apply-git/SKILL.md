---
name: opsx-apply-git
description: Implement one task group from an OpenSpec change inside this repo's branch-per-group git workflow and review gates (.claude/docs/git-conventions.md, .claude/docs/review-gates.md), auto-committing when green and auto-archiving after the last group. Use instead of the vendored /opsx:apply whenever the user wants to implement, continue, or work through OpenSpec tasks — the vendored skill never branches, commits, or reviews, so used alone it leaves work sitting uncommitted (or unreviewed) on the parent branch.
---

Implement one task group from an OpenSpec change, but — unlike the vendored `/opsx:apply` (`.claude/commands/opsx/apply.md`, `.claude/skills/openspec-apply-change/SKILL.md`) — do it inside the git workflow this repo's `.claude/docs/git-conventions.md` defines for OpenSpec work, and run the review gates `.claude/docs/review-gates.md` defines before each group's commit. Both files are the source of truth for their respective concerns; if either changes, follow the updated version over this summary.

**One group per invocation.** Find the first task or sub-task without an implementation, work through the rest of that group's sub-tasks, and once the group is committed, merged, and pushed, stop and report — do not automatically start the next group's branch. Each `/opsx:apply` call is a session boundary: one group in, one group out. If the group you just finished was the last one with pending tasks, don't stop at reporting — archive the change in the same session (see step 5).

This skill exists because the vendored `/opsx:apply` only implements tasks and checks boxes — it says nothing about branches, commits, or review, so followed on its own, a whole session's work (potentially several task groups) sits uncommitted and unreviewed on the parent feature branch until someone notices. That already happened once on this project (the branch/commit gap; the review gap is why Gates 3–5 below exist).

## 0. Read the git conventions and review gates first

Before touching any code, read `.claude/docs/git-conventions.md` and `.claude/docs/review-gates.md` in full. Git-conventions' "OpenSpec Task Granularity" section is what step 4 below implements, and it explicitly overrides the general "never commit without being asked" default — but only at the boundaries this skill manages (see step 4). Review-gates' Gates 3, 4, and 5 are what step 4 also runs before that commit — Gate 5 only for the last group. Do this before step 1, not right before your first `git commit`.

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

## 4. Review, commit, merge, and push once the group is green

Once every sub-task in the group is done and the group's own verification passes (installs, runs, tests — whatever the group's tasks specify, e.g. `yarn typecheck`, plus `yarn lint` since pre-commit runs it):

1. Review the diff (`git status -s`, `git diff --stat`) — confirm it's scoped to this group, no unrelated files.
2. Run **Gate 3** (code-review) against the group's uncommitted diff per `.claude/docs/review-gates.md` — invoke the `code-review` skill. On a `CONFIRMED` finding, stop and ask the user whether to fix now or commit anyway; do not silently commit past one. On clean or `PLAUSIBLE`-only, continue.
3. If the group's tasks included test creation or updates, run **Gate 4** (test-coverage-review) against the same diff per `.claude/docs/review-gates.md` — invoke the `test-coverage` skill. Same pause behavior on a `CONFIRMED` finding.
4. Determine whether this is the last group: check `tasks.md` (already up to date locally, even though uncommitted) for any `- [ ]` remaining outside the group you just finished. Remember the answer — it's used again in step 4.9.
5. **If this is the last group**, run **Gate 5** (harness-review) per `.claude/docs/review-gates.md` before committing — invoke the `harness-review` skill, naming the change. Unlike Gates 3–4, it doesn't pause only on `CONFIRMED`; it shows every finding with a suggested fix and asks which to apply. If the user approves any, apply them and commit as their own commit on this group branch (`chore: harness review — <summary>`) now, before step 4.6. If this isn't the last group, or the user declines every suggestion, skip straight to step 4.6.
6. Commit the group's own implementation automatically — **do not wait for the user to ask**, this is the documented override. Use Conventional Commits format (`.claude/docs/git-conventions.md` → Commit Messages), and summarize in the body: what changed, why, how it was validated (including each gate's outcome), remaining risks (per the global AI Commit Discipline standard). If the pre-commit hook (typecheck/lint) fails, fix the root cause and recommit — never `--no-verify`.
7. Checkout the parent branch and merge the group branch: `git merge --no-ff <group-branch>`.
8. Push the parent branch: `git push origin <parent-branch>`. A PreToolUse hook in `.claude/settings.json` gates `git push`: pushes from a feature branch are auto-allowed, while pushing from or force-pushing to `main`/`master` requires confirmation — that gate is about tool permission, not about whether the workflow calls for pushing, so never try to route around a confirmation the hook raises.
9. Using the determination from step 4.4:
   - **Tasks remain elsewhere:** report progress the same way `/opsx:apply` does (completed tasks this session, `N/M tasks complete`, plus each gate's outcome) and **stop here**. Do not cut the next group's branch in this session — that happens on the next `/opsx:apply` invocation, which re-enters at step 3 from the now-updated parent branch.
   - **No tasks remain:** this was the last group. Don't stop at reporting — continue to step 5 to archive the change before ending the session.

## 5. Auto-archive when the last group just landed

Only reached when step 4.9 found zero remaining `- [ ]` tasks across the whole `tasks.md`.

1. Invoke the `openspec-archive-change` skill (`Skill` tool) for this change, on the parent branch. Let it run its normal flow (change selection is already known — pass the name; it still checks artifact/task completion and delta-spec sync per its own steps).
2. The archive step moves `changeRoot` into `openspec/changes/archive/`, which is an uncommitted change on the parent branch afterward. Commit it directly on the parent branch — no group branch needed, this isn't application code:
   - `git add` the archive move (and any spec-sync changes under `openspec/specs/` if the archive flow synced specs).
   - Commit with a `chore` type, e.g. `chore: archive <change-name>`, summarizing what was archived and whether specs were synced.
   - This is a second, narrower override of "never commit without being asked," same justification as the group-commit override in `git-conventions.md`: the user has already asked, generally, for the archive-on-completion step to happen automatically as part of this flow.
3. Push the parent branch: `git push origin <parent-branch>`.
4. Report the full session: every group completed, final `N/N tasks complete`, and the archive location from the `openspec-archive-change` output.

## Exceptions

- An unrelated fix surfaced while verifying a task (e.g. a config bug found mid-task) can land as its own focused commit, separate from the group commit — per `git-conventions.md`.
- Destructive or history-rewriting git operations (force-push, `reset --hard`, deleting branches) are never part of this flow; if something goes wrong, stop and ask rather than trying to clean it up destructively.
- If archiving in step 5 surfaces warnings (incomplete artifacts, unsynced delta specs) that `openspec-archive-change` would normally ask the user about, still ask — auto-archiving the *commit* is what this skill overrides, not the archive skill's own confirmation prompts for genuine ambiguity.
