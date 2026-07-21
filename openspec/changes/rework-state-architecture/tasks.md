## 1. Add the githubApi server-state service (additive)  <!-- isolated -->

- [x] 1.1 Create `src/store/githubApi.ts` with `createApi` (`reducerPath: 'githubApi'`, `fetchBaseQuery({ baseUrl: 'https://api.github.com' })`) and one `searchRepos` query endpoint whose arg is `{ id: number; q: string }` (keyed per session id — design D1): `query: ({ q }) => \`/search/repositories?q=${encodeURIComponent(q)}&per_page=8\``, `transformResponse: (r: { items: IGitHubRepo[] }) => r.items`, and a raised `keepUnusedDataFor` (300s) per design D4.
- [x] 1.2 Export the generated `useSearchReposQuery` hook.
- [x] 1.3 Register `githubApi.reducer` under `githubApi.reducerPath` and concat `githubApi.middleware` in `src/store/store.ts` (leave the existing `repos` reducer and listener in place — this group is purely additive).
- [x] 1.4 Add `src/store/githubApi.test.ts` covering: URL/query encoding (query with a reserved char is encoded, no extra param injected), `per_page=8`, `transformResponse` returning `items`, and that two args with the same `q` but different `id` produce distinct cache entries (each fires its own request).
- [x] 1.5 Verify: `yarn typecheck`, `yarn lint`, `yarn test:run` all pass.

## 2. Add the searchHistory domain slice (additive)  <!-- isolated -->

- [x] 2.1 Reshape `typings/interfaces.ts`: `ISession = { id: number; query: string }` (no `data`, no `opened`); add `SearchHistoryState = { entries: ISession[]; openId: number | null }`; remove the old `IState`.
- [x] 2.2 Create `src/store/searchHistorySlice.ts` with `initialState = { entries: [], openId: null }` and reducers: `addSession` (with a `prepare` callback assigning `id: Date.now()` — design D2 — that prepends the entry, caps `entries` at 5 by discarding the oldest, and sets `openId` to the new id) and `toggleSession(id)` (the single-open branch `state.openId = state.openId === id ? null : id` — design D3).
- [x] 2.3 Add `src/store/searchHistorySlice.test.ts` covering: `addSession` stores query only and prepends newest-first; cap-at-5 discards the oldest and keeps the newest; `addSession` sets `openId` to the new entry; `toggleSession` opens a collapsed session, collapses the open one, and enforces single-open; id assignment happens in the reducer (dispatching the plain query yields a numeric id).
- [x] 2.4 Verify: `yarn typecheck`, `yarn lint`, `yarn test:run` all pass (old `repos` slice still drives the UI at this point).

## 3. Rewire components to the new architecture and remove the old slice  <!-- judgement-heavy -->

- [x] 3.1 `Form`: dispatch `addSession(query)` on non-empty submit, clear the input regardless, no fetch trigger and no local error mirror (remove the `errorResponse` `useState`/`useEffect`).
- [x] 3.2 `AccordionItem`: read nothing from a stored `data`; call `useSearchReposQuery({ id, q: query }, { skip: !isOpen })` (arg keyed per session id — design D1); render its own per-item loading (reuse `Loader`) and error; show the empty-results message when the live result set is empty; dispatch `toggleSession(id)` on the header toggle.
- [x] 3.3 `ListRequests`: select `entries` and `openId` from the `searchHistory` slice; pass `isOpen={openId === id}` to each `AccordionItem`; drop the global loading branch (loading is per item now).
- [x] 3.4 `store.ts` hydration: load `[{ id, query }]` from `localStorage`, ignoring any extra legacy fields (design D5); set `openId: null` so restored history starts collapsed (design D3/D7).
- [x] 3.5 `listenerMiddleware.ts`: persist on `addSession` only (not on toggle); write `entries` (queries only) to `localStorage`.
- [x] 3.6 Remove `store/reposSlice.ts`, the `fetchRepos` thunk, the `loading`/`error` fields, and `changeSessionOpenedStatus`; drop the `repos` reducer from the store; delete `store/reposSlice.test.ts`.
- [x] 3.7 Update/replace component tests: `Form` (dispatches `addSession`, clears input, no session on empty), `AccordionItem` (skips fetch when collapsed, fetches when open, renders per-item loading/error/empty, toggles, and re-expanding the same session within the cache window issues **no** second request — assert fetch call count), `ListRequests` (single-open via `openId`); add an integration test covering the search → live-result → collapse/expand flow with a mocked fetch.
- [x] 3.8 Add `src/store/store.test.ts` covering the `History persistence` hydration scenarios that `reposSlice.test.ts`'s deletion removes: history restored from `localStorage` (queries only, starting collapsed), legacy old-shape payload tolerated (extra fields ignored, queries still restored — D5), no stored history yields an empty history with no error, and restoration is idempotent under repeated initialization (StrictMode — R5).
- [x] 3.9 Verify: `yarn typecheck`, `yarn lint`, `yarn test:coverage` pass and coverage stays ≥90% statements/lines/functions.

## 4. Move to the feature-oriented layout (mechanical, behavior-preserving)  <!-- isolated -->

- [ ] 4.1 Move `store/store.ts`, `store/hooks.ts`, `store/listenerMiddleware.ts`, and `store/githubApi.ts` into `src/app/`.
- [ ] 4.2 Move `searchHistorySlice.ts` and the `Form`, `ListRequests`, `AccordionItem`, `Repository` component folders into `src/features/searchHistory/`; leave `Header` and `Loader` in `src/components/`.
- [ ] 4.3 Update alias imports across `src/` to the new module names (no path-depth changes — aliases resolve by name); move each test file alongside its moved source.
- [ ] 4.4 Verify: `yarn typecheck`, `yarn lint`, `yarn test:coverage` pass unchanged from group 3 (this group changes no behavior).

## 5. Update project documentation to match the new architecture  <!-- isolated -->

- [ ] 5.1 Update `CLAUDE.md` (Architecture, State shape, Session rules, Persistence, Component layers, Conventions/Redux pieces) to describe the `githubApi` service, the `searchHistory` slice (`entries`/`openId`), per-item fetching via `useSearchReposQuery`, query-only persistence, the live saved-searches behavior, and the `app/` + `features/searchHistory/` layout — replacing all references to the single `repos` slice, `reposSlice.ts`, `fetchRepos`, `IState`, and the old `ISession` shape.
- [ ] 5.2 Verify: `yarn typecheck`, `yarn lint`, `yarn test:run` pass (no code change expected; confirms docs-only edits didn't break anything).
