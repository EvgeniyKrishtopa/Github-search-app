---
name: test-coverage
description: Review the current diff in this repo for test coverage gaps and weak assertions, using the project's test-coverage-reviewer subagent (Fable model). Use before merging a change that alters behavior.
---

Review the current diff using the `test-coverage-reviewer` subagent (`.claude/agents/test-coverage-reviewer.md`, runs on Fable) and report the results with `ReportFindings`.

## 1. Determine what to review

Run `git status --porcelain` and `git diff --stat` (staged + unstaged) to check for uncommitted changes.

- **Uncommitted changes exist** → the diff to review is the working tree: `git diff HEAD` (falls back to `git diff` if there's no HEAD yet).
- **No uncommitted changes** → review the current branch against the repo's main branch: `git diff main...HEAD` (merge-base diff, not `main..HEAD`).

If both are empty, tell the user there's nothing to review and stop — do not call `ReportFindings`.

## 2. Delegate to the test-coverage-reviewer subagent

Spawn the `test-coverage-reviewer` agent (`Agent` tool, `subagent_type: "test-coverage-reviewer"`, run in the foreground — you need its findings before continuing). Do not re-derive the diff yourself first; let the subagent read it directly so context isn't duplicated. Brief it with:

- Which git command produces the diff to review (from step 1)
- That it's reviewing the Github-search-app repo per its own instructions and CLAUDE.md
- Whether the diff belongs to an OpenSpec change (pass the change name if the user gave one, or if `openspec/changes/*/tasks.md` shows in-flight work touching the same files) so it can check tests against that spec's acceptance criteria
- Any scope the user gave you (e.g. "just the reducer changes", a specific file)

Note: `yarn test:coverage` currently fails on this repo (the script still calls the removed `react-scripts`; the Vitest migration is tracked separately in `openspec/changes/migrate-to-vite-modern-stack/tasks.md`, group 2). The subagent checks for this and reports it as a top-priority finding rather than silently reviewing against a broken runner — don't try to work around it yourself.

## 3. Report findings

The subagent returns its findings as text (file, summary, failure_scenario, category, verdict — see its own instructions). Convert that directly into a single `ReportFindings` call, most severe first, empty array if it found nothing. Do not re-review the diff yourself or add findings the subagent didn't surface — it already did the verification pass.
