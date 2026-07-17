---
name: architecture-review
description: Review a diff — or an OpenSpec design.md — for architecture risks (module boundary violations, mixed concerns, god components/services, circular dependencies, duplicated domain logic, unnecessary global state), using the project's architecture-reviewer subagent (Fable model). Use before committing changes that touch two or more layers, for any high-risk change per CLAUDE.md's Risk-Based Verification, or right after an OpenSpec design.md is drafted (see .claude/docs/review-gates.md, Gate 1).
---

Review either the current diff or an OpenSpec design document using the `architecture-reviewer` subagent (`.claude/agents/architecture-reviewer.md`, runs on Fable) and report the results with `ReportFindings`.

## 1. Determine what to review

- **A design-document path was given** (e.g. `openspec/changes/<name>/design.md`, as Gate 1 in `.claude/docs/review-gates.md` does): review that document's proposed architecture, not a diff.
- **Otherwise**, determine the diff the same way `code-review` does: uncommitted changes exist → `git diff HEAD` (or `git diff` if there's no HEAD yet); no uncommitted changes → the current branch against main: `git diff main...HEAD` (merge-base diff).

If reviewing a diff and both are empty, tell the user there's nothing to review and stop — do not call `ReportFindings`.

## 2. Delegate to the architecture-reviewer subagent

Spawn the `architecture-reviewer` agent (`Agent` tool, `subagent_type: "architecture-reviewer"`, run in the foreground — you need its findings before continuing). Do not re-derive the diff or read the document yourself first; let the subagent read it directly so context isn't duplicated. Brief it with:

- **Design-document mode:** the artifact's path, and that it should read the document's proposed architecture (module boundaries, data flow, state ownership, persistence) and assess it against CLAUDE.md's Architecture Principles as a plan rather than a diff — cross-referencing the current codebase via Read/Grep/Glob wherever the document's decisions interact with existing code.
- **Diff mode:** which git command produces the diff (from step 1), that it's reviewing the Github-search-app repo per its own instructions and CLAUDE.md, and any scope the user gave (e.g. "just the store changes", a specific file).

## 3. Report findings

The subagent returns its findings as text (file/section, summary, failure_scenario, category, verdict — see its own instructions). Convert that directly into a single `ReportFindings` call, most severe first, empty array if it found nothing. Do not re-review yourself or add findings the subagent didn't surface — it already did the verification pass.
