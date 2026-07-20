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

## 4. Record the task-group classification in tasks.md

The subagent also returns a **Classification** block — one `isolated`/`judgement-heavy` label per `## N.` group. Record these marks so `opsx-apply-git` can read them and decide how far it may run autonomously (see `.claude/docs/review-gates.md` Gate 2 and the apply-loop's §3):

1. **Skip marking** if `openspec/changes/<change>/tasks.md` doesn't exist yet (a partial change — Gate 2 belongs to a complete artifact set), or if the subagent's `openspec validate <change> --strict` failed on a schema/structure finding. In either case say marks come once the change is structurally complete, and stop here.
2. For each classified group, edit its heading in `tasks.md` to carry a trailing HTML-comment marker: `## N. <title>  <!-- isolated -->` or `## N. <title>  <!-- judgement-heavy -->`. **Idempotent:** if a marker is already there, replace it — never stack two. Touch only the heading line; leave every task line unchanged.
3. Re-run `openspec validate <change> --strict` to confirm the markers didn't break the structure. If it now fails, revert the markers and report that instead.
4. Report the classification (which groups are isolated vs judgement-heavy, with the reviewer's one-line rationale) alongside the findings, so the user sees where the apply-loop will pause for review.
