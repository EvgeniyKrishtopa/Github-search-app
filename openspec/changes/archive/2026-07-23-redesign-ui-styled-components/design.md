## Context

The app is a Vite + React 19 + Redux Toolkit SPA. Styling today is per-component SCSS Modules (`index.tsx` + `styles.module.scss`), with `normalize.css` and `src/styles/{common,variables}.scss` for globals. State is split cleanly across three layers: server (`app/githubApi.ts`, RTK Query), domain (`features/searchHistory/searchHistorySlice.ts`), and ephemeral UI (`openId`). Persistence is a `createListenerMiddleware` rule that writes search-history queries to `localStorage` on `addSession`; hydration is synchronous at store creation (`app/store.ts` `loadHistory` → `preloadedState`).

We are porting an approved visual redesign ("Repo Search Redesign.dc.html") and, at the same time, replacing the styling system with **styled-components** and adding a **light/dark theme toggle**. The design file is dark-only and `oklch`-based; the light palette must be derived, not ported. See `proposal.md` for motivation and `specs/ui-theming/spec.md` for the theming requirements.

## Goals / Non-Goals

**Goals:**
- Faithfully reproduce the redesign's visual language (dark glassmorphism, `oklch` palette, radial gradient background, Inter + JetBrains Mono, purple accent, green status dots, hero, two-column history grid).
- Migrate all component styling to styled-components with a **single typed `DefaultTheme`** as the color/token source of truth.
- Add a persisted light/dark toggle whose default follows OS `prefers-color-scheme`.
- Preserve all existing behavior: search, last-5 history, single-open accordion, per-session RTK Query cache-keying, queries-only persistence, and each result row's clickable link.
- Keep the coverage floor (90% statements/lines/functions) satisfied.

**Non-Goals:**
- No change to server state (`githubApi`) or the `searchHistory` domain slice's behavior.
- No pixel-perfect light theme from the design (the mock is dark-only; light is a derived, "good enough for contrast" counterpart).
- No new result data (stars/description/language) — the row keeps `name` + link, only restyled.
- No pagination, sorting, filtering, or auth changes — out of scope.
- No SSR/zero-runtime CSS-in-JS exploration (vanilla-extract/linaria) — styled-components is the chosen tool.

## Decisions

### D1 — styled-components (v6) as the styling system, one typed theme

Adopt styled-components v6 with a root `<ThemeProvider>` and a typed `DefaultTheme` (via `styled.d.ts` module augmentation). All palette values (`theme.color.accent`, `theme.color.glassBg`, `theme.color.statusDot`, gradients, radii, fonts) live in the theme — no magic color strings in components, satisfying CLAUDE.md's TypeScript standards. `createGlobalStyle` replaces `normalize.css` + `src/styles/common.scss` (body background gradient, base font, link colors, a minimal reset).

- **Why over keeping SCSS Modules restyled:** the light/dark toggle needs runtime theme switching; a typed theme object makes both palettes one source of truth and gives components type-checked tokens. SCSS Modules can't switch palettes at runtime without CSS-variable plumbing we'd have to hand-roll.
- **Why over vanilla-extract / linaria (zero-runtime):** the user explicitly chose styled-components; the app is small enough that CSS-in-JS runtime cost is negligible; DX and dynamic theming are simpler.
- **Build integration:** `@vitejs/plugin-react` uses Babel, so add `babel-plugin-styled-components` for stable class names + `displayName` (better test/debug ergonomics). Drop sass from deps and config.

### D2 — theme state lives in a new `theme` Redux slice, reusing existing persistence

Add `features/theming/themeSlice.ts`: `ThemeState = { mode: 'dark' | 'light' }` with a single `toggleTheme` reducer (`mode = mode === 'dark' ? 'light' : 'dark'`). The active mode maps to a palette in `app/theme/palettes.ts`, passed to `<ThemeProvider>` via a selector. (Slice placement — `features/theming/` rather than `app/` — is settled in D3.)

**Provider placement:** the Redux `<Provider store={store}>` lives in `App.tsx` today (not `src/index.tsx`, whose sole job is `createRoot(...).render(<StrictMode><App/></StrictMode>)`). A component that reads `mode` via `useAppSelector` must therefore sit **inside** `App.tsx`'s `<Provider>`, not in `index.tsx`. So `App.tsx` gains a small inner wrapper (a `ThemedApp` component) rendered as a child of `<Provider>`: it selects `mode`, and wraps the existing `Header`/`SearchPage` tree in `<ThemeProvider theme={palettes[mode]}>` with `<GlobalStyle/>`. `index.tsx` is left unchanged. This keeps CLAUDE.md's stated `index.tsx` role intact and avoids moving `<Provider>` up the tree.

- **Why a slice over React Context + custom effect:** the app already has Redux, a `createListenerMiddleware` persistence pattern, and a synchronous hydration path. A slice reuses all three — one new listener rule persists `mode` on `toggleTheme`, and `store.ts` hydrates it alongside history — instead of introducing a parallel Context+`useEffect`+localStorage mechanism. This keeps "single source of truth for UI state" (CLAUDE.md) and mirrors the existing `searchHistory` shape.
- **Default resolution (at store creation, in load order):** persisted `localStorage` value → OS preference via `window.matchMedia('(prefers-color-scheme: dark)')` → `'dark'`. Resolved once synchronously as `preloadedState`, so no flash-then-switch and no query/effect on load. **`matchMedia` must be feature-detected, not just `window`-guarded:** this repo's jsdom test environment defines `window` but **not** `window.matchMedia`, and `app/store.ts` is eagerly imported by most of the test suite — so the resolver reads OS preference only when `typeof window !== 'undefined' && typeof window.matchMedia === 'function'`, and falls back to `'dark'` otherwise. Additionally, `src/setupTests.ts` gains a `window.matchMedia` mock so tests can exercise both branches of the default-resolution logic (see Risks). A `loadThemeMode()` helper (mirroring `loadHistory`) encapsulates this so the browser-API access is isolated in one place, not scattered through the store wiring.
- **Persistence key:** a separate `localStorage` key from search history (e.g. `theme-mode`), written by its own listener rule; history persistence is untouched.

### D3 — component/file structure after migration; theming is a feature, not infra

Keep the folder-per-component layout; only the styling mechanism changes. Each component keeps `index.tsx` and gains co-located styled components — either inline in `index.tsx` for small ones or a sibling `styles.ts` for larger ones (`AccordionItem`, `Form`) to keep `index.tsx` focused. Remove every `styles.module.scss`.

Split theming along CLAUDE.md's own boundary — **`app/` is store/style infrastructure, `features/` is a slice plus its own UI, `components/` is shared dumb UI**:

- **`app/theme/`** (cross-cutting styling infrastructure, consumed at the root): `palettes.ts` (typed dark + light `DefaultTheme`), `styled.d.ts` (module augmentation), `GlobalStyle.ts` (`createGlobalStyle`). No Redux here.
- **`features/theming/`** (the theming feature's domain state + its UI, mirroring `features/searchHistory/`): `themeSlice.ts` and a **connected `ThemeToggle`** component that reads `mode` via `useAppSelector` and dispatches `toggleTheme` via `useAppDispatch`. This keeps the slice co-located with its UI, exactly like `searchHistorySlice` lives beside `Form`/`ListRequests`.
- **`components/Header`** stays **dumb** (no store access): it composes `<ThemeToggle/>` as a child alongside the logo/version, preserving CLAUDE.md's "shared dumb UI in `components/`" rule. Header takes no theme props and dispatches nothing.

Update `CLAUDE.md`'s "File pattern" convention from `styles.module.scss` to styled-components, and note `features/theming/` as a second feature alongside `features/searchHistory/`.

### D4 — palettes: dark ported, light derived; toggle is a connected feature component

`palettes.ts` exports `dark` and `light` `DefaultTheme` objects sharing structure. Dark is lifted from the design (`bg oklch(0.15 0.01 260)`, accent `oklch(0.78 0.15 280)`, glass `rgba(255,255,255,.06)`, status dot `oklch(0.75 0.16 150)`, gradients as given). Light is derived from the same hues: darker accent for contrast on light (`~oklch(0.55 0.18 280)`), `glass rgba(0,0,0,.04)`, softened light background gradient, adjusted text/border tokens. Interaction states not in the static mock (input focus ring, button hover, error card, restyled `Loader`) are defined per-theme in the palette + styled components. The **`ThemeToggle`** (in `features/theming/`, per D3) renders inside `Header` beside `v2.0` with an accessible label (`aria-label`, `aria-pressed`) and a sun/moon (or equivalent) affordance; Header itself remains presentational.

### D5 — fonts via Google Fonts CDN

Load Inter + JetBrains Mono through the design's Google Fonts `<link>` (preconnect + stylesheet) placed in `index.html`'s `<head>`. Font families are referenced through theme tokens (`theme.font.sans`, `theme.font.mono`). This matches the design file exactly at the cost of a render-blocking external request; self-hosting is a deliberate non-goal here.

## Risks / Trade-offs

- **[Broad blast radius — every component touched]** → The change is presentation-only outside the additive `theme` slice; behavior is covered by the existing RTL suite (queried by role/text, not class), so regressions surface in tests. Migrate and verify component-by-component.
- **[Class-based test assertions break]** → styled-components generate hashed class names. Any test asserting on a `styles.*` class must move to role/text/`data-testid`. Audit tests during migration; `babel-plugin-styled-components` gives stable `displayName` if a component-level query is unavoidable.
- **[`window.matchMedia` is undefined in jsdom → suite crashes at import]** → `app/store.ts` is eagerly imported across the suite; the OS-preference default resolver would throw at import if it called `matchMedia` unguarded. Mitigate per D2: feature-detect `typeof window.matchMedia === 'function'` (not just `window`), and add a `window.matchMedia` mock to `src/setupTests.ts` so both default-resolution branches (OS-dark and fallback) are testable and the 90% floor holds.
- **[Light palette is derived, not designed]** → Risk of poor contrast in light mode. Mitigate by checking WCAG AA contrast for text/accent-on-background in both palettes; treat light as functional, not a signed-off design.
- **[Google Fonts CDN adds an external runtime dependency + render-blocking request]** → Accepted per D5/user choice. FOUT is acceptable; `font-display: swap` (in the CDN URL) avoids invisible text. If CSP is ever tightened, revisit self-hosting.
- **[oklch / backdrop-filter support]** → Universally supported in current browsers (2026); no fallback needed for this app's audience.
- **[Coverage floor (90%)]** → The new `theme` slice + toggle add branches (default resolution, toggle both directions, persistence); cover them with slice + header tests so the floor holds and branch coverage doesn't regress.

## Migration Plan

1. Add deps (`styled-components`, types, `babel-plugin-styled-components`); wire the babel plugin in `vite.config.ts`; add font `<link>`s to `index.html`.
2. Create `app/theme/`: `palettes.ts` (dark + light), `styled.d.ts`, `GlobalStyle.ts`. Create `features/theming/`: `themeSlice.ts` + connected `ThemeToggle`. Register the slice in `store.ts`, add the `loadThemeMode()` helper (feature-detected `matchMedia`) + persistence listener rule + hydration, add the `window.matchMedia` mock to `src/setupTests.ts`, and add the `ThemedApp` wrapper **inside `App.tsx`'s `<Provider>`** that reads `mode` and mounts `<ThemeProvider>` + `<GlobalStyle>` (not `src/index.tsx`, which stays unchanged).
3. Migrate components bottom-up (`Repository`, `Loader`, `AccordionItem`, `Form`, `ListRequests`, `Header`, `SearchPage` hero), deleting each `styles.module.scss` as it's converted; compose `<ThemeToggle/>` into the (still-dumb) `Header`.
4. Remove `sass` + `normalize.css` + `src/styles/*.scss`; run typecheck/lint/tests; fix any class-based assertions.
5. Update `CLAUDE.md` (styling convention) and `README` (styling stack + theme feature).

**Rollback:** the change lands on a feature branch via PR (per this repo's git conventions); revert the merge if the redesign regresses. No data migration — the new `theme-mode` localStorage key is additive and absent-tolerant (falls back to OS preference), and existing search-history persistence is untouched.

## Open Questions

- Toggle affordance: sun/moon icon vs a labeled text switch — resolve during Header implementation; either satisfies the a11y requirement.
- Whether `AccordionItem`/`Form` warrant a sibling `styles.ts` or inline styled components — decide per-component by size during migration (D3 allows both).
