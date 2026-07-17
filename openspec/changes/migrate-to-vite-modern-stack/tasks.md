Each numbered group ends green — installs, runs, tests pass — and is independently committable and revertable. Do not start a group before the previous one is green.

## 1. Vite + dart-sass (React 16 stays)

- [x] 1.1 Confirm the premise: run `yarn install` on Node 24 and capture the `node-sass` failure. If it installs cleanly, stop and revisit the ordering in `design.md` (Open Questions) before continuing.
- [x] 1.2 Remove `node-sass`, `react-scripts`, `eslint-config-react-app`, and the dead deps (`react-router-dom`, `material-icons-react`, `@types/react-router`, `@types/react-router-dom`, `@types/redux-form`) from `package.json`.
- [x] 1.3 Add `vite`, `@vitejs/plugin-react`, `sass`. Verify `yarn install` now succeeds. (`vite-tsconfig-paths` was evaluated but dropped — Vite 8 resolves tsconfig paths natively via `resolve.tsconfigPaths`, so the plugin is redundant.)
- [x] 1.4 Create `vite.config.ts`: React plugin with `jsxRuntime: 'classic'` (matches current `jsx: "react"`), `resolve.tsconfigPaths: true` (native, in place of the `vite-tsconfig-paths` plugin), `base: '/Github-search-app/'`, `build.outDir: 'dist'`, and `css.preprocessorOptions.scss.includePaths: ['src']` to preserve `@import 'styles/variables.scss'` resolution.
- [x] 1.5 Move `public/index.html` → `./index.html`; strip `%PUBLIC_URL%` prefixes; add `<script type="module" src="/src/index.tsx"></script>` before `</body>`.
- [x] 1.6 Replace `/// <reference types="react-scripts" />` in `src/react-app-env.d.ts` with `/// <reference types="vite/client" />`.
- [x] 1.7 Replace scripts in `package.json`: `dev`/`build`/`preview`. Update `deploy` to `gh-pages -d dist` and delete the now-unused `homepage` field — same commit as 1.4, or the deploy silently publishes the wrong directory.
- [x] 1.8 Run `yarn dev`. Verify the app loads, all absolute imports resolve, SCSS modules apply, and a search returns results.
- [x] 1.9 Run `yarn build && yarn preview`. Verify assets load under the `/Github-search-app/` base path — this is the only place the base path failure is observable before production.
- [x] 1.10 Update `CLAUDE.md`: Commands section (CRA → Vite), remove the "malformed query string" note's CRA framing, note `dist/` output.

## 2. Vitest + tests that pin current behavior

- [x] 2.1 Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom` at versions matching React 16 for now (RTL 9.x). Configure `test` in `vite.config.ts` with `environment: 'jsdom'` and a setup file importing `@testing-library/jest-dom`.
- [x] 2.2 Add `test` and `test:run` scripts. Verify a trivial smoke test passes.
- [x] 2.3 Test `sessionCreator` via the reducer: a successful search creates a session with the right request text and results; newest is ordered first. (`search-history`: Session creation)
- [x] 2.4 Test the 5-session cap: below the cap all sessions retained; a 6th search keeps exactly 5, drops the oldest, keeps the newest. (`search-history`: History cap)
- [x] 2.5 Test single-open behavior: a new session opens and collapses the rest; expanding one collapses the others; toggling the open one collapses it. (`search-history`: Single-open accordion)
- [x] 2.6 Test hydration: `GET_SESSIONS_FROM_LOCALSTORAGE` replaces the session list; dispatching it twice is idempotent (no duplication). (`search-history`: persistence, idempotency)
- [x] 2.7 Test `Form`: a non-empty query dispatches a fetch; an empty query does not; the input clears either way. (`repository-search`: Search submission)
- [x] 2.8 Test `AccordionItem`: a session with no repositories shows the empty message; a session with repositories renders each name linking to its `html_url`. (`repository-search`: Successful results / `search-history`: Empty result set)
- [x] 2.9 Write the three bug-exposing tests as `.skip` with a comment pointing to group 3 — loading stuck true on error, error never clearing, no `.catch()`. Do not encode broken behavior as passing assertions.
- [x] 2.10 Update `CLAUDE.md`: replace "No test files exist yet" with the real test commands and colocation convention.

## 3. Fix the three loading/error bugs

- [x] 3.1 Un-skip the loading test. Fix `GET_REPOS_ERROR` to set `loading: false`. (`repository-search`: Loading ends on API error)
- [x] 3.2 Un-skip the error-clearing test. Clear `error` when a search starts (`GET_REPOS_STARTED` → `error: null`), which covers both the stale-error and success paths. (`repository-search`: Error clears on a subsequent search)
- [x] 3.3 Un-skip the network test. Add `.catch()` to the `fetch` chain in `FetchRepos`, dispatching `getReposError` so a rejection sets `loading: false` and surfaces a message. (`repository-search`: Network request rejects, Loading ends on network failure)
- [x] 3.4 URL-encode the query with `encodeURIComponent` and remove the stray `?` from `?q=${repository}?&per_page=8`. Add a test that `foo&per_page=100` is sent as a search term, not a parameter. (`repository-search`: Query encoding)
- [x] 3.5 Confirm `per_page=8` actually takes effect against a real response (see `design.md` Open Questions), then assert it. (`repository-search`: Result limit)
- [x] 3.6 Verify manually in `yarn dev`: search a nonsense term, force an offline error, confirm the spinner stops and the message clears on the next search.
- [x] 3.7 Update `CLAUDE.md`: drop the "malformed query string" known-issue note — it is fixed.

## 4. React 16 → 19 and react-redux 7 → 9

- [x] 4.1 Upgrade `react`, `react-dom` to 19 and their `@types`. Upgrade `react-redux` to 9 — forced, v7 does not support React 19.
- [x] 4.2 Upgrade the test stack for React 19: `@testing-library/react` to 16.x, `jest-dom` to 6.x, `user-event` to 14.x. Note `user-event` v14 requires `userEvent.setup()` and is async — update the `Form` test accordingly.
- [x] 4.3 Rewrite `src/index.tsx` to `createRoot` from `react-dom/client`. `ReactDOM.render` is removed in React 19, not merely deprecated.
- [x] 4.4 Switch `vite.config.ts` to the automatic JSX runtime and set `"jsx": "react-jsx"` in `tsconfig.json`. Drop the now-redundant `import React` from files that use no React API.
- [x] 4.5 Run the full suite. Verify green — this is the step the suite from groups 2–3 exists to protect.
- [x] 4.6 Verify in `yarn dev` under StrictMode: history restores correctly despite effects double-invoking, with no duplicated sessions.
- [x] 4.7 Update `CLAUDE.md`: React version and the `createRoot` entry point.

## 5. Redux Toolkit

- [x] 5.1 Add `@reduxjs/toolkit`. Remove `redux-thunk` (RTK bundles it) and `redux` as a direct dependency.
- [x] 5.2 Type the GitHub response: add `IGitHubRepo` (`id`, `name`, `html_url` — the only fields consumed) in `typings/interfaces.ts`. Replace `data: Array<any>` and `repos: Array<any>`.
- [x] 5.3 Create `store/reposSlice.ts` with `createSlice`. Port `sessionCreator` and `sessionActiveHandler` **into the slice's reducers** so Immer governs them — do not copy them out as standalone helpers, or the dev-mode immutability middleware will throw on their in-place mutation.
- [x] 5.4 Replace `FetchRepos` with `createAsyncThunk`; map `pending` → `loading: true, error: null`, `fulfilled` → session creation + `loading: false`, `rejected` → `loading: false, error`. This is where groups 3.1–3.3 land naturally.
- [x] 5.5 Replace `store/state.ts` with RTK `configureStore` (devtools and thunk are built in — the manual `__REDUX_DEVTOOLS_EXTENSION_COMPOSE__` and its `window as any` cast go away). Export `RootState` and `AppDispatch`.
- [x] 5.6 Add typed `useAppSelector` / `useAppDispatch` hooks; replace the explicit `useSelector<RootState, T>` generics across components.
- [x] 5.7 Add `createListenerMiddleware` that writes session history to `localStorage` on session-mutating actions.
- [x] 5.8 Move hydration to store preload: read `localStorage` once, pass as `preloadedState` to `configureStore`. Idempotent by construction — StrictMode cannot double-apply it. Handle absent/malformed storage without throwing. (`search-history`: No stored history)
- [x] 5.9 Strip persistence from `ListRequests`: delete both `useEffect`s and the `currentSessions` mirror; render straight from the selector. The component becomes pure presentation.
- [x] 5.10 Delete `store/constants.js`, `store/actions/actions.ts`, `store/actions/types.ts`, `store/reducers/reducers.ts`, `store/reducers/index.ts`, `store/state.ts`.
- [x] 5.11 Run the full suite. **The tests must not change** — if a test needs editing, either behavior drifted or the test was over-coupled to the old shape. Diagnose before editing.
- [x] 5.12 Update `CLAUDE.md`: rewrite the Data flow, State shape, Persistence, and Redux-pieces sections. Remove the "there is no persistence middleware; do not add localStorage logic in the reducer or thunk" rule — this change deliberately overturns it (see `design.md`).

## 6. ESLint 9 + Prettier 3

- [x] 6.1 Add `eslint` 9, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `prettier` 3, `eslint-config-prettier`. Remove the old `@typescript-eslint/*` v4 packages, `eslint-plugin-prettier`, and `eslint-plugin-react` if unused.
- [x] 6.2 Create `eslint.config.js` (flat config). Delete the `eslintConfig` key from `package.json`.
- [x] 6.3 Add `lint` and `format` scripts — the project has never had a lint script; ESLint only ran implicitly through `react-scripts`.
- [x] 6.4 Run `yarn lint` and fix what it finds. Fix violations rather than widening rules.
- [x] 6.5 Run `yarn format`, confirm `.prettierrc.json` (single quotes, trailing commas, `arrowParens: avoid`, 80 col) still applies cleanly under Prettier 3.
- [x] 6.6 Update `CLAUDE.md`: replace "There is no separate lint script; ESLint runs through react-scripts."

## 7. Finish TypeScript and clean up

- [x] 7.1 Set `noImplicitAny: true` in `tsconfig.json`. Fix the fallout — most should already be gone with `constants.js` and the untyped `configureStore` param.
- [x] 7.2 Grep for remaining `any` and `as any`. Each one is either typed properly or gets a comment explaining why it cannot be.
- [x] 7.3 Add a `typecheck` script (`tsc --noEmit`) and verify clean.
- [x] 7.4 Verify `package.json` has no unused dependencies left; confirm `normalize.css` is retained (it is genuinely imported in `App.tsx`).
- [ ] 7.5 Run the full suite plus `yarn build`. Deploy and verify the live GitHub Pages URL loads under the base path.
- [x] 7.6 Final `CLAUDE.md` pass: read it top to bottom against the finished code and correct anything still describing the CRA-era project.
