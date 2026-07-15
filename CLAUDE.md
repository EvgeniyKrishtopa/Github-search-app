# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **yarn** (see `yarn.lock`). Built on Create React App (`react-scripts`).

- `yarn start` — run dev server at http://localhost:3000
- `yarn build` — production build to `build/`
- `yarn test` — Jest + React Testing Library in interactive watch mode
  - Run a single test file: `yarn test src/path/File.test.tsx`
  - CI / single run: `CI=true yarn test`
- `yarn deploy` — builds then publishes `build/` to GitHub Pages via `gh-pages` (deploys to the `homepage` URL in `package.json`)

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

## Notes / Known Issues

- The API request URL has a malformed query string: `?q=${repository}?&per_page=8` (stray `?` before `&per_page`). Preserve or fix intentionally, but be aware pagination may not apply as written.
- No test files exist yet; `react-scripts test` is configured and ready. When adding behavior, colocate `*.test.tsx` next to the component.
