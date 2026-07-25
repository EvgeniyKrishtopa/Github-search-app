# Loop Instructions

You are running the dependency-health loop for this repository.

## Before You Start

1. Read `ops/dependency-health/TASK.md`.
2. Read `ops/dependency-health/PROGRESS.md` — note the advisory IDs and
   outdated packages seen on the last run.

## What You Should Do

1. Run `yarn audit --json`.
2. Run `yarn outdated --json`.
3. Compare both against what `PROGRESS.md` recorded last run:
   - New advisories since last run (by ID).
   - Still-open advisories already known from a prior run.
   - Newly-outdated packages since last run.
4. Decide the mode. The trigger is _new information since last run_, never
   "an unresolved issue still exists" — a known, unfixed critical advisory
   must not force a full report every single day forever, or quiet mode
   never actually fires once the first critical/high advisory appears.
   - **Quiet mode (default)** — no new advisory IDs since last run, no
     severity escalation on a previously-known advisory, no newly-outdated
     packages: do not write a report file. Update `PROGRESS.md`'s "Last Run"
     section with today's date, mode = quiet, and a one-line "no change"
     summary. State explicitly in that line whether a known critical/high
     advisory is still open (e.g. "no change; gh-pages critical still open,
     day N") so it stays visible without a full report.
   - **Attention mode** — a brand-new advisory ID appears, OR a
     previously-known advisory's severity increased, OR new packages became
     outdated: write `ops/dependency-health/outputs/dependency-health.md`
     (overwrite the previous one) with these sections:
     - Summary
     - New advisories since last run (ID, package, severity)
     - Still-open advisories (ID, package, severity, first seen)
     - Newly-outdated packages (package, current, wanted, latest)
     - Recommended action (draft only — describe what upgrading would
       involve, do not perform it)
5. Update `ops/dependency-health/PROGRESS.md`: date, trigger (manual or
   `/loop`), summary, advisory IDs seen, outdated packages seen, output
   produced (or "none — quiet mode"), whether human review is needed.

## Safety Rules

- Only run `yarn audit --json` and `yarn outdated --json`. No other command.
- Never run `yarn add`, `npm install`, or anything that modifies
  dependencies.
- Never edit `package.json` or `yarn.lock`.
- Only write to `ops/dependency-health/PROGRESS.md` and
  `ops/dependency-health/outputs/dependency-health.md`.
- If unsure whether an action is allowed, stop and ask for human review
  instead of guessing.

## Scheduled Run Policy (once `/loop` is turned on)

- Quiet mode by default — most days should produce no report, just a
  one-line state update. A loop that writes a long report every single day
  gets ignored; save the noise for when something actually changed. A known,
  still-unfixed critical/high advisory does NOT by itself re-trigger
  attention mode on its own — see the "day N still open" note in quiet mode
  above instead.
- Every 7th consecutive quiet-mode run where a critical/high advisory is
  still open, write a short reminder to "Needs Human Review" in
  `PROGRESS.md` (not a full report) — don't let a known issue go silent
  forever, but don't repeat the full report daily either.
- If `yarn audit`/`yarn outdated` fails to run (e.g. network issue), log the
  failure in `PROGRESS.md` and stop — do not write a report based on partial
  or missing data. Only escalate to human review if 3 consecutive scheduled
  runs fail this way.

## Verification Checklist

Before ending the run, verify:

- `PROGRESS.md`'s "Last Run" section has today's date, the advisory IDs and
  outdated packages seen, and which mode this run used.
- If attention mode: `outputs/dependency-health.md` exists and has all four
  required sections.
- No file outside `ops/dependency-health/PROGRESS.md` and
  `ops/dependency-health/outputs/dependency-health.md` was modified.
- `package.json` and `yarn.lock` are unchanged (`git diff --stat` should
  show nothing there).
