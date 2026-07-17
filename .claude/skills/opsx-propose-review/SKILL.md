---
name: opsx-propose-review
description: Propose a new OpenSpec change with all artifacts generated in one step, wrapped with this repo's automated review gates (architecture-review after design.md, spec-review after the full artifact set — see .claude/docs/review-gates.md). Use instead of the vendored /opsx:propose whenever the user wants to propose a change — the vendored skill has no review gates, so used alone a flawed design or an inconsistent spec can reach implementation unreviewed.
---

Propose a new OpenSpec change, but — unlike the vendored `/opsx:propose` (`.claude/commands/opsx/propose.md`, `.claude/skills/openspec-propose/SKILL.md`) — insert this repo's automated review gates at the points `.claude/docs/review-gates.md` defines. That file is the source of truth for gate behavior; if it changes, follow the updated version over this summary.

This skill exists for the same reason `opsx-apply-git` wraps `/opsx:apply` instead of editing it: `openspec-propose`'s `SKILL.md` is vendored (`metadata.generatedBy` in its frontmatter), so hand-patching it risks being silently overwritten by a future `openspec` CLI update. Wrapping it here keeps the gate logic local and durable.

## 0. Read the review gates first

Before creating any artifact, read `.claude/docs/review-gates.md` in full. Gates 1 and 2 are what this skill implements.

## 1. Follow the vendored flow, with two insertions

Follow `openspec-propose`'s steps 1–5 unchanged: ask what to build if unclear, create the change (`openspec new change`), get the artifact build order (`openspec status --json`), loop through artifacts in dependency order using their `instructions`/`template`, show final status. Insert two gates into that artifact-creation loop (the vendored flow's step 4):

1. **Immediately after the `design` artifact is written** (or whichever artifact ID represents architecture/technical decisions, if the active schema isn't `spec-driven` — check `openspec status`'s `schemaName` and `artifacts` if unsure): run **Gate 1** (architecture-review) per `.claude/docs/review-gates.md` — invoke the `architecture-review` skill with the artifact's resolved path.
2. **Immediately after every artifact in `applyRequires` reaches `status: "done"`** (right before declaring the change ready for implementation): run **Gate 2** (spec-review) per `.claude/docs/review-gates.md` — invoke the `spec-review` skill with the change name.

## 2. Output

Same as the vendored flow's Output section (change name/location, artifacts created, readiness, next-step prompt), plus: report each gate's outcome — clean, or the findings and the user's decision — alongside the artifact list.

## Guardrails

Same as the vendored flow's Guardrails (create all required artifacts, read dependencies first, ask when critically unclear, verify each file exists), plus:
- Never declare a change "Ready for implementation" while a Gate 2 `CONFIRMED` finding is unresolved and the user hasn't explicitly chosen to proceed anyway.
- Never continue past the `design` artifact to `specs`/`tasks` while a Gate 1 `CONFIRMED` finding is unresolved and the user hasn't explicitly chosen to proceed anyway.
