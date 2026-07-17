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

There is no separate lint script; ESLint runs through `react-scripts` (warnings surface in the dev console and build output). Prettier config lives in `.prettierrc.json` (single quotes, trailing commas, `arrowParens: avoid`, 80 col).

## Architecture

Single-page app: search the GitHub repositories API and keep a rolling history of the last 5 searches ("sessions"), each an expandable accordion, persisted to `localStorage`.

**Data flow (Redux Toolkit):**
`Form` dispatches `fetchRepos(query)` (a `createAsyncThunk` in `store/reposSlice.ts`) → the thunk calls `https://api.github.com/search/repositories` → `store/reposSlice.ts`'s `extraReducers` handle `pending`/`fulfilled`/`rejected`: `fulfilled` prepends a new session and marks it `opened`.

**State shape** — a single `repos` slice, combined in `store/store.ts` via `configureStore({ reducer: { repos: reposReducer } })`. `IState = { loading, sessions: ISession[], error }`. `ISession = { request, data, opened, id }`. `RootState`/`AppDispatch` are exported from `store/store.ts`; components read/dispatch through the typed `useAppSelector`/`useAppDispatch` hooks in `store/hooks.ts`, not `react-redux`'s untyped ones.

**Session rules (business logic lives in `store/reposSlice.ts`, governed by Immer):**
- `fetchRepos.fulfilled` caps history at **5** sessions and sets the newest one `opened: true`, all others `false`.
- `changeSessionOpenedStatus` (accordion toggle) is single-open: opening one closes the rest.

**Persistence** is handled by `createListenerMiddleware` in `store/listenerMiddleware.ts`, which writes `sessions` to `localStorage` whenever `fetchRepos.fulfilled` or `changeSessionOpenedStatus` is dispatched. Hydration happens once, at store creation: `store/store.ts` reads `localStorage` synchronously and passes it as `preloadedState` to `configureStore` — idempotent by construction, since there is no effect to double-invoke under StrictMode. `ListRequests` is pure presentation; do not reintroduce persistence `useEffect`s there.

**Component layers:**
- `src/index.tsx` mounts `App` via `createRoot` (`react-dom/client`) inside `React.StrictMode` — `ReactDOM.render` is removed in React 19, not just deprecated.
- `App` → `Header` + `SearchPage`
- `SearchPage` → `Form` (input + dispatch) + `ListRequests` (history + persistence)
- `ListRequests` → `AccordionItem` (per session) → `Repository` (per repo)
- `Loader` shows while `loading` is true.

## Conventions

- **Path aliases:** imports are absolute from `src` (`baseUrl: "src"` in `tsconfig.json`), e.g. `import Form from 'components/Form'` — not relative `../../`. Match this in new files.
- **File pattern:** each component is a folder with `index.tsx` + `styles.module.scss` (CSS Modules). Global styles/vars are in `src/styles/`.
- **Redux pieces** live in `store/`: `reposSlice.ts` (`createSlice` + `createAsyncThunk` — reducers, actions, and thunks in one file; action types are inferred, not hand-written), `store.ts` (`configureStore`, hydration, `RootState`/`AppDispatch`), `hooks.ts` (`useAppSelector`/`useAppDispatch`), `listenerMiddleware.ts` (localStorage persistence). When adding a new piece of state, add it to `reposSlice.ts`'s `initialState`/reducers/`extraReducers` — there is no separate constants or action-types file to keep in sync.
- TypeScript `strict` is on but `noImplicitAny` is off and `no-explicit-any` is disabled. The GitHub API response is typed via `IGitHubRepo` (`typings/interfaces.ts`) rather than `any`. Prefer typing new code properly.
- Components are functional with hooks; `AccordionItem` is wrapped in `React.memo`.

## Git Conventions

Use small, focused branches and commits. Never mix unrelated changes. Read `.claude/docs/git-conventions.md` before creating a branch or a commit — it covers branch naming, Conventional Commits format, and AI commit discipline.

## Notes / Known Issues

- Tests live next to the code they cover: `*.test.tsx` beside components, `*.test.ts` beside reducers/actions. Vitest runs in `jsdom` with a setup file (`src/setupTests.ts`) that registers `@testing-library/jest-dom/vitest` matchers and calls RTL's `cleanup()` after each test (Vitest doesn't expose a global `afterEach` for RTL to auto-detect, since `test.globals` is off — `describe`/`it`/`expect` are imported explicitly from `vitest` in every test file).
