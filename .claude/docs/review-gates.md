# Automated Review Gates

This project wires AI review subagents into specific points of the OpenSpec
workflow, so architecture and spec problems surface before implementation,
and code/test problems surface before a task group is committed.

Per CLAUDE.md's Review Principles, "AI review is a sensor, not a final
verdict — the human owns the merge." Gates 1–4 surface their findings and
pause on a `CONFIRMED` finding for a human decision; none of them silently
block progress or auto-fix code, and `PLAUSIBLE`-only findings (or a clean
review) do not pause anything. Gate 5 is different by design — see below.

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

**Action:** run the `spec-review` skill for the change. Beyond finding
gaps, the skill **classifies each `## N.` task group in `tasks.md` as
`isolated` or `judgement-heavy`** (the read-only `spec-reviewer` decides the
labels; the skill writes them as a trailing `<!-- isolated -->` /
`<!-- judgement-heavy -->` comment on each group heading). This
classification is independent of findings — it is recorded whenever the
change is structurally valid, even on an otherwise clean review — and drives
how far the apply-loop (`opsx-apply-git`) proceeds autonomously: consecutive
`isolated` groups run without a human gate and land together in one PR, while
a `judgement-heavy` group is implemented one at a time with the human in the
loop and PR'd for review before merge. An unmarked group is treated as
`judgement-heavy` downstream.

**On a `CONFIRMED` finding:** show it to the user and ask whether to revise
the relevant artifact(s) before declaring the change ready for
implementation.

**On clean, or `PLAUSIBLE`-only:** declare the change ready for
implementation as usual. (The classification is still recorded.)

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

**On clean, or `PLAUSIBLE`-only:** proceed to Gate 5 if this is the last
group with pending tasks in the whole change; otherwise commit the group.
A mid-batch `isolated` group then loops back to the next group (`opsx-apply-git`
§3 Case A), while a single `judgement-heavy` group or the last group of a
batch continues to push + open the run's PR — those steps (`opsx-apply-git`
§4.7–4.10) run once per run, not once per group.

## Gate 5 — harness-review at the end of a change

**Trigger:** the *last* OpenSpec task group with pending tasks — determined
right after Gate 4 (or Gate 3, if Gate 4 didn't apply) passes for a group,
by checking whether any `- [ ]` remain anywhere else in `tasks.md` — but
before that group's own commit (`opsx-apply-git`'s step 4.6). Groups that
aren't the last one skip this gate entirely.

**Action:** run the `harness-review` skill, scoped to the whole harness
(`CLAUDE.md`, `.claude/agents/`, `.claude/skills/`, `.claude/docs/`), naming
the change so the reviewer can check for anything the change's
implementation should have updated in the harness but didn't.

**This gate does not follow the CONFIRMED/PLAUSIBLE pause rule above.**
Harness-review's purpose is suggesting actionable fixes, not just flagging
risk, so every finding — either verdict — is shown to the user with its
suggested fix, and the user chooses what to apply. Nothing is silently
auto-applied; the group-commit override in `.claude/docs/git-conventions.md`
covers a task group's own implementation commit, not harness config.

**On a finding the user approves:** apply the fix and commit it as its own
commit on the group branch (`chore: harness review — <summary>`), *before*
the group's own implementation commit.

**On clean, or the user declines every suggestion:** proceed straight to
the group's own commit, push, and PR into the parent as `opsx-apply-git`
already does.
