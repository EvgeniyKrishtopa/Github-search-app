## Context

Today one `repos` slice owns everything: `{ loading, sessions: ISession[], error }`, where `ISession = { request, data, opened, id }`. A hand-written `createAsyncThunk` (`fetchRepos`) drives the GitHub search API and its `pending`/`fulfilled`/`rejected` reducers set `loading`/`error` and prepend a session. A listener middleware writes the whole `sessions` array to `localStorage` on both `fetchRepos.fulfilled` and `changeSessionOpenedStatus`, and `store.ts` hydrates it at boot.

This blends three concerns that the project's own standards say to keep apart: **server state** (the repo results), **domain state** (the rolling history log), and **UI state** (which accordion is open). The blend has concrete costs: a pure UI toggle is persisted to disk on every click; fetch lifecycle boilerplate is maintained by hand; and the results of a search are frozen into the history log forever.

Constraints: React 19, Redux Toolkit already present (RTK Query is `@reduxjs/toolkit/query/react` — no new dependency). Path-alias imports, folder-per-component + `styles.module.scss`, and the 90% statements/lines/functions coverage floor must all hold.

## Goals / Non-Goals

**Goals:**

- Own server state with RTK Query; delete the bespoke thunk and the `loading`/`error` slice fields.
- Reduce the history log to identity only — `{ id, query }` — so the domain layer holds no server data.
- Express single-open with one `openId`, not N booleans.
- Make data-fetching follow UI visibility: only the open session subscribes.
- Shrink the persisted payload to queries, and keep hydration idempotent under StrictMode.

**Non-Goals:**

- Pagination, filters, auth, favorites.
- The hybrid stale-while-revalidate variant (seed the open item with a just-fetched snapshot, then revalidate). Explicitly deferred.
- Changing the visual design, routing, or the 5-item cap.

## Decisions

### D1: RTK Query owns server state; the history log holds only queries

`githubApi` exposes one endpoint, `searchRepos({ id, q }) → IGitHubRepo[]` (the query function uses `q`; `transformResponse` picks `.items`). The `searchHistory` slice stores `{ entries: {id, query}[], openId }`. The open `AccordionItem` calls `useSearchReposQuery({ id, q: query }, { skip: !isOpen })`; RTK Query owns loading, error, and caching, keyed **per session `id`** (the serialized arg includes `id`), not per query text.

*Why the arg carries `id` (resolves the duplicate-query cache conflict):* two requirements pull in opposite directions — "a new session SHALL issue a request" and "re-expanding within the cache window SHALL serve from cache." Keying by query *text* would make a second session with identical text silently reuse the first's cached (possibly errored) entry, violating the first requirement and the live premise. Keying by `id` satisfies both: a new session is a new key (fresh fetch), while re-expanding the *same* session reuses its own entry. The cost — duplicate-text sessions don't share one request — is the intended semantics of independent saved searches.

*Why over alternatives:* Model 1 ("snapshot log" — copy results into the entry) keeps today's behavior but leaves RTK Query's cache idle (fetch → snapshot → discard), so the server-state tool earns nothing. Storing queries only is the sole option where the server/client boundary is real: the log holds identity, the cache owns data. The accepted cost is the live-history behavior change (see D4, R1).

### D2: `Form` only logs the query; the slice owns identity; the open item drives the fetch

`Form` dispatches `addSession(query)` (the raw query string) and clears the input. It does **not** generate the id and does **not** trigger the request. Identity is assigned inside the slice via a `prepare` callback — `prepare: (query) => ({ payload: { id: Date.now(), query } })` — so `Date.now()` lives in the one file that owns the domain log, is unit-testable through a reducer test, and cannot drift if a second producer of sessions is added later. Because a newly added entry becomes the `openId`, the freshly-rendered open `AccordionItem` subscribes and fetches. Empty queries dispatch nothing but still clear the input (preserves the existing "input clears regardless" scenario).

**A session is logged on submit, independent of the fetch outcome** (accepted product decision — see D6). If the live query then fails, the session still exists and the open item shows its own error. This replaces the current "a failed search creates no session" guarantee.

*Why over alternatives:* triggering a lazy query in `Form`, awaiting it, and only then dispatching `addSession` would preserve the old "no session on failure" behavior, but it hands `Form` a fetch trigger plus its own loading/error surface — two request surfaces (initial vs. re-expand) instead of one. Logging on submit keeps `Form` thin and the item the single owner of request state, at the cost of the documented behavior change.

### D3: `openId` as a single value, toggled by one reducer, not persisted

The `searchHistory` slice owns a single `openId: number | null`. Single-open is expressed by **one reducer**, `toggleSession(id)`, which contains the whole branch — `state.openId = state.openId === id ? null : id` — so the single-open invariant lives in the slice, never in a component. `AccordionItem` only dispatches `toggleSession(id)`; it never chooses between two actions or computes the next open state itself. `addSession` sets `openId` to the new entry's id (newest opens).

`openId` is **not** persisted — it is ephemeral presentation state, so `localStorage` is written only when the log itself changes (`addSession`), never on a toggle. On hydration the restored history starts collapsed (see D7, Open Questions resolution).

*Why over alternatives:* keeping a boolean per entry forces a `forEach` flip and re-persists on every toggle; a single `openId` toggled in one reducer removes the loop, keeps the invariant in the slice, and decouples UI state from the persisted log.

### D4: `keepUnusedDataFor` tuned so revisiting a recent session is a cache hit

RTK Query's default eviction is 60s after the last subscriber unsubscribes. With single-open, collapsing a session unsubscribes it, so re-expanding after 60s re-fetches. Set `keepUnusedDataFor` to a larger window (e.g. 300s) so normal browsing of recent history is served from cache; only genuinely stale entries re-fetch. Because the cache is keyed per session `id` (D1), this window applies to re-expanding the *same* session — a newly created session, even with identical query text, is always a distinct key and fetches fresh.

*Why:* makes the live-history cost (R1) mild in the common case without reintroducing a snapshot store.

### D5: Persistence is forward-compatible with the old payload

The `localStorage` loader (`loadHistory`) reconstructs `{ id, query }` from each stored entry and ignores any extra fields. Because the old shape stored the query text under `request` (not `query`), the loader reads the query as `query ?? request`, so an old-shape history (with `request`/`data`/`opened`) still restores its queries; results simply re-fetch on expand. Entries missing a numeric `id` or any query text are skipped. No migration script is needed.

### D6: A submitted search is logged regardless of fetch outcome (accepted behavior change)

Because `Form` logs on submit (D2), a non-empty query that later fails still occupies a history slot and is persisted. This **reverses** the current `search-history` requirement "a failed search creates no session." It is accepted as the coherent semantics of a query-key log: the log records *saved searches* (an intent to search), and expanding one runs it live. This is the **second** BREAKING behavior change (alongside live-history, R1) and is documented as such in `proposal.md`; the `search-history` spec delta removes the old "failed search creates no session" scenario and states that every non-empty submitted query creates a session.

### D7: `githubApi` is a shared service in `app/`; one `searchHistory` feature holds the UI

`githubApi` is not a peer feature of `searchHistory` — it is store infrastructure (a reducer + middleware registered in the store), so it lives in `app/` beside `store.ts`, `hooks.ts`, and `listenerMiddleware.ts`. A **single** `features/searchHistory/` feature holds the slice plus all UI (`Form`, `ListRequests`, `AccordionItem`, `Repository`). `Header` and `Loader` stay in shared `components/`.

*Why over alternatives:* an earlier draft split the UI across two features (`repoSearch` + `searchHistory`), but every component's sole store dependency lived in the *other* folder — `Form` used `searchHistory`'s `addSession`, `AccordionItem` used `githubApi`'s hook — creating bidirectional cross-feature imports and a latent module cycle if either folder gained a barrel. Treating `githubApi` as a shared service makes every dependency point one direction: UI → `features/searchHistory` slice, and UI → `app/githubApi` service. No feature-to-feature edge exists.

## Risks / Trade-offs

- **R1: Live history can differ or fail.** [Expanding a past search re-queries GitHub; results may change, or fail on rate-limit/offline] → per-item error UI (an expanded session showing its own error is coherent for "saved searches"); D4 caching keeps recent revisits offline-free within the window; the behavior is called out as BREAKING in the proposal and specs.
- **R2: Unauthenticated GitHub rate limit (10 req/min for search).** [Re-fetching on every expand burns the budget faster than snapshots did] → `skip` means only the open item fetches; D4 caching collapses repeat expands into cache hits; out of scope to add auth, but noted.
- **R3: Per-item loading/error is a UX shift.** [No single global spinner; each session shows its own state] → intended and consistent with the model; `Loader` is reused inside the item.
- **R4: Folder move churns imports.** [Moving files under `features/`/`app/` touches many import paths] → path aliases mean imports change by name, not depth; do the move as its own task group so the diff is reviewable in isolation. Per D7 the move is a single feature plus a shared service, not a two-feature split, so no feature-to-feature import edges are introduced.
- **R6: Failed initial searches consume history slots.** [Per D6, a query that fails on submit still creates a session and can evict a legitimate older one] → accepted as the query-key log's semantics; the per-item error UI makes a failed saved-search legible; mitigated in practice by D4 caching for retries. Documented as BREAKING.
- **R5: StrictMode double-init.** [Hydration must stay idempotent] → hydration remains a pure `preloadedState` read at store creation (no effect), unchanged from today; the existing idempotence scenario still holds.

## Migration Plan

1. Add `githubApi` + wire its reducer/middleware into the store (additive, nothing removed yet).
2. Add the `searchHistory` slice alongside the old `repos` slice.
3. Switch components to the new slice + `useSearchReposQuery`; delete `reposSlice`, `loading`/`error` fields, and the thunk.
4. Move files into `features/`/`app/` and fix alias imports.

Rollback: the change is a branch; revert the branch. No data migration to undo — old `localStorage` payloads remain readable (D5).

## Open Questions

- *(Resolved — D3/D7 default)* Reload starts **fully collapsed** (`openId = null` after hydration): no query fires until the user expands an entry, avoiding a rate-limit hit at startup. The specs encode this.
