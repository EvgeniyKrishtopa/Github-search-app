---
name: spec-review
description: Review an OpenSpec change (proposal.md, design.md, specs/*/spec.md, tasks.md) for internal consistency, testable requirements, and traceability, using the project's spec-reviewer subagent (Fable model). Use before implementing or archiving an OpenSpec change.
---

Review an OpenSpec change using the `spec-reviewer` subagent (`.claude/agents/spec-reviewer.md`, runs on Fable) and report the results with `ReportFindings`.

## 1. Identify the change to review

If the user named a change, use it. Otherwise run `openspec list --json` to find active changes:

- Exactly one active change → review that one.
- Multiple → ask the user which one.
- None → tell the user there's nothing to review and stop. Do not call `ReportFindings`.

## 2. Delegate to the spec-reviewer subagent

Spawn the `spec-reviewer` agent (`Agent` tool, `subagent_type: "spec-reviewer"`, run in the foreground — you need its findings before continuing). Give it the change name and any scope the user specified (e.g. "just the tasks.md ordering", "focus on the repository-search capability"). Let it run `openspec validate`/`openspec status` and read the artifacts itself rather than summarizing them for it first.

## 3. Report findings

The subagent returns its findings as text (file/section, summary, failure_scenario, category, verdict — see its own instructions). Convert that directly into a single `ReportFindings` call, most severe first, empty array if it found nothing. Do not re-review the artifacts yourself or add findings the subagent didn't surface — it already did the verification pass.
