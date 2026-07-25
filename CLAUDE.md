# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **yarn** (see `yarn.lock`). Built on Vite (`vite`, `@vitejs/plugin-react`) with React 19 and react-redux 9.

- `yarn dev` — run dev server at http://localhost:5173/Github-search-app/
- `yarn build` — production build to `dist/`
- `yarn preview` — serve the `dist/` build locally under the `/Github-search-app/` base path (the only way to catch base-path issues before deploying)
- `yarn test` — Vitest + React Testing Library in interactive watch mode
  - Run a single test file: `yarn test src/path/File.test.tsx`
  - CI / single run: `yarn test:run` (or `yarn test:coverage` for coverage)
- `yarn deploy` — builds then publishes `dist/` to GitHub Pages via `gh-pages` (base path is set via Vite's `base` config in `vite.config.ts`, not a `homepage` field)
- `yarn lint` — ESLint 10 flat config (`eslint.config.mjs`)
- `yarn typecheck` — `tsc --noEmit`
- `yarn format` — Prettier 3, writing in place

See `docs/COMMANDS.md` for the full Claude Code / OpenSpec command reference (slash commands, harness skills, `openspec` CLI) — beyond the yarn scripts above.

## CI/CD

GitHub Actions workflows live in `.github/workflows/`:

- `ci.yml` — runs on every pull request (any target branch) and on push to `main`. Five parallel jobs: `typecheck` (`yarn typecheck`), `lint` (`yarn lint`), `test-coverage` (`yarn test:coverage`, enforcing the coverage thresholds below), `codeql` (GitHub CodeQL analysis — `init`/`analyze` only, no `autobuild`, since JS/TS needs none), and `dependency-health` (`yarn audit` + `yarn outdated`, both `continue-on-error` — report-only, never blocks a PR).
- `cd.yml` — triggered by `workflow_run` whenever `ci.yml` completes on `main`; the deploy job itself only runs when that completion was a `push`-triggered run (never a `pull_request`-triggered one, even one whose head branch happens to be named `main`) that concluded successfully — both checked in the job's `if`, not the trigger. Builds once (`yarn build`) and publishes via the `gh-pages` package's CLI directly, not the `yarn deploy` script (which double-builds via its `predeploy` npm hook), pinning the exact commit CI validated (`workflow_run.head_sha`) and serializing overlapping deploys via a `concurrency` group.

**Coverage threshold**: `vite.config.ts`'s `test.coverage.thresholds` enforces a minimum of 90% on statements, lines, and functions (currently 100% across all four metrics, including branches). Branch coverage is intentionally left unenforced by policy — not because it's behind.

**Node version**: pinned via `engines.node` in `package.json`, matching the version both workflows use.

**Required vs. advisory**: on pull requests targeting `main`, `typecheck`/`lint`/`test-coverage` are required status checks and a CodeQL code-scanning rule blocks on high-or-higher security alerts / error-level alerts (enforced via a GitHub repo ruleset) — warning-level or lower-severity alerts don't block. On pull requests targeting any other branch, the same checks run and report, but nothing enforces blocking.

**First deploy**: PR #31 merged `feature/modernize-2026` into `main` (v2.0.0), landing `ci.yml`/`cd.yml` there for the first time. The first CD run it triggered completed successfully the same day — CI, then CD, then the GitHub Pages publish — confirming the pipeline works end to end, not just on paper.

## Architecture

Single-page app: search the GitHub repositories API and keep a rolling history of the last 5 searches ("sessions"), each an expandable accordion. History persists to `localStorage` as **queries only** — a session stores no results; expanding one re-runs its search live via RTK Query, so results are "saved searches", never frozen snapshots.

State is split by concern across three layers (server / domain / UI):

**Server state — RTK Query (`app/githubApi.ts`):** one `searchRepos({ id, q })` endpoint hits `https://api.github.com/search/repositories?q=…&per_page=8` and `transformResponse`s to `.items`. It owns the request lifecycle, loading, error, caching, and dedup. The arg carries the session `id` so the cache keys **per session, not per query text** — a new session with duplicate text fetches fresh, while re-expanding the same session hits cache (`keepUnusedDataFor: 300`).

**Domain state — `searchHistory` slice (`features/searchHistory/searchHistorySlice.ts`, governed by Immer):** `SearchHistoryState = { entries: ISession[], openId: number | null }`, where `ISession = { id, query }`.

- `addSession(query)` assigns `id: Date.now()` in a `prepare` callback (identity lives in the slice, never in a component), prepends, caps history at **5** (discarding the oldest), and sets `openId` to the new entry.
- `toggleSession(id)` is single-open, expressed in one reducer: `openId = openId === id ? null : id`.
- A session is created on submit regardless of fetch outcome — a failed search still logs.

**UI / data flow:** `Form` is thin — it only `dispatch(addSession(query))` and clears the input; it does not fetch. Each `AccordionItem` subscribes `useSearchReposQuery({ id, q: query }, { skip: !isOpen })`, so only the open session fetches, and loading/error are **per item**. `RootState`/`AppDispatch` are exported from `app/store.ts`; components read/dispatch through the typed `useAppSelector`/`useAppDispatch` hooks in `app/hooks.ts`, not `react-redux`'s untyped ones.

**Persistence** is handled by `createListenerMiddleware` in `app/listenerMiddleware.ts`, which writes `entries` (queries only) to `localStorage` on `addSession` — **not** on `toggleSession`, since `openId` is ephemeral UI state. Hydration happens once, at store creation: `app/store.ts`'s `loadHistory` reads `localStorage` synchronously and passes it as `preloadedState` — restored history starts collapsed (`openId: null`), so no query fires on load. Idempotent by construction, since there is no effect to double-invoke under StrictMode. `loadHistory` maps each stored item to `{ id, query }`, tolerating a legacy pre-rework payload that stored the query under `request` (and extra `data`/`opened` fields). `ListRequests` is pure presentation; do not reintroduce persistence `useEffect`s there.

**Component layers:**

- `src/index.tsx` mounts `App` via `createRoot` (`react-dom/client`) inside `React.StrictMode` — `ReactDOM.render` is removed in React 19, not just deprecated.
- `App` → `Header` + `SearchPage`
- `SearchPage` → `Form` (input + dispatch) + `ListRequests` (history)
- `ListRequests` → `AccordionItem` (per session, subscribes + toggles) → `Repository` (per repo)
- `Loader` shows inside the open `AccordionItem` while its query is in flight (per-item, not global).

## Conventions

- **Path aliases:** imports are absolute from `src` (`paths: { "*": ["./src/*"] }` in `tsconfig.json`, resolved by Vite via `resolve.tsconfigPaths: true` in `vite.config.ts`), e.g. `import Form from 'features/searchHistory/Form'` — not relative `../../`. Match this in new files.
- **File pattern:** each component is a folder with `index.tsx` and co-located styled-components — inline, or a sibling `styles.ts` for larger components (e.g. `AccordionItem`). No `styles.module.scss` remains anywhere in `src/`. Theme tokens (palette, radii, fonts) live in `app/theme/` — `palettes.ts` (typed `dark`/`light` `DefaultTheme`s), `styled.d.ts` (module augmentation), `GlobalStyle.ts` (`createGlobalStyle`, replacing the old `normalize.css` + global reset).
- **Feature-oriented layout:** `app/` holds store infrastructure — `store.ts` (`configureStore`, `loadHistory`/`loadThemeMode` hydration, `RootState`/`AppDispatch`), `hooks.ts` (`useAppSelector`/`useAppDispatch`), `listenerMiddleware.ts` (localStorage persistence), `githubApi.ts` (the RTK Query service — a shared service, not a peer feature), and `theme/` (styling infrastructure, no Redux). `features/searchHistory/` holds the `searchHistorySlice.ts` domain slice plus its UI (`Form`, `ListRequests`, `AccordionItem`, `Repository`). `features/theming/` is a second feature, mirroring the same shape: `themeSlice.ts` (`mode: 'dark' | 'light'`, `toggleTheme`) plus its connected `ThemeToggle` UI. Shared dumb UI (`Header`, `Loader`) stays in `components/`, and the `SearchPage` route composition lives in `pages/SearchPage/`. Server-state code (`githubApi`) and domain-state code (`searchHistorySlice`/`themeSlice`) are separate; when adding state, decide which layer owns it — RTK Query for server data, a slice for domain/UI state — there is no separate constants or action-types file to keep in sync.
- TypeScript `strict` and `noImplicitAny` are both on; ESLint's `@typescript-eslint/no-explicit-any` is also enabled (errors on explicit `any`). The GitHub API response is typed via `IGitHubRepo` (`typings/interfaces.ts`) rather than `any`. There is no `any` anywhere in `src/`.
- Components are functional with hooks; `AccordionItem` is wrapped in `React.memo`.

## Git Conventions

Use small, focused branches and commits. Never mix unrelated changes. Read `.claude/docs/git-conventions.md` before creating a branch or a commit — it covers branch naming, Conventional Commits format, and AI commit discipline. Read `.claude/docs/review-gates.md` for the automated review gates (architecture, spec, web-qa, code, test-coverage, harness) wired into the OpenSpec workflow.

## Notes / Known Issues

- Tests live next to the code they cover: `*.test.tsx` beside components, `*.test.ts` beside reducers/actions. Vitest runs in `jsdom` with a setup file (`src/setupTests.ts`) that registers `@testing-library/jest-dom/vitest` matchers and calls RTL's `cleanup()` after each test (Vitest doesn't expose a global `afterEach` for RTL to auto-detect, since `test.globals` is off — `describe`/`it`/`expect` are imported explicitly from `vitest` in every test file).
