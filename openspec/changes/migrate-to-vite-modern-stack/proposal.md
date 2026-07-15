## Why

The project does not currently build or run on this machine. `node-sass@4.14.1` is officially deprecated ("Node Sass is no longer supported"), ships no prebuilt binary for Node 24's ABI, and fails its node-gyp source build; `react-scripts` is pinned to `^4.0.0-next.98`, an unreleased 2020 pre-release. `node_modules/` is absent, so there is no working baseline to fall back to. The app is frozen: it cannot be run, tested, or deployed until the toolchain is replaced.

Migrating to Vite also unblocks three things the codebase has never had — a test suite, a modern React, and a Redux layer that isn't 227 lines of hand-rolled boilerplate — and is the moment to fix three user-visible bugs found in the reducer during exploration.

## What Changes

**Toolchain**
- **BREAKING** Replace `react-scripts` (CRA) with Vite 7 + `@vitejs/plugin-react`. `yarn start` → `yarn dev`.
- **BREAKING** Replace `node-sass` with `sass` (dart-sass). Unblocks install on Node 24.
- **BREAKING** Build output moves `build/` → `dist/`; `homepage` field replaced by Vite `base: '/Github-search-app/'`. The `deploy` script must be updated in the same step or GitHub Pages 404s on every asset.
- Move `public/index.html` → `./index.html`, drop `%PUBLIC_URL%`, add explicit module script tag.
- Preserve `baseUrl: "src"` absolute imports via `vite-tsconfig-paths` — every import in the codebase is absolute, so this is load-bearing on day one.

**Testing**
- Add Vitest + `@testing-library/react` + jsdom. First tests in the project's history.
- Tests pin the session rules (5-session cap, single-open accordion) *before* the Redux rewrite touches them.

**React**
- **BREAKING** React 16.13 → 19. `ReactDOM.render` is removed in 19; `src/index.tsx` moves to `createRoot`.
- **BREAKING** `react-redux` 7 → 9 (forced: v7 does not support React 19).

**State**
- **BREAKING** Redux → Redux Toolkit. `createSlice` + `createAsyncThunk` replace `constants.js` + `actions/types.ts` + `actions/actions.ts` + `reducers/reducers.ts`.
- Persistence moves from two `useEffect`s in `ListRequests` to `createListenerMiddleware`, removing the redundant `currentSessions` derived-state mirror.

**Bug fixes** (the only user-visible changes)
- `GET_REPOS_ERROR` never sets `loading: false` — an API error spins the loader forever.
- `GET_REPOS_SUCCESS` carries `error: null` but the reducer ignores it — an error message, once shown, never clears.
- `fetch` has no `.catch()` — a network failure dispatches nothing: stuck spinner, no message.
- Search query is not URL-encoded (`?q=${repository}?&per_page=8`), so `&` in a query injects a parameter.

**Quality**
- **BREAKING** ESLint 9 flat config + Prettier 3. `eslint-config-react-app` is CRA-coupled and unmaintained.
- Enable `noImplicitAny`; replace `Array<any>` with a real GitHub repo type. Delete `store/constants.js`.
- Remove confirmed-dead dependencies: `react-router-dom`, `material-icons-react`, `@types/react-router`, `@types/react-router-dom`, `@types/redux-form` (zero imports in `src/`).

**Documentation**
- `CLAUDE.md` is invalidated by nearly every step (CRA, commands, store layout, "no test files exist", "no persistence middleware", `noImplicitAny` off). Updated per-step, not at the end.

## Capabilities

### New Capabilities
- `repository-search`: submitting a search query, fetching matching repositories from the GitHub API, and the loading/error/success states around that request. Captures the bug fixes as correct requirements.
- `search-history`: the rolling history of the last 5 searches — creation, the 5-session cap, single-open accordion behavior, and `localStorage` persistence across reloads.

### Modified Capabilities

None. `openspec/specs/` is currently empty; this change introduces the project's first specs. They define the behavior that must remain true across the migration.

## Impact

**Affected code** — effectively all 536 lines of `src/`:
- `src/index.tsx` (createRoot), `src/react-app-env.d.ts` (→ `vite/client`)
- `src/store/**` — rewritten to a single slice; `constants.js`, `actions/types.ts`, `actions/actions.ts`, `reducers/reducers.ts`, `state.ts` collapse
- `src/components/ListRequests/index.tsx` — persistence and derived-state mirror removed
- 7 × `styles.module.scss` — `@import` resolution moves from CRA `includePaths` to Vite `css.preprocessorOptions`

**Config**: `package.json`, `tsconfig.json`, new `vite.config.ts`, new `eslint.config.js`, `.prettierrc.json`, root `index.html`. `yarn.lock` regenerated wholesale.

**Deployment**: `gh-pages -d build` → `dist`. The `base` path is the highest-risk single line in the change — it fails only in production, not locally.

**Risks**
- No baseline to diff against. The step-2 tests become the definition of correct behavior; anything not captured there is unverifiable.
- RTK's dev-mode immutability middleware will throw on the existing in-place mutations in `sessionCreator`/`sessionActiveHandler`. Immer makes these legal inside `createSlice`, but only if ported deliberately rather than mechanically.
- React 19 StrictMode double-invokes effects, exercising the localStorage hydration path twice.

**Out of scope**: visual redesign, GitHub API pagination/rate-limit handling, routing (dependency removed as dead), CI setup.
