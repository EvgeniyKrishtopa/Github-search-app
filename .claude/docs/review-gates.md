# Automated Review Gates

This project wires AI review subagents into specific points of the OpenSpec
workflow, so architecture and spec problems surface before implementation,
and code/test problems surface before a task group is committed.

Per CLAUDE.md's Review Principles, "AI review is a sensor, not a final
verdict — the human owns the merge." Every gate below surfaces its findings
and pauses on a `CONFIRMED` finding for a human decision; none of them
silently block progress or auto-fix code. `PLAUSIBLE`-only findings (or a
clean review) do not pause anything.

The wrapper skills below (`opsx-propose-review`, `opsx-update-review`,
`opsx-apply-git`) are the ones that actually run these gates — this file is
their shared source of truth so the gate logic isn't duplicated three times.
If this file changes, the wrapper skills follow the updated version.

## Gate 1 — architecture-review after `design.md`

**Trigger:** an OpenSpec change's `design` artifact (typically `design.md`)
is created or substantially revised.

**Action:** run the `architecture-review` skill, pointing it at the design
artifact's path so it reviews the document's *proposed* architecture rather
than a diff — there is no diff yet at this point in the workflow.

**On a `CONFIRMED` finding:** show it to the user and ask whether to revise
the design artifact now or proceed anyway. Do not continue on to `specs`/
`tasks` past an unresolved `CONFIRMED` finding without an explicit decision.

**On clean, or `PLAUSIBLE`-only:** continue the artifact-creation loop.

## Gate 2 — spec-review after the full artifact set

**Trigger:** every artifact in `applyRequires` is `status: "done"` (for the
`spec-driven` schema: proposal + design + specs + tasks all complete).

**Action:** run the `spec-review` skill for the change.

**On a `CONFIRMED` finding:** show it to the user and ask whether to revise
the relevant artifact(s) before declaring the change ready for
implementation.

**On clean, or `PLAUSIBLE`-only:** declare the change ready for
implementation as usual.

## Gate 3 — code-review after a task group's implementation

**Trigger:** every sub-task in an OpenSpec task group is implemented and the
group's own verification (typecheck/lint/tests, per the group's tasks)
passes — after `opsx-apply-git`'s step 4.1 (diff-scope check), before its
commit step.

**Action:** run the `code-review` skill against the group's uncommitted
diff.

**On a `CONFIRMED` finding:** show it to the user and ask whether to fix now
or commit anyway. Do not auto-commit past an unresolved `CONFIRMED` finding.

**On clean, or `PLAUSIBLE`-only:** proceed to Gate 4.

## Gate 4 — test-coverage-review after Gate 3 passes

**Trigger:** Gate 3 is clean (or the user explicitly chose to proceed
anyway) for a group whose tasks included test creation or updates.

**Action:** run the `test-coverage` skill against the same diff Gate 3
reviewed.

**On a `CONFIRMED` finding:** show it to the user and ask whether to add or
fix tests now or commit anyway.

**On clean, or `PLAUSIBLE`-only:** proceed to commit, merge, and push as
`opsx-apply-git` already does.
