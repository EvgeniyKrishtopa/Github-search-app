---
name: web-qa
description: Runs a manual QA pass on one or more UI flows in a real browser, using the project's web-qa-manual-tester subagent (Playwright MCP). Use before opening or updating a PR that touches UI/user-facing flows, after changes to critical flows (auth, checkout, core CRUD), or on demand ("run a QA pass on <flow>"); also runs automatically as Gate 3 in .claude/docs/review-gates.md — the last group's final browser check, before code-review. Do not use on every commit — too slow/flaky for that loop.
---

Run a manual browser QA pass using the `web-qa-manual-tester` subagent (`.claude/agents/web-qa-manual-tester.md`) and relay its report to the user.

## 1. Determine which flows to test

- If the user named specific flow(s) (e.g. "run a QA pass on search"), use those.
- Otherwise, infer affected flows from the current diff: run `git status --porcelain` and `git diff --stat` (staged + unstaged; fall back to `git diff main...HEAD` if the working tree is clean) and map the changed files to user-facing flows using CLAUDE.md's component layers (e.g. changes under `components/Form` → the search flow; `components/ListRequests`/`AccordionItem` → the history/accordion flow).
- If nothing changed and no flow was named, ask the user which flow to test rather than guessing.

Keep the flow list to what's actually affected — do not run a full regression pass across the whole app for a change that touched one component, unless the user asked for that explicitly.

## 2. Ensure a dev server is running

The subagent drives a real browser, so the app must be reachable first. Check `http://localhost:5173/Github-search-app/` (e.g. `curl -s -o /dev/null -w "%{http_code}"`). If it isn't up, start one with `yarn dev` in the background and poll until it returns `200`. If *you* started it, stop it once the report is relayed (step 3); leave a server the user already had running alone.

## 3. Delegate to the subagent

Spawn the `web-qa-manual-tester` agent (`Agent` tool, `subagent_type: "web-qa-manual-tester"`, run in the foreground — you need its report before continuing). Brief it with:

- The specific flow(s) to test, described as user actions and expected outcomes (not implementation details).
- The dev URL and base path (`http://localhost:5173/Github-search-app/`) if not already obvious from its own instructions.
- Any specific concern that prompted the QA pass (e.g. "this touched the session-cap logic — check that a 6th search still caps history at 5").

## 4. Relay the report

Return the subagent's PASS/FAIL report to the user as-is (per-flow PASS/FAIL, evidence excerpts on failure) — do not re-summarize it into a different shape, and do not add findings the subagent didn't surface. If you started the dev server in step 2, stop it now.

On a FAIL, first distinguish an **environment condition** from an app defect — a GitHub API rate-limit `403` (the public search API is unauthenticated and rate-limited) is not an app bug; note it and re-run rather than treating it as a failure, though the app must still handle it gracefully (no crash/blank).

For a genuine FAIL, behavior depends on how this skill was invoked:

- **Standalone** (user ran `/web-qa`): ask whether to investigate/fix now or proceed anyway — do not silently continue past a FAIL.
- **As Gate 3** (invoked by `opsx-apply-git` on the last group): this is a **must-pass gate with a fix loop**, not a simple pause — suggest a concrete fix, ask the user to approve it, apply it, and re-run web-qa on the affected flow(s); repeat until all-PASS before handing back to code-review (Gate 4). Only an explicit human "proceed anyway" continues past a FAIL. See `.claude/docs/review-gates.md` (Gate 3) for the full loop.
