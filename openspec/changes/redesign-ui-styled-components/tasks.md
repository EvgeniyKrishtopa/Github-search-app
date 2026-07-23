## 1. Tooling foundation  <!-- isolated -->

- [x] 1.1 Add `styled-components` (runtime) and its types + `babel-plugin-styled-components` (dev) via yarn; do not remove `sass`/`normalize.css` yet (components still use them until migrated)
- [x] 1.2 Wire `babel-plugin-styled-components` into `@vitejs/plugin-react`'s Babel options in `vite.config.ts` (stable class names + `displayName`)
- [x] 1.3 Add the Inter + JetBrains Mono Google Fonts `<link>` (preconnect + stylesheet, `display=swap`) to `index.html`'s `<head>`
- [x] 1.4 Verify the app still builds and the existing suite is green: `yarn typecheck && yarn lint && yarn test:run`

## 2. Theme foundation (palette, slice, provider, persistence)  <!-- judgement-heavy -->

- [x] 2.1 Create `app/theme/palettes.ts` exporting typed `dark` and `light` `DefaultTheme` objects sharing one structure (colors: background/gradient, accent, glass bg/border, text, statusDot; radii; fonts sans/mono); dark values ported from the design, light derived from the same hues
- [x] 2.2 Verify WCAG AA contrast (≥4.5:1 body text, ≥3:1 large text/accent-on-background) for both palettes' text and accent colors; adjust the light-palette tokens until they pass and record the checked pairs/ratios in a comment in `palettes.ts`
- [x] 2.3 Create `app/theme/styled.d.ts` augmenting `styled-components`' `DefaultTheme` with the palette shape (no `any`)
- [x] 2.4 Create `app/theme/GlobalStyle.ts` (`createGlobalStyle`) providing the reset + body background gradient + base font + link colors from `theme` tokens (replacing what `normalize.css`/`common.scss` did)
- [x] 2.5 Create `features/theming/themeSlice.ts`: `ThemeState = { mode: 'dark' | 'light' }`, single `toggleTheme` reducer, and a `selectThemeMode` selector
- [x] 2.6 Add a `loadThemeMode()` helper (beside `loadHistory` in `app/store.ts`) resolving: persisted `theme-mode` in `localStorage` → OS preference via `matchMedia` **only when `typeof window !== 'undefined' && typeof window.matchMedia === 'function'`** → `'dark'`; register the `theme` slice and pass the resolved mode as `preloadedState`
- [x] 2.7 Add a `createListenerMiddleware` rule in `app/listenerMiddleware.ts` that persists `mode` to the `theme-mode` key on `toggleTheme` (leave the search-history rule untouched)
- [x] 2.8 Add a `window.matchMedia` mock to `src/setupTests.ts` so default-resolution branches are exercisable
- [x] 2.9 Create the connected `features/theming/ThemeToggle` component: reads `mode` via `useAppSelector`, dispatches `toggleTheme` via `useAppDispatch`, renders an accessible button (`aria-label`, `aria-pressed`) with a sun/moon affordance
- [x] 2.10 Add a `ThemedApp` wrapper **inside `App.tsx`'s `<Provider>`** that selects `mode` and wraps the `Header`/`SearchPage` tree in `<ThemeProvider theme={palettes[mode]}>` + `<GlobalStyle/>`; leave `src/index.tsx` unchanged
- [x] 2.11 Add tests: `themeSlice` (initial state, `toggleTheme` both directions), `loadThemeMode` (persisted wins, OS-dark, OS-light, no-`matchMedia` fallback), the persistence listener (writes `theme-mode`, leaves history untouched), and `ThemeToggle` (renders accessible control, dispatches on click, reflects state)
- [x] 2.12 Add a theme-application test: render a token-dependent styled component through `ThemedApp`/`ThemeProvider` with `mode: 'dark'` and with `mode: 'light'`, asserting the resolved palette differs (e.g. a computed color/`data-` token), so the "Theme selection" spec scenarios are exercised — not just the slice
- [x] 2.13 Verify: `yarn typecheck && yarn lint && yarn test:coverage` green (90% floor holds)

## 3. Migrate leaf components (Repository, Loader)  <!-- isolated -->

- [x] 3.1 Convert `features/searchHistory/Repository` to styled-components: green-dot bullet + repo name, **keeping** the clickable `<a href={url}>` (accessibility/function preserved); delete its `styles.module.scss`
- [x] 3.2 Convert `components/Loader` to styled-components matching the design language; delete its `styles.module.scss`
- [x] 3.3 Update any tests in these components asserting on `styles.*` class names to query by role/text; add/adjust assertions as needed
- [x] 3.4 Verify: `yarn typecheck && yarn lint && yarn test:run` green

## 4. Migrate history components (AccordionItem, Form, ListRequests)  <!-- isolated -->

- [x] 4.1 Convert `features/searchHistory/AccordionItem` to styled-components (glass card, chevron affordance, two-column results grid); use a sibling `styles.ts` if it keeps `index.tsx` focused; delete its `styles.module.scss`
- [x] 4.2 Convert `features/searchHistory/Form` to styled-components (glass input + outlined accent button, focus/hover states); delete its `styles.module.scss`
- [x] 4.3 Convert `features/searchHistory/ListRequests` to styled-components with a `REQUEST HISTORY` mono section label; delete its `styles.module.scss`
- [x] 4.4 Update these components' tests to query by role/text instead of `styles.*` classes; keep behavior assertions (submit dispatches, single-open toggle, per-item loading/error) intact
- [x] 4.5 Verify: `yarn typecheck && yarn lint && yarn test:run` green

## 5. Migrate shell (Header + SearchPage hero)  <!-- judgement-heavy -->

- [ ] 5.1 Convert `components/Header` to styled-components (`</>` mono logo, `REPO SEARCH` label, `v2.0` tag) and compose `<ThemeToggle/>` beside `v2.0`, keeping Header **dumb** (no store access of its own); delete its `styles.module.scss`
- [ ] 5.2 Convert `pages/SearchPage` to styled-components and add the centered hero ("Find any repository, instantly." + subtitle) above the `Form`; delete its `styles.module.scss`
- [ ] 5.3 Update Header/SearchPage tests (hero heading present, Header renders the toggle) to query by role/text
- [ ] 5.4 Verify: `yarn typecheck && yarn lint && yarn test:run` green

## 6. Remove the old styling system  <!-- isolated -->

- [ ] 6.1 Confirm no `styles.module.scss` remain under `src/`; remove `src/styles/*.scss` (migrated into `GlobalStyle`/theme) and the `normalize.css` import
- [ ] 6.2 Remove `sass` and `normalize.css` from `package.json` and any sass-specific config from `vite.config.ts`
- [ ] 6.3 Grep the suite for any remaining class-based/`.module.scss` assertions and migrate them to role/text/`data-testid`
- [ ] 6.4 Full verification: `yarn typecheck && yarn lint && yarn test:coverage` green (90% floor holds), and `yarn build` succeeds under the `/Github-search-app/` base path

## 7. Documentation  <!-- isolated -->

- [ ] 7.1 Update `CLAUDE.md`: change the "File pattern" convention from `styles.module.scss` to styled-components + `app/theme/`, and record `features/theming/` as a second feature alongside `features/searchHistory/`
- [ ] 7.2 Update `README` to reflect the styled-components styling stack and the light/dark theme feature
