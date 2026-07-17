---
name: opsx-update-review
description: Update an OpenSpec change's existing planning artifacts, wrapped with this repo's automated review gates (architecture-review after a design.md revision, spec-review once the change is coherent again — see .claude/docs/review-gates.md). Use instead of the vendored /opsx:update whenever the user wants to revise a change's plan — the vendored skill has no review gates, so used alone a revision can silently reintroduce an architecture risk or an inconsistency the original review already caught.
---

Revise a change's existing planning artifacts and keep them coherent, but — unlike the vendored `/opsx:update` (`.claude/commands/opsx/update.md`, `.claude/skills/openspec-update-change/SKILL.md`) — insert this repo's automated review gates at the points `.claude/docs/review-gates.md` defines. That file is the source of truth for gate behavior; if it changes, follow the updated version over this summary. Never edit code.

This skill exists for the same reason `opsx-apply-git` wraps `/opsx:apply` instead of editing it: `openspec-update-change`'s `SKILL.md` is vendored (`metadata.generatedBy` in its frontmatter), so hand-patching it risks being silently overwritten by a future `openspec` CLI update. Wrapping it here keeps the gate logic local and durable.

## 0. Read the review gates first

Before revising any artifact, read `.claude/docs/review-gates.md` in full. Gates 1 and 2 are what this skill implements.

## 1. Follow the vendored flow, with two insertions

Follow `openspec-update-change`'s steps 1–6 unchanged: select the change if not given, read its artifacts and current state (`openspec status --json`), understand the request, read and reconcile against the other artifacts, confirm and apply each revision one artifact at a time (write only after the user confirms), then point to the next step. Insert two gates:

1. **Immediately after a revision to the `design` artifact is written** (or whichever artifact ID represents architecture/technical decisions, if the active schema isn't `spec-driven`): run **Gate 1** (architecture-review) per `.claude/docs/review-gates.md` — invoke the `architecture-review` skill with the artifact's path.
2. **Immediately after the round of revisions leaves the change coherent** (no more contradictions/gaps noted in step 4 of the vendored flow, or the user declined further revisions): run **Gate 2** (spec-review) per `.claude/docs/review-gates.md` — invoke the `spec-review` skill with the change name. Skip this if the change wasn't already fully specced before the update (i.e. artifacts are still missing) — Gate 2 belongs to a complete artifact set, not a partial one; note that the change should go through `/opsx:continue` first.

## 2. Output

Same as the vendored flow's Output section (artifacts revised/rejected, anything deferred, recommended next command), plus: report each gate's outcome — clean, or the findings and the user's decision — alongside the revision summary.

## Guardrails

Same as the vendored flow's Guardrails (planning artifacts only, never edit code, use reported artifact ids/paths, edit only existing files, confirm every edit, recommend `/opsx:new` for an intent change), plus:
- Never report a change as coherent again while a Gate 2 `CONFIRMED` finding is unresolved and the user hasn't explicitly chosen to proceed anyway.
- Never move past a `design` revision to further reconciliation while a Gate 1 `CONFIRMED` finding is unresolved and the user hasn't explicitly chosen to proceed anyway.
