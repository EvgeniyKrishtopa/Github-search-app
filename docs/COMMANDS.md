# Commands Reference

A working reference for the **Claude Code** and **OpenSpec** commands available in this
repository. Scope is deliberately limited to the AI-assisted workflow — Claude slash
commands, the project's harness skills, and the OpenSpec CLI. Project build/test scripts
are documented in [`CLAUDE.md`](../CLAUDE.md#commands).

Source of truth for the entries below: `.claude/skills/*/SKILL.md`,
`.claude/docs/review-gates.md`, `.claude/docs/git-conventions.md`, and `openspec --help`.
When a skill or command is added or removed, update this file (the `/harness-review` gate
can flag drift).

---

## 1. Claude Code slash commands (built-in)

Typed into the Claude Code prompt. These are general to Claude Code but some are overridden
by this project's skills (noted below).

| Command | What it does | When to use | When *not* to |
|---|---|---|---|
| `/code-review` | Reviews your **working diff** for correctness + simplification, using this repo's `code-reviewer` skill. Add `--fix` to apply findings. | Before merging any change. This is the project override of the generic built-in reviewer. | To review someone else's opened PR — use `/review`. |
| `/code-review ultra [PR#]` | Multi-agent **cloud** review of the current branch, or a GitHub PR if you pass a number. Billed; user-triggered only. | A deep, thorough review of a substantial branch or PR. | Small diffs — plain `/code-review` is faster. Claude cannot launch this for you. |
| `/review` | Reviews a **GitHub pull request** (remote), not your local diff. | Reviewing a PR that's already open. | Reviewing uncommitted local work — use `/code-review`. |
| `/security-review` | Security-focused review of pending changes on the current branch. | Before merging changes to auth, user input, external API calls, or config (the high-risk tier in `CLAUDE.md`). | Low-risk UI/text/utility changes. |
| `/init` | Generates or refreshes `CLAUDE.md` from the codebase. | After a large structural change that makes `CLAUDE.md` stale. | Routine edits — hand-edit `CLAUDE.md` instead. |
| `/config` | Opens Claude Code settings (theme, model, etc.). | Adjusting session/model preferences. | Behavioral automation or permissions — use `/update-config`. |
| `/fast` | Toggles fast Opus output (same model, faster tokens). | When you want quicker responses on Opus 4.8/4.7. | — |
| `/clear` | Resets the conversation context. | Starting an unrelated task. | Mid-task — you'll lose working context. |
| `/help` | Claude Code help. | Anytime. | — |

---

## 2. Claude harness skills (project-specific)

Invoked as `/<skill-name>`. These are defined in `.claude/skills/` and encode this project's
review gates and OpenSpec workflow. Prefer these over the raw vendored commands — they add
the review gates and git discipline.

### Review gates

Run in order as part of the OpenSpec workflow. See [`.claude/docs/review-gates.md`](../.claude/docs/review-gates.md).

| Skill | What it does | When to use |
|---|---|---|
| `/architecture-review` | **Gate 1.** Reviews a diff — or an OpenSpec `design.md` — for architecture risks: boundary violations, mixed concerns, god components/services, circular deps, duplicated domain logic, unnecessary global state. | Right after a `design.md` is drafted; before committing any change touching **2+ layers**; for any high-risk change. |
| `/spec-review` | **Gate 2.** Reviews an OpenSpec change (proposal, design, specs, tasks) for internal consistency, testable requirements, and traceability, **and classifies each task group `isolated` vs `judgement-heavy`**, writing the mark into `tasks.md` for the apply-loop. | After the full artifact set is drafted; before implementing or archiving a change. |
| `/web-qa` | **Gate 3.** Manual QA pass on the change's UI flows in a real browser (Playwright). On the last group only, before code-review; a **must-pass gate with a fix loop** (not a CONFIRMED/PLAUSIBLE pause). Not applicable to changes with no user-facing surface. | The last group's final browser check; before a PR touching UI flows; after changes to critical flows. **Not** every commit — too slow/flaky. |
| `/code-review` | **Gate 4.** Correctness bugs + reuse/simplification/efficiency cleanups against the project's standards. `--fix` applies findings. | Before a task group's commit; before merging any change. |
| `/test-coverage` | **Gate 5.** Reviews a diff for test-coverage gaps and weak assertions against the ≥90% thresholds and any acceptance criteria in `openspec/`. | After `/code-review`, before merging a behavior change. |
| `/harness-review` | **Gate 6.** Reviews `CLAUDE.md`, `.claude/agents/`, `.claude/skills/`, `.claude/docs/` for stale claims and drift from authoring best practices. | Before a final task group's commit; when the harness setup changes. |

### OpenSpec workflow wrappers

Use these **instead of** the raw `/opsx:*` commands — the wrappers add the review gates and
the branch-per-group git workflow. Used alone, `/opsx:*` leaves work uncommitted or unreviewed.

| Skill | What it does | When to use |
|---|---|---|
| `/opsx-propose-review` | Proposes a new change, generating all artifacts in one step, wrapped with the architecture + spec review gates. | Starting a new feature/change proposal. |
| `/opsx-update-review` | Revises an existing change's planning artifacts and re-runs the relevant gates to keep them coherent. | Reworking a change's plan after review feedback or a scope shift. |
| `/opsx-apply-git` | Implements **one run** inside the branch-per-group workflow: an autonomous batch of consecutive `isolated` groups, or a single `judgement-heavy` group human-in-the-loop (per Gate 2's marks). Auto-commits each group when green, pushes the branch, opens **one** PR into the parent (left open for you to merge — never merges locally); auto-archives via its own PR after the last group. | Implementing / continuing / working through OpenSpec tasks. |

### Utility skills

| Skill | What it does | When to use | When *not* to |
|---|---|---|---|
| `/verify` | Exercises a change end-to-end — drives the affected flow, not just tests/typecheck. | Before committing nontrivial product-source changes. | Diffs touching only tests/docs (no runtime surface). |
| `/simplify` | Quality-only cleanup pass: reuse, simplification, efficiency, altitude. | Tidying changed code after it works. | Bug hunting — that's `/code-review`. |
| `/run` | Launches and drives the app to confirm a change works in the real app. | "Run the app" / confirm a change works for real / screenshot it. | Pure logic changes covered by tests. |
| `/loop` | Runs a prompt or slash command on a recurring interval (or self-paced). | Polling status or repeating a task on an interval. | One-off tasks. |
| `/schedule` | Creates/manages scheduled cloud agents (cron routines), incl. one-time runs. | Recurring or future-scheduled automated runs. | Immediate work. |
| `/update-config` | Configures the harness via `settings.json` — permissions, env vars, hooks (automated "whenever X" behaviors). | Allowing commands, setting env vars, wiring hooks. | Simple prefs like theme/model — use `/config`. |
| `/fewer-permission-prompts` | Scans transcripts and adds a read-only Bash/MCP allowlist to reduce permission prompts. | When routine safe commands keep prompting. | — |

### Subagents (review roster)

Read-only agents invoked **by the skills above**, not usually directly:
`architecture-reviewer`, `spec-reviewer`, `code-reviewer`, `test-coverage-reviewer`,
`harness-reviewer`, `web-qa-manual-tester`.

---

## 3. OpenSpec CLI (`npx openspec …`)

Spec-driven development engine. The wrapper skills in §2 orchestrate most of these for you,
but the CLI is useful for inspection and health checks.

| Command | What it does | When to use |
|---|---|---|
| `openspec list` | Lists active changes. Add `--specs` to list specs instead. | Day-to-day "what's in flight". |
| `openspec view` | Interactive dashboard of specs and changes. | Getting an overview of the whole workspace. |
| `openspec change show [name]` | Shows a change proposal (markdown or JSON). | Inspecting a proposal before implementing. |
| `openspec change validate [name]` | Validates a change proposal's structure. | Before implementing or archiving; CI-style checks. |
| `openspec spec show [id]` | Displays a specific capability spec. | Reading a spec's current requirements. |
| `openspec spec validate [id]` | Validates a spec's structure. | After editing a spec. |
| `openspec archive [name]` | Archives a completed change and folds its deltas into the main specs. | After a change is fully implemented (wrappers do this automatically). |
| `openspec doctor` | Reports relationship health for the resolved root (orphaned/broken links). | When specs and changes feel out of sync. |
| `openspec context` | Prints the working context OpenSpec feeds the AI. | Debugging what the AI "sees" for a change. |
| `openspec init [path]` | Initializes OpenSpec in a project. | One-time setup. |
| `openspec update [path]` | Refreshes OpenSpec instruction files. | After upgrading the OpenSpec tooling. |

> Note: `openspec change list` is **deprecated** — use `openspec list` instead.

---

## Everyday workflow (how they chain)

1. `/opsx-propose-review` — propose the change (runs architecture + spec gates).
2. `/opsx-apply-git` — implement the next run: a batch of consecutive `isolated` groups auto-run to one PR, or a single `judgement-heavy` group with you in the loop. Auto-commits each group when green, pushes, opens one PR into the parent.
3. `/verify` (and `/run` or `/web-qa` for UI) — confirm it actually works.
4. `/web-qa` (last group only) → `/code-review` → `/test-coverage` → `/harness-review` — the gate sequence before each group's commit.
5. You merge each run's PR on GitHub; the next `/opsx-apply-git` re-syncs the parent from that merge before starting the next run.
6. On the last group, `/opsx-apply-git` archives the change (`openspec archive`) via its own PR stacked on that run's PR.

Inspect anytime with `openspec list` / `openspec view` / `openspec doctor`.
