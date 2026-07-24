---
name: opsx-apply-git
description: Implement the next run from an OpenSpec change — an autonomous batch of consecutive `isolated` task groups, or a single `judgement-heavy` group (classified by Gate 2 in tasks.md) — inside this repo's branch-per-group git workflow and review gates (.claude/docs/git-conventions.md, .claude/docs/review-gates.md), auto-committing each group when green, opening one pull request into the parent branch per run (never merging locally), and auto-archiving via its own PR after the last group. Use instead of the vendored /opsx:apply whenever the user wants to implement, continue, or work through OpenSpec tasks — the vendored skill never branches, commits, or reviews, so used alone it leaves work sitting uncommitted (or unreviewed) on the parent branch.
---

Implement the next run from an OpenSpec change, but — unlike the vendored `/opsx:apply` (`.claude/commands/opsx/apply.md`, `.claude/skills/openspec-apply-change/SKILL.md`) — do it inside the git workflow this repo's `.claude/docs/git-conventions.md` defines for OpenSpec work, and run the review gates `.claude/docs/review-gates.md` defines before each group's commit. Both files are the source of truth for their respective concerns; if either changes, follow the updated version over this summary.

**One run per invocation.** A "run" is either an autonomous batch of consecutive `isolated` task groups or a single `judgement-heavy` group — Gate 2 marks each group in `tasks.md`, and §3 decides which case applies. Work the run to completion, and once it is committed (per group), pushed, and its one PR into the parent branch is opened, stop and report — do not automatically start the next run. Each `/opsx:apply` call is a session boundary: one run in, one PR out. If the run finished the last pending group, don't stop at reporting — archive the change in the same session (see step 5).

This skill exists because the vendored `/opsx:apply` only implements tasks and checks boxes — it says nothing about branches, commits, or review, so followed on its own, a whole session's work (potentially several task groups) sits uncommitted and unreviewed on the parent feature branch until someone notices. That already happened once on this project (the branch/commit gap; the review gap is why Gates 3–6 below exist).

## 0. Read the git conventions and review gates first

Before touching any code, read `.claude/docs/git-conventions.md` and `.claude/docs/review-gates.md` in full. Git-conventions' "OpenSpec Task Granularity" section is what step 4 below implements, and it explicitly overrides the general "never commit without being asked" default — but only at the boundaries this skill manages (see step 4). Review-gates' Gates 3–6 are what step 4 also runs before that commit: Gate 4 (code-review) on every group, Gate 5 (test-coverage) when the group changed tests, and Gate 3 (web-qa) plus Gate 6 (harness-review) only for the last group. On the last group they run in gate order — **Gate 3 (web-qa) first, before code-review** — so a QA failure is caught and fixed before the diff is code-reviewed. Do this before step 1, not right before your first `git commit`.

## 1. Determine the parent feature branch

Run `git branch --show-current`. This is normally the parent feature branch already (the branch active when this OpenSpec change's implementation began, e.g. `feature/codebase-update` — never `main`/`master`). If the current branch looks like a short-lived group branch left over from an earlier session (uncommitted or unmerged work, a name matching a task-group description rather than the overall change), stop and ask the user which branch is the actual parent before proceeding — don't guess.

## 2. Standard OpenSpec selection and context (same as `/opsx:apply`)

Follow the vendored flow's steps 1–5 unchanged:
1. Select the change (explicit name, inferred from conversation, or ask via `AskUserQuestion` if ambiguous — announce "Using change: <name>").
2. `openspec status --change "<name>" --json` to get the schema and action context.
3. `openspec instructions apply --change "<name>" --json` for `contextFiles`, progress, and the task list.
4. Read every file under `contextFiles`.
5. Show schema, progress (`N/M tasks complete`), and the remaining tasks overview.

## 3. Work the next run: an isolated batch, or one judgement-heavy group

A "group" is a numbered `##` section in `tasks.md` (e.g. `## 4. React 16 → 19 and react-redux 7 → 9`), not an individual sub-task (`4.1`, `4.2`, ...). How far one invocation goes depends on the classification Gate 2 wrote into `tasks.md`.

**Read the marks first.** Gate 2 (spec-review, per `.claude/docs/review-gates.md`) tags each `## N.` group heading with a trailing `<!-- isolated -->` or `<!-- judgement-heavy -->` comment. **An unmarked group counts as judgement-heavy** — never auto-run work nobody classified. If *no* group in `tasks.md` carries a mark at all, the change predates classification (or Gate 2 never ran): treat every group as judgement-heavy, i.e. the one-group-per-invocation flow.

Find the first group with pending `- [ ]` tasks; its mark decides which case you're in.

### Case A — first pending group is `isolated`: run an autonomous batch

Consecutive `isolated` groups are mechanical and well-specified, so they run without a human gate between them and land together in **one** PR. Because they're mechanical, each group's implementation step is delegated to a subagent on a cheaper model rather than done inline on your own model — see step 2's first bullet.

1. **Sync the parent, then cut one batch branch** off it: `git fetch origin` + `git pull --ff-only` (skip if the parent has no upstream yet — local-only), then `git checkout -b <type>/<short-description>` named for the batch per the "Branch Naming" section of `git-conventions.md` (e.g. `feature/<change>-isolated`). Skip this if you're resuming on a batch branch already cut for it.
2. For each `isolated` group in turn, starting at the first pending one:
   - **Delegate the group's implementation** to an `Agent` call: `subagent_type: "general-purpose"`, `model: "fable"` — the `Agent` tool's short alias for `claude-fable-5`, the cheaper tier this repo already pins on most review-gate subagents (all but Gate 3's `web-qa-manual-tester`, which needs `claude-opus-4-8` to drive a browser reliably), so this matches the existing cost pattern, `run_in_background: false` (the next bullet needs its result before gates can run), and no `isolation` — it must edit this same working tree, on the batch branch already checked out here, not a separate worktree. Brief it with the OpenSpec change name, this group's heading and sub-tasks verbatim from `tasks.md`, pointers to whatever `contextFiles` paths are relevant to this group (it has to `Read` them itself — it starts with none of this conversation's context), and these guardrails: minimal/focused changes only (same as `/opsx:apply`); mark each `- [ ]` → `- [x]` on completion; run the group's own verification plus `yarn lint`; **do not commit** (that happens in step 4.7, on your own model); and **do not resolve a design decision or ambiguity it hits** — a truly isolated group shouldn't surface one, so if it does, it must stop implementing and report that back rather than guessing.
   - If the subagent's report says it hit a design decision, an ambiguity, or otherwise couldn't stay mechanical, the classification was wrong: stop, leave the group uncommitted, and tell the user it looks judgement-heavy after all.
   - Once the group is green (the subagent's report confirms its own verification + `yarn lint` passed), run the per-group gates against **that group's** diff, then **commit the group on the batch branch** — this is §4's steps 4.1–4.7 applied per group (Gate 4 code-review; Gate 5 if it touched tests; and only if this is the last group in the whole change, Gate 3 web-qa first and Gate 6 harness-review last; then the commit). One commit per group keeps the batch bisectable. Gates and the commit run on your own model as usual — only the mechanical implementation step above is delegated.
   - Look at the next pending group: `isolated` → continue the loop; `judgement-heavy`, or none left → **end the batch** and go to §4.8. Stopping *before* the judgement-heavy group is deliberate — it gets human review next session, implemented inline on your own model per Case B, never delegated.
3. Treat any mid-batch pause (a `CONFIRMED` gate finding, an error, an ambiguity, or a subagent reporting it couldn't stay mechanical) as a stopping point: leave the branch as-is with whatever's committed, report status, and wait. Do not commit a half-finished group to "close it out."

### Case B — first pending group is `judgement-heavy`: one group, human in the loop

This group needs a human's judgement before it lands, so it is **not** auto-run: do exactly one group, with the user engaged.

1. Sync the parent and cut a single group branch off it (as in Case A step 1, but named for this one group, e.g. `feature/react-19-react-redux-9`).
2. Announce that the group is judgement-heavy and why (from its classification rationale). Implement its sub-tasks with the standard guardrails, but **pause and ask on every design decision or ambiguity** rather than deciding for the user — that engagement is the whole point of the mark.
3. Once green, run §4's steps 4.1–4.7 for this one group (Gate 3 web-qa first since a single judgement-heavy group is by definition the last group; then Gate 4 code-review; Gate 5 if tests changed; Gate 6 harness-review; then commit), then go to §4.8. The PR is where the human's pre-merge review happens.

## 4. Review + commit each group (4.1–4.7), then push + PR once per run (4.8–4.11)

Steps **4.1–4.7 run per group** — §3 sends every group here (once for a single judgement-heavy group, repeatedly across an isolated batch) as soon as its sub-tasks are done and its own verification passes (installs, runs, tests per the group's tasks, plus `yarn lint` since pre-commit runs it). Steps **4.8–4.11 run once per run**, after §3's batch or single group has ended.

1. Review the group's diff (`git status -s`, `git diff --stat`) — confirm it's scoped to this group, no unrelated files.
2. Determine whether this is the last group in the whole change: check `tasks.md` (already up to date locally, even though uncommitted) for any `- [ ]` remaining outside the group you just finished. Remember the answer — it decides Gates 3 and 6 below, and is used again in step 4.11.
3. **If this is the last group and the change touched user-facing UI/flows**, run **Gate 3** (web-qa) per `.claude/docs/review-gates.md` before code-review — invoke the `web-qa` skill against the whole change's cumulative user-facing flows (inferred from the change's diff vs the parent, not just this group's). This is a **must-pass gate with a fix loop**, not a `CONFIRMED`/`PLAUSIBLE` pause: on any FAIL, first rule out an environment condition (e.g. a GitHub API rate-limit `403` is not an app bug — re-run), then for a genuine failure suggest a concrete fix, ask the user to approve it, apply it (it folds into this group's diff, so it gets code-reviewed at step 4.4), and re-run web-qa on the affected flow(s) — repeat until all-PASS. Only an explicit human "proceed anyway" continues past a FAIL (note it in the commit body). If this isn't the last group, or the change touched no user-facing surface, skip to step 4.4.
4. Run **Gate 4** (code-review) against the group's uncommitted diff (including any web-qa fixes from step 4.3) per `.claude/docs/review-gates.md` — invoke the `code-review` skill. On a `CONFIRMED` finding, stop and ask the user whether to fix now or commit anyway; do not silently commit past one. On clean or `PLAUSIBLE`-only, continue.
5. If the group's tasks included test creation or updates, run **Gate 5** (test-coverage-review) against the same diff per `.claude/docs/review-gates.md` — invoke the `test-coverage` skill. Same pause behavior on a `CONFIRMED` finding.
6. **If this is the last group** (from step 4.2), run **Gate 6** (harness-review) per `.claude/docs/review-gates.md` before committing — invoke the `harness-review` skill, naming the change. Unlike Gates 4–5, it doesn't pause only on `CONFIRMED`; it shows every finding with a suggested fix and asks which to apply. If the user approves any, apply them and commit as their own commit on this branch (`chore: harness review — <summary>`) now, before step 4.7. If this isn't the last group, or the user declines every suggestion, skip straight to step 4.7.
7. Commit this group's own implementation automatically — **do not wait for the user to ask**, this is the documented override. Use Conventional Commits format (`.claude/docs/git-conventions.md` → Commit Messages), and summarize in the body: what changed, why, how it was validated (including each gate's outcome), remaining risks (per the global AI Commit Discipline standard). If the pre-commit hook (typecheck/lint) fails, fix the root cause and recommit — never `--no-verify`. **In an isolated batch, return to §3 Case A step 2 for the next group** — 4.8–4.11 only run once the batch ends.
8. Push the run's branch to `origin`: `git push -u origin <branch>` (the batch branch, or the single group branch). A PreToolUse hook in `.claude/settings.json` gates `git push`: pushes from a feature branch are auto-allowed, while pushing from or force-pushing to `main`/`master` requires confirmation — that gate is about tool permission, not about whether the workflow calls for pushing, so never try to route around a confirmation the hook raises.
9. Ensure the parent branch exists on `origin`. Check with `git ls-remote --exit-code --heads origin <parent-branch>`; if it's local-only, push it first (`git push -u origin <parent-branch>`) so the PR has a base to target.
10. Open **one** PR from the run's branch into the parent: `gh pr create --base <parent-branch> --head <branch> --title "<conventional-commit-style summary>" --body "<summary>"`. The body covers **every group in this run** — what changed, why, how validated (incl. each gate's outcome), remaining risks. **For a judgement-heavy run (§3 Case B), flag it prominently** — lead the body with e.g. `⚠️ Judgement-heavy: needs careful human review before merge`, naming the decisions made. **Leave the PR open; do not merge it** — the human owns the merge. Report the PR URL `gh` prints.
11. Using the determination from step 4.2:
   - **Tasks remain elsewhere:** report progress the same way `/opsx:apply` does (groups completed this run, `N/M tasks complete`, each gate's outcome, plus the PR URL) and **stop here**. Do not start the next run in this session — that happens on the next `/opsx:apply` invocation, which re-enters at §3 and re-syncs the parent from `origin`. That sync only picks up this run's work once the human has merged its PR; if the PR is still open when the next invocation runs, say so rather than building the next run on a parent that's missing this one.
   - **No tasks remain:** this run finished the change. Don't stop at reporting — continue to step 5 to archive the change before ending the session.

## 5. Auto-archive when the last group just landed

Only reached when step 4.11 found zero remaining `- [ ]` tasks across the whole `tasks.md` (the last group landed in this run — whether as a single judgement-heavy group or the tail of an isolated batch). This run's PR is already open (step 4.10); the archive lands as its **own separate PR** into the parent, just like a run — nothing commits directly to the parent branch.

1. You're still on this run's branch (its PR is open from step 4.10). Cut the archive branch straight off it — `git checkout -b chore/archive-<change-name>` — **not** off the parent: the parent doesn't yet contain this run (its PR isn't merged), so a parent-cut branch would show `tasks.md` as incomplete and the archive's completion check would balk. The archive PR is effectively stacked on the run's PR; once you merge the run's PR into the parent, the archive PR's diff reduces to just the archive move.
2. Invoke the `openspec-archive-change` skill (`Skill` tool) for this change, on that archive branch. Let it run its normal flow (change selection is already known — pass the name; it still checks artifact/task completion and delta-spec sync per its own steps).
3. The archive step moves `changeRoot` into `openspec/changes/archive/`, an uncommitted change on the archive branch afterward. Commit it there — this isn't application code:
   - `git add` the archive move (and any spec-sync changes under `openspec/specs/` if the archive flow synced specs).
   - Commit with a `chore` type, e.g. `chore: archive <change-name>`, summarizing what was archived and whether specs were synced.
   - This is a second, narrower override of "never commit without being asked," same justification as the group-commit override in `git-conventions.md`: the user has already asked, generally, for the archive-on-completion step to happen automatically as part of this flow.
4. Push the archive branch (`git push -u origin chore/archive-<change-name>`) and open a PR into the parent (`gh pr create --base <parent-branch> --head chore/archive-<change-name> --title "chore: archive <change-name>" --body "<what was archived, whether specs were synced>"`). Leave it open like the group PRs — do not merge it.
5. Report the full session: every group completed (with each PR URL), final `N/N tasks complete`, the archive location from the `openspec-archive-change` output, and the archive PR URL.

## Exceptions

- An unrelated fix surfaced while verifying a task (e.g. a config bug found mid-task) can land as its own focused commit, separate from the group commit — per `git-conventions.md`.
- Destructive or history-rewriting git operations (force-push, `reset --hard`, deleting branches) are never part of this flow; if something goes wrong, stop and ask rather than trying to clean it up destructively.
- If archiving in step 5 surfaces warnings (incomplete artifacts, unsynced delta specs) that `openspec-archive-change` would normally ask the user about, still ask — auto-archiving the *commit* is what this skill overrides, not the archive skill's own confirmation prompts for genuine ambiguity.
