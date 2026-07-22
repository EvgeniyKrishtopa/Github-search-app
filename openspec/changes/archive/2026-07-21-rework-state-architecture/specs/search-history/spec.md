# search-history

## MODIFIED Requirements

### Requirement: History cap

The system SHALL retain at most 5 sessions, discarding the oldest when a newly submitted query would exceed that limit.

#### Scenario: History below the cap

- **WHEN** 3 non-empty queries have been submitted
- **THEN** 3 sessions are retained

#### Scenario: History reaches the cap

- **WHEN** a 6th non-empty query is submitted while 5 sessions exist
- **THEN** exactly 5 sessions are retained
- **AND** the oldest session is discarded
- **AND** the newest session is retained

### Requirement: Single-open accordion

The system SHALL keep at most one session expanded at a time. A newly created session SHALL be expanded, and all others collapsed.

#### Scenario: New session opens and collapses the rest

- **WHEN** a non-empty query is submitted while an older session is expanded
- **THEN** the new session is expanded
- **AND** every other session is collapsed

#### Scenario: Expanding a session collapses the others

- **WHEN** the user expands a collapsed session
- **THEN** that session is expanded
- **AND** every other session is collapsed

#### Scenario: Collapsing the open session

- **WHEN** the user toggles the currently expanded session
- **THEN** that session is collapsed
- **AND** no session is expanded

### Requirement: Empty result set

The system SHALL inform the user when the expanded session's live search returns no repositories.

#### Scenario: Session has no repositories

- **WHEN** the user expands a session whose live search returns no repositories
- **THEN** a message indicating there are no repositories is displayed

### Requirement: History persistence

The system SHALL persist the session queries (not their results) to `localStorage` whenever the history changes, and SHALL restore them on application start so that history survives a page reload. Restored sessions SHALL start collapsed, with their results re-fetched only when a session is expanded.

#### Scenario: History is written on change

- **WHEN** a new session is created
- **THEN** the updated history is written to `localStorage`
- **AND** the persisted payload contains each session's query but not repository results

#### Scenario: History is restored on start

- **WHEN** the application starts and `localStorage` holds a previously saved history
- **THEN** the saved session queries are restored and displayed
- **AND** every restored session starts collapsed

#### Scenario: Legacy stored history is restored

- **WHEN** the application starts and `localStorage` holds a history saved in the old shape that also stored results
- **THEN** the saved session queries are still restored
- **AND** the extra stored fields are ignored

#### Scenario: No stored history

- **WHEN** the application starts and `localStorage` holds no saved history
- **THEN** the application starts with an empty history
- **AND** no error is raised

#### Scenario: Restoration is idempotent under repeated initialization

- **WHEN** application start-up effects run more than once, as under React StrictMode in development
- **THEN** the restored history is the same as after a single initialization
- **AND** sessions are not duplicated

## REMOVED Requirements

### Requirement: Session creation

**Reason:** Session creation is no longer gated on a search succeeding. In the query-key log model a session is created on submission and stores only the query (not results), which reverses the old "a failed search creates no session" guarantee. Replaced by the new **Session logging** requirement below.

**Migration:** No data migration needed — the new `addSession` reducer records `{ id, query }` on submit; failed searches surface a per-session error on expand (see `repository-search` → Error reporting) rather than being suppressed at creation time.

## ADDED Requirements

### Requirement: Session logging

The system SHALL record each non-empty submitted query as a session containing only the query text, SHALL order sessions newest-first, and SHALL create the session on submission regardless of whether the resulting search later succeeds or fails. An empty query SHALL NOT create a session.

#### Scenario: A submitted query creates a session

- **WHEN** the user submits a search for `react`
- **THEN** a session is recorded with the request text `react`
- **AND** the session stores no repository results

#### Scenario: Newest session appears first

- **WHEN** the user searches for `vue` after having searched for `react`
- **THEN** the `vue` session is ordered before the `react` session

#### Scenario: A failed search still creates a session

- **WHEN** the user submits a query whose search later fails
- **THEN** the session for that query is still recorded

#### Scenario: An empty query creates no session

- **WHEN** the user submits the form with an empty input
- **THEN** no session is recorded

### Requirement: Live session results

A session SHALL NOT store repository results; the repositories shown for a session SHALL be derived from a live search each time the session is expanded, and MAY differ between expansions.

#### Scenario: Results are not stored in the session

- **WHEN** a session is created
- **THEN** it stores only the query text, not the repositories returned

#### Scenario: Expanding a past session re-queries live

- **WHEN** the user expands a session created by an earlier search
- **THEN** a live search is issued for that session's query
- **AND** the currently returned repositories are displayed

#### Scenario: Live results may change between expansions

- **WHEN** the user expands the same session at two different times and the upstream results have changed
- **THEN** each expansion displays the results returned at that time
