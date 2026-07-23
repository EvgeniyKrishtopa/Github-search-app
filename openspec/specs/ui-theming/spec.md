# ui-theming

## Purpose

Light/dark theme selection — the available themes, the default-resolution order (persisted choice → OS preference → dark), persistence across reloads, and the header toggle that switches between them.
## Requirements
### Requirement: Theme selection

The application SHALL provide exactly two themes, `dark` and `light`, and SHALL render its entire UI using the palette of the currently selected theme through a single root theme provider.

#### Scenario: Dark theme applied

- **WHEN** the selected theme is `dark`
- **THEN** the application renders using the dark palette (dark background, purple accent, light-on-dark text)

#### Scenario: Light theme applied

- **WHEN** the selected theme is `light`
- **THEN** the application renders using the light palette (light background, contrast-adjusted accent, dark-on-light text)

### Requirement: Default theme resolution

On first load, when no theme has been previously persisted, the application SHALL resolve the initial theme from the operating system preference: `light` when the OS reports a light color-scheme preference, otherwise `dark`. When the OS preference cannot be determined (the environment does not support `matchMedia`), the application SHALL default to `dark`.

#### Scenario: No persisted choice, OS prefers light

- **WHEN** the app loads with no persisted theme and the OS color-scheme preference is light
- **THEN** the initial theme is `light`

#### Scenario: No persisted choice, OS prefers dark

- **WHEN** the app loads with no persisted theme and the OS color-scheme preference is dark
- **THEN** the initial theme is `dark`

#### Scenario: No persisted choice, OS preference unavailable

- **WHEN** the app loads with no persisted theme and the environment does not support `matchMedia`
- **THEN** the initial theme is `dark`

### Requirement: Theme toggle

The application SHALL present an accessible control in the header that toggles between the two themes. Activating the control SHALL switch `dark` to `light` and `light` to `dark`. The control SHALL expose its state to assistive technology.

#### Scenario: Toggling from dark to light

- **WHEN** the current theme is `dark` and the user activates the theme toggle
- **THEN** the theme becomes `light` and the UI re-renders with the light palette

#### Scenario: Toggling from light to dark

- **WHEN** the current theme is `light` and the user activates the theme toggle
- **THEN** the theme becomes `dark` and the UI re-renders with the dark palette

#### Scenario: Toggle is accessible

- **WHEN** the theme toggle is rendered
- **THEN** it is reachable as a labeled control (accessible name) that communicates the current theme state to assistive technology

### Requirement: Theme persistence

The application SHALL persist the selected theme to `localStorage` under a key distinct from the search-history key, without altering search-history persistence. On subsequent loads, the persisted theme SHALL take precedence over the operating-system preference.

#### Scenario: Choice persists across reloads

- **WHEN** the user toggles the theme and later reloads the application
- **THEN** the previously selected theme is restored and applied, regardless of the current OS preference

#### Scenario: Persisted choice overrides OS preference

- **WHEN** a persisted theme of `light` exists and the OS preference is dark
- **THEN** the application loads with the `light` theme

#### Scenario: Theme persistence does not disturb search history

- **WHEN** the theme is toggled
- **THEN** the search-history persisted data is unchanged
