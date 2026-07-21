## Why

The single `repos` slice blends three distinct concerns into one persisted `ISession` object — server data (`data`), UI state (`opened`), and the query (`request`) — and hand-manages the fetch lifecycle (`loading`/`error` + `pending`/`fulfilled`/`rejected`) through a bespoke `createAsyncThunk`. This violates the project's own "separate server / UI / domain state" principle: a pure presentation toggle (`opened`) is written to `localStorage` on every accordion click, and boilerplate the framework can own is maintained by hand. This change re-layers the state so each concern is owned by the tool built for it, making the server/client boundary explicit and the code the reference example for that boundary.

## What Changes

- **Server state → RTK Query.** Introduce a `githubApi` service with a single `searchRepos(query)` endpoint. It owns the request lifecycle, loading, error, caching, and deduplication — replacing the `fetchRepos` thunk and the slice's `loading`/`error` fields entirely.
- **Domain state → `searchHistory` slice.** An append-only log capped at 5, where each entry stores **only** `{ id, query }`. **BREAKING (persistence):** entries no longer store repository results.
- **UI state → single `openId`.** Replace the per-entry `opened: boolean` (flipped via a `forEach`) with one `openId: number | null` — a single source of truth for the single-open accordion.
- **Fetching follows visibility.** `AccordionItem` subscribes via `useSearchReposQuery(query, { skip: !isOpen })`; only the open item fetches (cache-hit or re-fetch). Loading and error become **per item** rather than global. `Form` becomes thin — it only dispatches `addSession(query)`; the slice assigns the id via a `prepare` callback.
- **Persistence shrinks.** The listener middleware writes only `[{ id, query }]` to `localStorage`. On reload, history restores collapsed and results re-fetch lazily as items expand.
- **BREAKING (behavior): search history goes live.** Expanding a past search re-queries GitHub, so its results may differ from when it was first run, or fail (rate limit / offline), instead of showing a frozen snapshot. Product framing shifts from "photo album" to "saved searches".
- **BREAKING (behavior): a submitted search is logged even if it fails.** Because the query is logged on submit (not on success), a failed search now creates a session, reversing the current "a failed search creates no session" guarantee. This is the coherent semantics of a saved-searches log; the `search-history` spec drops that scenario.
- **Structure.** Move toward a feature-oriented layout: `app/` holds store/hooks/listener **and `githubApi`** (a shared store service, not a peer feature); a single `features/searchHistory/` holds the slice + `Form` + `ListRequests` + `AccordionItem` + `Repository`; shared dumb UI (Header, Loader) stays in `components/`. This keeps every store dependency pointing one direction (UI → slice, UI → service) with no feature-to-feature imports.

## Capabilities

### New Capabilities

<!-- None. The three re-layered concerns map onto the two existing capabilities. -->

### Modified Capabilities

- `repository-search`: the fetch, loading, and error behavior move from a bespoke thunk to RTK Query; loading/error become per active query rather than a single global flag; the request is triggered by the open session's subscription rather than issued directly on submit.
- `search-history`: a session now stores only its query, not its results; persistence stores only queries; expanding a session performs a **live** re-query whose results may differ or fail, replacing the frozen-snapshot behavior; a session is created for every non-empty submitted query — including one that fails — removing the "failed search creates no session" guarantee; single-open is expressed via a single `openId` toggled in one reducer; restored history starts collapsed.

## Impact

- **Dependencies:** none added — RTK Query ships inside the existing `@reduxjs/toolkit` (`@reduxjs/toolkit/query/react`).
- **Code (rewritten/moved):** `store/reposSlice.ts` (removed — split into `app/githubApi` + `features/searchHistory` slice), `store/store.ts`, `store/listenerMiddleware.ts`, `store/hooks.ts` (moved to `app/`); `Form`, `ListRequests`, `AccordionItem`, `Repository` (moved under `features/searchHistory/`); `typings/interfaces.ts` (`ISession` reshaped, `IState` removed).
- **Persistence:** existing `localStorage` payloads (full session data) become stale-but-harmless — the loader reads only `{ id, query }` and ignores extra fields; a stored history from the old shape still restores its queries.
- **Tests:** the `reposSlice` test is replaced by tests for the `searchHistory` slice, the `githubApi` endpoint, and `AccordionItem` skip/subscribe behavior; existing component/integration tests updated for per-item loading/error. Coverage thresholds (90% statements/lines/functions) preserved.
- **Out of scope:** pagination, filters, auth, favorites, and the hybrid stale-while-revalidate snapshot-seeding variant.
