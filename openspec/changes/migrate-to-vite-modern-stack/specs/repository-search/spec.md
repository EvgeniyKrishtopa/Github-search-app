## ADDED Requirements

### Requirement: Search submission

The system SHALL fetch matching repositories from the GitHub search API when a user submits a non-empty query, and SHALL NOT issue a request for an empty query.

#### Scenario: User submits a non-empty query

- **WHEN** the user types `react` into the search input and submits the form
- **THEN** the system issues a request to the GitHub repository search API for `react`

#### Scenario: User submits an empty query

- **WHEN** the user submits the form with an empty input
- **THEN** no request is issued

#### Scenario: Input clears after submission

- **WHEN** the user submits the form
- **THEN** the search input is cleared, regardless of whether a request was issued

### Requirement: Query encoding

The system SHALL URL-encode the user's query before placing it in the request URL, so that query text is never interpreted as URL syntax.

#### Scenario: Query contains a URL-reserved character

- **WHEN** the user searches for `foo&per_page=100`
- **THEN** the literal string `foo&per_page=100` is sent as the search term
- **AND** no additional query parameter is introduced by the user's input

### Requirement: Result limit

The system SHALL request at most 8 repositories per search.

#### Scenario: Search requests a bounded page size

- **WHEN** any search is issued
- **THEN** the request specifies a page size of 8

### Requirement: Loading state

The system SHALL indicate loading while a search is in flight, and SHALL clear that indication when the search settles — whether it succeeds or fails.

#### Scenario: Loading begins on request

- **WHEN** a search request starts
- **THEN** the loading indicator is shown

#### Scenario: Loading ends on success

- **WHEN** a search request succeeds
- **THEN** the loading indicator is hidden

#### Scenario: Loading ends on API error

- **WHEN** a search request fails with an API error response
- **THEN** the loading indicator is hidden

#### Scenario: Loading ends on network failure

- **WHEN** a search request rejects because the network is unavailable
- **THEN** the loading indicator is hidden

### Requirement: Error reporting

The system SHALL display a message when a search fails, and SHALL clear any previous error message when a new search begins.

#### Scenario: API returns an error response

- **WHEN** the GitHub API responds with a non-OK status
- **THEN** an error message is displayed to the user

#### Scenario: Network request rejects

- **WHEN** the request rejects before receiving a response
- **THEN** an error message is displayed to the user
- **AND** the failure does not surface as an unhandled promise rejection

#### Scenario: Error clears on a subsequent search

- **WHEN** a search has failed and displayed an error
- **AND** the user submits a new search
- **THEN** the previous error message is no longer displayed

### Requirement: Successful results

The system SHALL present the repositories returned by a successful search, each linking to its GitHub page.

#### Scenario: Search returns repositories

- **WHEN** a search succeeds with repository results
- **THEN** each repository is displayed with its name
- **AND** each repository name links to that repository's GitHub URL
