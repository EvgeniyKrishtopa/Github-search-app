# GitHub Search App

A single-page app to search the GitHub repositories API and keep a rolling history of your last 5 searches as expandable accordion "sessions". History persists to `localStorage` as **queries only** — expanding a session re-runs its search live, so results are saved searches, never frozen snapshots.

**Live demo:** https://evgeniykrishtopa.github.io/Github-search-app/

## Features

- Search public GitHub repositories (top 8 results per query).
- Rolling history of the last 5 searches, capped automatically (oldest discarded).
- Single-open accordion — expanding one session collapses the others.
- Per-session loading and error states — only the open session fetches.
- History persists across reloads (queries only); restored sessions start collapsed, so nothing fetches on load until you expand a session.

## Tech Stack

- **React 19** + **TypeScript** (strict)
- **Redux Toolkit 2** — [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) for server state, a domain slice for history
- **react-redux 9**
- **Vite 8** — dev server and build
- **Sass** (CSS Modules)
- **Vitest** + **React Testing Library** — tests, with V8 coverage
- **ESLint 9** (flat config) + **Prettier 3**
- Deployed to **GitHub Pages** via `gh-pages`

## Getting Started

**Prerequisites:** Node `>=24 <25` (pinned via `engines.node`) and **Yarn** (Yarn 1 / Classic).

```bash
yarn install     # install dependencies
yarn dev         # start the dev server
```

Then open **http://localhost:5173/Github-search-app/** (the app is served under the `/Github-search-app/` base path — the trailing path matters).

## Scripts

| Command              | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| `yarn dev`           | Run the dev server at `http://localhost:5173/Github-search-app/`            |
| `yarn build`         | Production build to `dist/`                                                  |
| `yarn preview`       | Serve the `dist/` build locally under the base path (catches base-path issues) |
| `yarn test`          | Vitest + RTL in interactive watch mode                                       |
| `yarn test:run`      | Single test run (CI mode)                                                    |
| `yarn test:coverage` | Single run with coverage (enforces thresholds)                              |
| `yarn typecheck`     | `tsc --noEmit`                                                               |
| `yarn lint`          | ESLint (flat config)                                                         |
| `yarn format`        | Prettier, writing in place                                                   |
| `yarn deploy`        | Build then publish `dist/` to GitHub Pages                                   |

Run a single test file: `yarn test src/features/searchHistory/Form/index.test.tsx`.

## Architecture

State is split by concern across three layers:

- **Server state — RTK Query** (`src/app/githubApi.ts`): one `searchRepos({ id, q })` endpoint hits the GitHub search API and owns the request lifecycle, caching, and dedup. The cache keys per session `id`, not per query text.
- **Domain state — `searchHistory` slice** (`src/features/searchHistory/searchHistorySlice.ts`): holds the list of sessions (`{ id, query }`) and which one is open. Adds sessions, caps history at 5, and enforces single-open toggling.
- **Persistence — listener middleware** (`src/app/listenerMiddleware.ts`): writes queries to `localStorage` on new searches; hydration happens once at store creation via `preloadedState`.

Component flow: `App` → `Header` + `SearchPage` → `Form` (input + dispatch) and `ListRequests` (history) → `AccordionItem` (per session, subscribes + toggles) → `Repository` (per repo).

Imports are absolute from `src` (e.g. `import Form from 'features/searchHistory/Form'`). Each component is a folder with `index.tsx` + `styles.module.scss`.

> For the full architecture, conventions, and state-flow reference, see [`CLAUDE.md`](./CLAUDE.md).

## Project Structure

```
src/
├── app/                    # store infrastructure
│   ├── store.ts            # configureStore + localStorage hydration
│   ├── hooks.ts            # typed useAppSelector / useAppDispatch
│   ├── githubApi.ts        # RTK Query service (server state)
│   └── listenerMiddleware.ts  # localStorage persistence
├── features/searchHistory/ # domain slice + its UI
│   ├── searchHistorySlice.ts
│   ├── Form/               # search input + dispatch
│   ├── ListRequests/       # history list
│   ├── AccordionItem/      # per-session subscribe + toggle
│   └── Repository/         # per-repo card
├── components/             # shared dumb UI (Header, Loader)
├── pages/SearchPage/       # route composition
├── styles/                 # global styles + variables
└── typings/interfaces.ts   # shared types (e.g. IGitHubRepo)
```

## Testing

Tests live next to the code they cover (`*.test.tsx` / `*.test.ts`) and run in `jsdom`. Coverage thresholds are enforced at **90%** on statements, lines, and functions.

```bash
yarn test:coverage
```

## CI/CD

GitHub Actions workflows live in `.github/workflows/`:

- **`ci.yml`** — runs on every pull request and on push to `main`: typecheck, lint, test-coverage, CodeQL, and a report-only dependency-health check.
- **`cd.yml`** — deploys to GitHub Pages after CI succeeds on a push to `main`.

## Deployment

The app deploys to GitHub Pages. The base path is set via Vite's `base` config in `vite.config.ts` (not a `homepage` field). To publish manually:

```bash
yarn deploy
```
