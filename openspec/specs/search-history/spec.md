# search-history

## Purpose

The rolling history of the last 5 searches — creation, the 5-session cap, single-open accordion behavior, and `localStorage` persistence across reloads.

## Requirements

### Requirement: Session creation

The system SHALL record each successful search as a session containing the query text and its results, and SHALL order sessions newest-first.

#### Scenario: A successful search creates a session

- **WHEN** a search for `react` succeeds
- **THEN** a session is recorded with the request text `react` and the returned repositories

#### Scenario: Newest session appears first

- **WHEN** the user searches for `vue` after having searched for `react`
- **THEN** the `vue` session is ordered before the `react` session

#### Scenario: A failed search creates no session

- **WHEN** a search fails
- **THEN** no session is recorded

### Requirement: History cap

The system SHALL retain at most 5 sessions, discarding the oldest when a new session would exceed that limit.

#### Scenario: History below the cap

- **WHEN** 3 searches have succeeded
- **THEN** 3 sessions are retained

#### Scenario: History reaches the cap

- **WHEN** a 6th search succeeds after 5 sessions exist
- **THEN** exactly 5 sessions are retained
- **AND** the oldest session is discarded
- **AND** the newest session is retained

### Requirement: Single-open accordion

The system SHALL keep at most one session expanded at a time. A newly created session SHALL be expanded, and all others collapsed.

#### Scenario: New session opens and collapses the rest

- **WHEN** a new search succeeds while an older session is expanded
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

The system SHALL inform the user when a session's search returned no repositories.

#### Scenario: Session has no repositories

- **WHEN** the user expands a session whose search returned no repositories
- **THEN** a message indicating there are no repositories is displayed

### Requirement: History persistence

The system SHALL persist the session history to `localStorage` whenever it changes, and SHALL restore it on application start so that history survives a page reload.

#### Scenario: History is written on change

- **WHEN** a new session is created
- **THEN** the updated session history is written to `localStorage`

#### Scenario: History is restored on start

- **WHEN** the application starts and `localStorage` holds a previously saved history
- **THEN** the saved sessions are restored and displayed

#### Scenario: No stored history

- **WHEN** the application starts and `localStorage` holds no saved history
- **THEN** the application starts with an empty history
- **AND** no error is raised

#### Scenario: Restoration is idempotent under repeated initialization

- **WHEN** application start-up effects run more than once, as under React StrictMode in development
- **THEN** the restored history is the same as after a single initialization
- **AND** sessions are not duplicated
