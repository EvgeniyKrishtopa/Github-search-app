# repository-search

## MODIFIED Requirements

### Requirement: Search submission

The system SHALL fetch matching repositories from the GitHub search API for the query of the session that is currently expanded, SHALL issue that request when a new session is created (which becomes expanded) or when a collapsed session is expanded, and SHALL NOT issue a request for an empty query.

#### Scenario: User submits a non-empty query

- **WHEN** the user types `react` into the search input and submits the form
- **THEN** a session for `react` is created and expanded
- **AND** the system issues a request to the GitHub repository search API for `react`

#### Scenario: User submits an empty query

- **WHEN** the user submits the form with an empty input
- **THEN** no request is issued
- **AND** no session is created

#### Scenario: Input clears after submission

- **WHEN** the user submits the form
- **THEN** the search input is cleared, regardless of whether a request was issued

### Requirement: Loading state

The system SHALL indicate loading within the expanded session while that session's search is in flight, and SHALL clear that indication when the search settles — whether it succeeds or fails. Collapsed sessions SHALL NOT show a loading indicator.

#### Scenario: Loading begins on request

- **WHEN** the expanded session's search request starts
- **THEN** a loading indicator is shown within that session

#### Scenario: Loading ends on success

- **WHEN** the expanded session's search request succeeds
- **THEN** the loading indicator within that session is hidden

#### Scenario: Loading ends on API error

- **WHEN** the expanded session's search request fails with an API error response
- **THEN** the loading indicator within that session is hidden

#### Scenario: Loading ends on network failure

- **WHEN** the expanded session's search request rejects because the network is unavailable
- **THEN** the loading indicator within that session is hidden

### Requirement: Error reporting

The system SHALL display an error message within a session whose search fails, reflecting only that session's own query outcome. Because each session's search is independent, one session's failure SHALL NOT display an error on another session.

#### Scenario: API returns an error response

- **WHEN** the expanded session's query responds with a non-OK status
- **THEN** an error message is displayed within that session

#### Scenario: Network request rejects

- **WHEN** the expanded session's request rejects before receiving a response
- **THEN** an error message is displayed within that session
- **AND** the failure does not surface as an unhandled promise rejection

#### Scenario: Errors are per session

- **WHEN** one session's search has failed and displayed an error
- **AND** the user creates or expands a different session
- **THEN** the other session does not inherit the first session's error

#### Scenario: Error clears on a subsequent search

- **WHEN** a session's search has failed and shown its error while expanded
- **AND** the user submits a new search
- **THEN** the new session is expanded and the failed session collapses
- **AND** the failed session's error is no longer displayed

## ADDED Requirements

### Requirement: Fetching follows session visibility

The system SHALL issue a repository search request only for the session that is currently expanded, and SHALL NOT issue a request for collapsed sessions. Re-expanding a session within the client cache window SHALL reuse cached results without issuing a new request.

#### Scenario: Collapsed sessions do not fetch

- **WHEN** the history holds several sessions and exactly one is expanded
- **THEN** a request is issued only for the expanded session's query
- **AND** no request is issued for the collapsed sessions

#### Scenario: Expanding a session issues its request

- **WHEN** the user expands a previously collapsed session
- **THEN** the system issues a search request for that session's query

#### Scenario: Recently viewed session serves from cache

- **WHEN** the user collapses a session and re-expands it within the client cache window
- **THEN** its results are displayed without issuing a new request
