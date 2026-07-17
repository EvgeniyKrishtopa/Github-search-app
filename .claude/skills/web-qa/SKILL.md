---
name: web-qa
description: Runs a manual QA pass on one or more UI flows in a real browser, using the project's web-qa-manual-tester subagent (Playwright MCP). Use before opening or updating a PR that touches UI/user-facing flows, after changes to critical flows (auth, checkout, core CRUD), or on demand ("run a QA pass on <flow>"). Do not use on every commit — too slow/flaky for that loop.
---

Run a manual browser QA pass using the `web-qa-manual-tester` subagent (`.claude/agents/web-qa-manual-tester.md`) and relay its report to the user.

## 1. Determine which flows to test

- If the user named specific flow(s) (e.g. "run a QA pass on search"), use those.
- Otherwise, infer affected flows from the current diff: run `git status --porcelain` and `git diff --stat` (staged + unstaged; fall back to `git diff main...HEAD` if the working tree is clean) and map the changed files to user-facing flows using CLAUDE.md's component layers (e.g. changes under `components/Form` → the search flow; `components/ListRequests`/`AccordionItem` → the history/accordion flow).
- If nothing changed and no flow was named, ask the user which flow to test rather than guessing.

Keep the flow list to what's actually affected — do not run a full regression pass across the whole app for a change that touched one component, unless the user asked for that explicitly.

## 2. Delegate to the subagent

Spawn the `web-qa-manual-tester` agent (`Agent` tool, `subagent_type: "web-qa-manual-tester"`, run in the foreground — you need its report before continuing). Brief it with:

- The specific flow(s) to test, described as user actions and expected outcomes (not implementation details).
- The dev URL and base path (`http://localhost:5173/Github-search-app/`) if not already obvious from its own instructions.
- Any specific concern that prompted the QA pass (e.g. "this touched the session-cap logic — check that a 6th search still caps history at 5").

## 3. Relay the report

Return the subagent's PASS/FAIL report to the user as-is (per-flow PASS/FAIL, evidence excerpts on failure) — do not re-summarize it into a different shape, and do not add findings the subagent didn't surface. If any flow FAILed, ask the user whether to investigate/fix now or proceed anyway — do not silently continue past a FAIL (same CONFIRMED-finding pause principle as the code-review/architecture-review gates in `.claude/docs/review-gates.md`).
