# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **yarn** (see `yarn.lock`). Built on Vite (`vite`, `@vitejs/plugin-react`).

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

**Data flow (Redux + thunk):**
`Form` dispatches `FetchRepos(query)` → thunk calls `https://api.github.com/search/repositories` → on success dispatches `GET_REPOS_SUCCESS` with the results → the `repos` reducer prepends a new session and marks it `opened`.

**State shape** — a single `repos` slice (`combineReducers` in `store/reducers/index.ts`). `IState = { loading, sessions: ISession[], error }`. `ISession = { request, data, opened, id }`.

**Session rules (business logic lives in the reducer, `store/reducers/reducers.ts`):**
- `sessionCreator` caps history at **5** sessions and sets the newest one `opened: true`, all others `false`.
- `sessionActiveHandler` (accordion toggle) is single-open: opening one closes the rest.

**Persistence** is handled entirely in `components/ListRequests/index.tsx` via two `useEffect`s — one writes `sessions` to `localStorage` on change, the other hydrates the store from `localStorage` on mount by dispatching `GetSessions`. There is no persistence middleware; do not add localStorage logic in the reducer or thunk.

**Component layers:**
- `App` → `Header` + `SearchPage`
- `SearchPage` → `Form` (input + dispatch) + `ListRequests` (history + persistence)
- `ListRequests` → `AccordionItem` (per session) → `Repository` (per repo)
- `Loader` shows while `loading` is true.

## Conventions

- **Path aliases:** imports are absolute from `src` (`baseUrl: "src"` in `tsconfig.json`), e.g. `import Form from 'components/Form'` — not relative `../../`. Match this in new files.
- **File pattern:** each component is a folder with `index.tsx` + `styles.module.scss` (CSS Modules). Global styles/vars are in `src/styles/`.
- **Redux pieces** are split across `store/`: `constants.js` (action type strings), `actions/actions.ts`, `actions/types.ts` (discriminated union `ReposActionTypes`), `reducers/`. When adding an action, update all three (constant → type interface → creator + reducer case).
- TypeScript `strict` is on but `noImplicitAny` is off and `no-explicit-any` is disabled; the GitHub API response is typed as `any` (`data: Array<any>`). Prefer typing new code properly rather than following the `any` precedent.
- Components are functional with hooks; `AccordionItem` is wrapped in `React.memo`.

## Git Conventions

Use small, focused branches and commits. Never mix unrelated changes. Read `.claude/docs/git-conventions.md` before creating a branch or a commit — it covers branch naming, Conventional Commits format, and AI commit discipline.

## Notes / Known Issues

- The API request URL has a malformed query string: `?q=${repository}?&per_page=8` (stray `?` before `&per_page`). Preserve or fix intentionally, but be aware pagination may not apply as written.
- Tests live next to the code they cover: `*.test.tsx` beside components, `*.test.ts` beside reducers/actions. Vitest runs in `jsdom` with a setup file (`src/setupTests.ts`) that registers `@testing-library/jest-dom/vitest` matchers and calls RTL's `cleanup()` after each test (Vitest doesn't expose a global `afterEach` for RTL to auto-detect, since `test.globals` is off — `describe`/`it`/`expect` are imported explicitly from `vitest` in every test file). Three tests are `.skip`ped pending known bug fixes (see the malformed-query-string note above and `tasks.md` group 3).
