## Context

A ~536-line React SPA on a toolchain that no longer installs. `node-sass@4.14.1` is deprecated upstream and has no prebuilt binary for Node 24's ABI; its node-gyp source build fails. `react-scripts@^4.0.0-next.98` is an unreleased 2020 pre-release. `node_modules/` is absent.

The defining constraint: **there is no runnable baseline.** Normal migration strategy — keep the old thing green, move incrementally, diff behavior — is unavailable. Nothing is green. This inverts the usual order of operations and drives most of the decisions below.

Current state worth carrying forward:
- TypeScript is already present (`strict: true`), with a typed action union and `RootState`. This is a *completion*, not an introduction.
- All imports are absolute via `baseUrl: "src"`. Every file depends on this resolving.
- Deployed to GitHub Pages at a sub-path via CRA's `homepage` field.
- Business logic (5-session cap, single-open accordion) lives entirely in the reducer — the exact code RTK rewrites.
- Three user-visible bugs live in that same reducer (see proposal).

## Goals / Non-Goals

**Goals:**
- Restore a project that installs, runs, tests, and deploys on current Node.
- Establish a test suite that pins behavior *before* any logic is rewritten.
- Reach React 19 + Redux Toolkit + ESLint 9 with each step independently verifiable and committable.
- Fix the three loading/error bugs, with tests proving the fix.
- Keep `CLAUDE.md` true at every step.

**Non-Goals:**
- Visual redesign. Styling is ported as-is.
- API pagination, rate-limit handling, or auth.
- Routing — `react-router-dom` is a dead dependency and is deleted, not migrated.
- CI/CD pipeline setup.
- Rewriting the app from scratch. At 536 LOC this is tempting; it would forfeit the step-by-step verification that is the point of the exercise.

## Decisions

### Vite before everything else

`node-sass` sits in `dependencies`, so `yarn install` fails before *any* other work is possible — including adding a test runner. Removing it means replacing the Sass pipeline; replacing the build is the only way to do that coherently. Vite is therefore not a preference here but the unblocking move.

*Alternative considered:* add Vitest to CRA first, write tests, then migrate the build. Rejected — install fails, so there is nothing to add Vitest to.

### Keep React 16 during the Vite step

Tempting to do Vite + React 19 together: one dependency churn instead of two. Rejected. If the app renders blank after a combined step, there are two suspects and no way to bisect. `@vitejs/plugin-react` supports React 16.9+ with `jsxRuntime: 'classic'`, matching the current `jsx: "react"` tsconfig setting, so React-16-on-Vite is a real and cheap intermediate state.

The cost is one extra dependency install. The benefit is that "Vite works" and "React 19 works" are independently falsifiable.

### Tests before the RTK rewrite

RTK rewrites the reducer. The reducer is where all business logic lives. With no baseline to compare against, tests written against the *current* logic are the only mechanism that can prove the rewrite preserved behavior.

This forces the ordering `Vite → Vitest → tests → RTK`, since Vitest needs Vite and tests need Vitest.

### Bug fixes as their own step, before RTK

The three bugs are in the reducer that RTK replaces. Two options:

1. Fix during the RTK rewrite — fewer steps, but conflates "port to RTK" with "change behavior." A failing test then has two possible causes.
2. Fix first, as a small isolated step on the existing reducer, then port the *correct* logic to RTK.

Chose (2). It keeps the RTK step a pure refactor with an unambiguous success criterion: tests stay green, no test changes. It also avoids writing tests that encode known-broken behavior and rewriting them a step later.

Consequence: step 3 is the only step a user would notice. Everything else is invisible plumbing.

### React 19 and react-redux 9 in a single step

Not a choice — a coupling. `react-redux@7` does not support React 19; v9 requires React 18+. They must move together.

RTK stays separate, because `react-redux@9` works with the existing vanilla `createStore` (Redux 5 still ships it, with a deprecation warning). That intermediate state is valid, which keeps the dependency bump and the logic rewrite as distinct, separately-revertable steps.

### Persistence moves to `createListenerMiddleware`

Today `ListRequests` renders the list, owns `localStorage` via two `useEffect`s, *and* mirrors `sessions` into a redundant `currentSessions` `useState`. That mirror is derived state with no purpose — the selector is already the source of truth.

`createListenerMiddleware` reacts to session-mutating actions and writes to `localStorage` outside React entirely. This deletes the mirror and both effects, leaving `ListRequests` as pure presentation.

*This overturns a documented rule.* `CLAUDE.md` currently states: "There is no persistence middleware; do not add localStorage logic in the reducer or thunk." That rule described a real constraint of hand-rolled Redux, where the only clean seam was the component. RTK provides a better seam. The rule is updated in the same step, not silently contradicted.

*Alternative considered:* keep persistence in the component, just drop the mirror. Simpler diff, but leaves UI and persistence coupled — contrary to the project's stated separation-of-concerns principles.

### Hydration stays idempotent

React 19 StrictMode double-invokes effects in development. Restoration must be safe to run twice — it replaces the session list rather than appending. This is specified (`search-history`: "Restoration is idempotent under repeated initialization") rather than left to chance, because the current code is only accidentally safe.

### TypeScript compiler version bumps in step 1, not step 7

Discovered during implementation: Vite 8's shipped `.d.ts` files (`vite/client`, `vite.config.ts`'s own types) use syntax `typescript@4.0.3` cannot parse — `tsc --noEmit` fails with syntax errors inside `node_modules/vite/types/*.d.ts` itself, before any project code is touched. Vite also requires `@types/node` `^20.19 || >=22.12`; the project pinned `^14.10.3`.

The original plan (`### Finish TypeScript rather than "add" it`, below) assumed the compiler version was untouched until step 7's `noImplicitAny` cleanup. That assumption doesn't hold: the toolchain doesn't typecheck at all until `typescript` and `@types/node` move, so both bump in step 1.2/1.3 alongside the rest of the toolchain swap, not step 7. Step 7 remains responsible for `noImplicitAny` and clearing stray `any`.

### Finish TypeScript rather than "add" it

TS is already on with `strict: true`. The gaps are `noImplicitAny: false`, `data: Array<any>` for the API response, and a lone `store/constants.js`. RTK closes most of these for free: `createSlice` infers action types, so `constants.js` and `actions/types.ts` disappear rather than needing conversion.

Only three fields of the GitHub response are consumed (`id`, `name`, `html_url`), so the response type is small and hand-written — no schema generation.

*Deferred:* runtime validation of the API response (e.g. Zod). Out of proportion for three fields on a public read-only API.

## Risks / Trade-offs

**No baseline to diff against** → The step-2 tests become the definition of correct behavior. Anything not captured there is unverified. Mitigation: write specs first (done — they *are* the test list), and accept that behavior outside them is not guaranteed to be preserved.

**GitHub Pages `base` path** → The single highest-risk line in the change. `base: '/Github-search-app/'` fails only in production; local dev looks perfect. Mitigation: verify with `vite preview` (which honors `base`) before deploying, and treat the first deploy as a checkpoint rather than an afterthought.

**Build output moves `build/` → `dist/`** → The `deploy` script silently publishes a stale or empty directory if the two drift. Mitigation: change `deploy` in the same commit as the Vite config; never split them.

**Absolute imports break all at once** → Vite ignores tsconfig `baseUrl`. Without `vite-tsconfig-paths`, every file fails to resolve simultaneously, which reads as catastrophic failure rather than a config gap. Mitigation: configure it in the first Vite commit; the very first `yarn dev` proves it.

**RTK immutability middleware throws on existing mutations** → `sessionCreator` and `sessionActiveHandler` mutate objects in place inside a `.map()` over a shallow copy. This works today only because the array identity changes. Immer makes such mutation legal *inside* `createSlice`, so a deliberate port is fine — a mechanical copy-paste into a non-slice helper is not. Mitigation: port the helpers into the slice's reducers, not alongside them.

**Sass `@import` deprecation** → 7 files use `@import 'styles/variables.scss'`, resolved via CRA's `includePaths`. dart-sass warns and will eventually remove `@import`. Mitigation: reproduce resolution via Vite `css.preprocessorOptions.scss.includePaths` first (keeping the step a port, not a rewrite); migrate `@import` → `@use` only if the warnings prove noisy — it is not on the critical path.

**Seven steps for 536 lines is heavy ceremony** → A rewrite would be faster in wall-clock terms. Accepted deliberately: the goal is a verifiable migration and the spec-driven practice, not the shortest path to a working app.

## Migration Plan

Each step ends green — installs, runs, tests pass — and is independently committable and revertable.

```
1. Vite + dart-sass ......... app runs again (React 16 unchanged)
2. Vitest + tests ........... safety net, pins current behavior
3. Fix 3 bugs ............... only user-visible step
4. React 19 + react-redux 9 . tests catch regressions
5. Redux Toolkit ............ pure refactor; tests must not change
6. ESLint 9 + Prettier 3 .... eslint-config-react-app dies with CRA
7. Strict TS + dead deps .... cosmetic, safe last
```

Rollback is per-step `git revert`. The riskiest boundary is step 1 (nothing to fall back to); steps 4 and 5 are protected by the suite from steps 2–3.

Deployment is verified at step 1 (`vite preview` with `base`) and again after step 7. GitHub Pages serves whatever was last pushed, so a broken deploy is rolled back by redeploying the previous build.

## Open Questions

- **Should `yarn install` failure be confirmed before starting?** The whole ordering argument rests on `node-sass` being the blocker. This is strongly evidenced (deprecated upstream, latest is 9.0.0, no Node 24 prebuild) but not empirically observed on this machine. Task 1.1 confirms it. If it installs cleanly, step 1 becomes less urgent and the ordering loosens — though the migration remains worth doing.
- ~~**Does `per_page=8` currently take effect?**~~ Resolved (task 3.5): confirmed against a live response — `curl "https://api.github.com/search/repositories?q=react&per_page=8"` returned exactly 8 items against a `total_count` in the millions. `per_page=8` was already taking effect; the stray `?` only polluted the search term, as suspected.
- **React 19 or 18?** Assumed 19 (current). If a transitive dependency resists, 18 satisfies every requirement here — `react-redux@9` supports both.
