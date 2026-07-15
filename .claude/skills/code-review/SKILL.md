---
name: code-review
description: Review the current diff in this repo for correctness bugs and reuse/simplification/efficiency cleanups, using the project's code-reviewer subagent (Fable model). Overrides the generic built-in /code-review for this project. Pass --fix to apply the findings afterward.
---

Review the current diff using the `code-reviewer` subagent (`.claude/agents/code-reviewer.md`, runs on Fable) and report the results with `ReportFindings`.

## 1. Determine what to review

Run `git status --porcelain` and `git diff --stat` (staged + unstaged) to check for uncommitted changes.

- **Uncommitted changes exist** → the diff to review is the working tree: `git diff HEAD` (falls back to `git diff` if there's no HEAD yet).
- **No uncommitted changes** → review the current branch against the repo's main branch: `git diff main...HEAD` (merge-base diff, not `main..HEAD`).

If both are empty, tell the user there's nothing to review and stop — do not call `ReportFindings`.

## 2. Delegate to the code-reviewer subagent

Spawn the `code-reviewer` agent (`Agent` tool, `subagent_type: "code-reviewer"`, run in the foreground — you need its findings before continuing). Do not re-derive the diff yourself first; let the subagent read it directly so context isn't duplicated. Brief it with:

- Which git command produces the diff to review (from step 1)
- That it's reviewing the Github-search-app repo per its own instructions and CLAUDE.md
- Any scope the user gave you (e.g. "just the reducer changes", a specific file)

## 3. Report findings

The subagent returns its findings as text (file, summary, failure_scenario, category, verdict — see its own instructions). Convert that directly into a single `ReportFindings` call, most severe first, empty array if it found nothing. Do not re-review the diff yourself or add findings the subagent didn't surface — it already did the verification pass.

## 4. Optional: `--fix`

If the user's invocation included `--fix`, after reporting: for each finding, apply the fix with `Edit` directly in the main thread (the subagent has no write access). Re-run `yarn typecheck` and `yarn lint` (see `package.json` scripts) after fixing to confirm nothing broke. Skip findings that are `PLAUSIBLE` rather than `CONFIRMED` unless the user confirms first.
