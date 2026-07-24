## Why

The app works but looks dated, and its styling is locked to per-component SCSS Modules. We have an approved visual redesign ("Repo Search Redesign") — a dark, glassmorphic, `oklch`-based look with a hero, a monospace-accented header, and a two-column history grid — that we want to ship faithfully. Porting it is also the right moment to move the whole app onto **styled-components** with a typed theme, which turns the design's color palette into a single reusable source of truth and unlocks a light/dark theme toggle the current setup can't cleanly express.

## What Changes

- **BREAKING (convention):** Migrate the entire app's styling from SCSS Modules (`styles.module.scss` per component) to **styled-components** with a typed `DefaultTheme`. Remove `sass` and `normalize.css`; replace the global reset with `createGlobalStyle`. Update `CLAUDE.md`'s "File pattern" / "Conventions" accordingly.
- **New:** A **light/dark theme toggle**. Theme choice (`'dark' | 'light'`) is owned by a new `theme` Redux slice in `features/theming/`, defaults to the OS `prefers-color-scheme` (then `'dark'`), persists to `localStorage` via the **existing** `listenerMiddleware`, and is hydrated at store creation like search history. A `<ThemeProvider>` at the root feeds the active palette to every styled component. A connected `ThemeToggle` (co-located with the slice in `features/theming/`) is composed into the header, which stays a dumb presentational component.
- **Visual redesign (presentation only, behavior unchanged):**
  - `Header` — `</>` mono logo, `REPO SEARCH` label, `v2.0` tag, and the theme toggle.
  - `SearchPage` — new centered **hero** ("Find any repository, instantly." + subtitle) above the form.
  - `Form` — glass input + outlined accent button.
  - `ListRequests` — `REQUEST HISTORY` mono section label.
  - `AccordionItem` — glass card, chevron affordance, two-column results grid.
  - `Repository` — green-dot + repo name row; **keeps** the clickable `<a>` to the repo (accessibility and function preserved), only restyled.
  - `Loader` — restyled to match the language.
- **New fonts:** Inter + JetBrains Mono, loaded via the Google Fonts CDN `<link>` (as in the design file).
- **Unchanged:** All server state (`githubApi`), the `searchHistory` domain slice (last-5 cap, single-open, queries-only persistence, per-session cache-keying), and the data flow. This is a skin + one new UI capability, not a functional rework.

## Capabilities

### New Capabilities
- `ui-theming`: Light/dark theme selection — the available themes, the default-resolution order (persisted choice → OS preference → dark), persistence across reloads, and the header toggle that switches between them.

### Modified Capabilities
<!-- None. The visual redesign restyles existing components but changes no behavioral
     requirement of repository-search or search-history — their spec-level behavior
     (search, last-5 history, single-open accordion, queries-only persistence) is
     unchanged. Those are presentation/implementation changes, captured in design.md
     and tasks.md, not requirement deltas. -->

## Impact

- **Dependencies:** `+ styled-components`, `+ @types/styled-components` (or its bundled types), `+ babel-plugin-styled-components` (dev, for stable class names / displayName under `@vitejs/plugin-react`); `− sass`, `− normalize.css`.
- **New code:** `app/theme/` (cross-cutting styling infra) — `palettes.ts` (typed dark + light `DefaultTheme`), `styled.d.ts` (module augmentation for `DefaultTheme`), `GlobalStyle.ts` (`createGlobalStyle`). `features/theming/` (the theming feature: slice + its UI) — `themeSlice.ts` (choice + `toggleTheme`) and a connected `ThemeToggle` component.
- **Touched code:** every component (`Header`, `Loader`, `Form`, `ListRequests`, `AccordionItem`, `Repository`, `SearchPage`) loses its `styles.module.scss` and gains styled components; `Header` composes `<ThemeToggle/>` while staying dumb; `app/store.ts` (register theme slice + `loadThemeMode()` with feature-detected `matchMedia` + hydrate), `app/listenerMiddleware.ts` (persist theme), `src/App.tsx` (add a `ThemedApp` wrapper inside `<Provider>` that mounts `ThemeProvider` + `GlobalStyle`; `src/index.tsx` is unchanged), `src/setupTests.ts` (add `window.matchMedia` mock).
- **Removed files:** all `styles.module.scss`, `src/styles/*.scss` (migrated into theme/global style).
- **Tooling / config:** `vite.config.ts` (drop any sass-specific config, add styled-components babel plugin), `index.html` (font `<link>`s if not injected via helmet).
- **Tests:** existing RTL tests query by role/text and are largely resilient; any class-based assertions must move to role/text. New tests for the `theme` slice (default resolution, toggle, persistence) and the header toggle. Coverage floor (90% statements/lines/functions) must hold.
- **Docs:** `CLAUDE.md` (styling convention), `README` (styling stack, theme feature).
- **Risk:** Architecturally low — no server/domain boundary moves; broad blast radius (every component) but presentation-only except the additive `theme` slice.
