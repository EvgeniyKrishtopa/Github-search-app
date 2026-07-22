---
name: harness-review
description: Review this repo's Claude Code harness — CLAUDE.md, .claude/agents/, .claude/skills/, .claude/docs/, docs/COMMANDS.md — for stale claims, progressive-disclosure violations, weak skill descriptions, and cross-reference drift, using the project's harness-reviewer subagent (Fable model). Then offer to apply the fixes. Use when asked to review the harness/agent setup, or automatically as Gate 6 in .claude/docs/review-gates.md — after web-qa, code-review, and test-coverage-review, before a final task group's commit.
---

Review the Claude Code harness in this repo using the `harness-reviewer` subagent (`.claude/agents/harness-reviewer.md`, runs on Fable), report the findings with `ReportFindings`, then — unlike the other review-gate skills, which are read-only sensors — offer to apply the fixes.

## 1. Determine scope

Default scope is the whole harness: `CLAUDE.md`, every `.claude/agents/*.md`, every `.claude/skills/*/SKILL.md`, every `.claude/docs/*.md`, and `docs/COMMANDS.md` (the command reference documenting the harness's own command surface). If the user names a narrower scope (e.g. "just check the skill I just added"), pass that through to the subagent instead of the default.

## 2. Delegate to the harness-reviewer subagent

Spawn the `harness-reviewer` agent (`Agent` tool, `subagent_type: "harness-reviewer"`, run in the foreground — you need its findings before continuing). Do not read the harness files yourself first; let the subagent do that so context isn't duplicated. Brief it with the scope from step 1, and — if this is running as Gate 6 — the OpenSpec change name, so it can pay particular attention to anything that change's implementation should have updated in the harness but didn't.

## 3. Report findings

The subagent returns findings as text (file, summary, failure_scenario, category, a concrete `suggestion`, verdict — see its own instructions). `ReportFindings` has no dedicated field for `suggestion`, so fold each one into that finding's `summary` (e.g. "the description buries its trigger condition; lead with '<suggested rewrite>' instead"). Convert directly into a single `ReportFindings` call, most severe first, empty array if nothing survived. Do not re-review the harness yourself or add findings the subagent didn't surface.

## 4. Offer to apply

If there are findings, don't stop at reporting — this skill exists so improvements are actionable in the same session, not just logged:

- Ask the user which findings to apply: all, a subset, or none (`AskUserQuestion` for more than one finding, a plain question for one). Show each finding's suggested fix so the choice is concrete.
- Running standalone or as Gate 6 — same rule either way: apply only what the user approves. Gate 6 does not silently auto-apply; that override (in `.claude/docs/git-conventions.md`) covers a task group's own commit, not harness config.
- For each approved finding, apply the smallest edit that resolves the `failure_scenario`, matching the subagent's suggestion unless it's wrong — if you deviate, say why.
- Never edit a vendored file (frontmatter `metadata.generatedBy`) even if approved — point the user to the wrapper-skill alternative instead, per the subagent's vendored-file check.

## 5. Report what changed

List what was applied, what was skipped and why, and which files changed. If this ran as Gate 6, hand control back to `opsx-apply-git` — it commits any applied changes as their own commit before the group's own commit (see its step 4).
