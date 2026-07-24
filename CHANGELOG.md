# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/).

This is the first tracked entry — everything before `2.0.0` shipped without a
changelog, as a single untracked `1.0.0`.

## [2.0.0] - 2026-07-24

A full rewrite of the original 2020 create-react-app version. Nothing in the
UI or state layer survived unchanged; this release replaces the live GitHub
Pages deploy (last published in 2020) with this codebase.

### Added

- CI/CD pipeline: `ci.yml` (typecheck, lint, coverage-enforced tests, CodeQL,
  dependency-health) on every PR and push to `main`, plus `cd.yml` which
  deploys to GitHub Pages automatically after CI succeeds on `main`.
- RTK Query (`app/githubApi.ts`) as the server-state layer — request
  lifecycle, caching (per search session), and dedup, replacing hand-rolled
  thunks.
- Domain/UI split: `searchHistorySlice` owns session history, a separate
  `themeSlice` owns light/dark mode; both persist to `localStorage` via
  `createListenerMiddleware`.
- Light/dark theming via `styled-components` — typed `DefaultTheme` palettes,
  a header toggle, OS `prefers-color-scheme` default.
- Vitest + React Testing Library test suite with enforced coverage
  thresholds (90% statements/lines/functions).
- `engines.node` pin, ESLint 9 flat config, Prettier 3.
- OpenSpec-driven workflow (`openspec/`, `.claude/`) for specifying and
  reviewing future changes.

### Changed

- Build tooling: create-react-app → Vite 8.
- Styling: plain CSS / SCSS modules → `styled-components` with shared theme
  tokens.
- State shape: a single `reposSlice` mixing server and domain concerns →
  separated server state (RTK Query) and domain state (feature slices).

### Removed

- `normalize.css` and all `styles.module.scss` files (superseded by
  `styled-components` + `GlobalStyle`).
