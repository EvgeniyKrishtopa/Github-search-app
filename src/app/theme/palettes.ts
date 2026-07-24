import type { DefaultTheme } from 'styled-components';

// Single source of truth for every color/token. Dark is lifted from the approved
// redesign (oklch-based glassmorphism); light is derived from the same hues with
// lightness/chroma tuned for contrast on a light background (design D4).
//
// WCAG AA contrast, foreground-on-background (verified via OKLCH→sRGB→WCAG):
//   DARK   text 17.51:1 · textMuted 7.93:1 · accent 9.25:1 · statusDot 9.41:1 · danger 6.26:1
//   LIGHT  text 16.34:1 · textMuted 7.33:1 · accent 5.54:1 · statusDot 4.28:1 · danger 6.30:1
// Body text/accent clear the ≥4.5:1 body floor; statusDot is a decorative dot,
// held to the ≥3:1 non-text floor, which it clears in both palettes.

export const dark: DefaultTheme = {
  color: {
    background: 'oklch(0.15 0.01 260)',
    gradient:
      'radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.25 0.06 280 / 0.5), transparent 70%), oklch(0.15 0.01 260)',
    accent: 'oklch(0.78 0.15 280)',
    glassBg: 'rgba(255, 255, 255, 0.06)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    text: 'oklch(0.96 0 0)',
    textMuted: 'oklch(0.72 0.02 260)',
    statusDot: 'oklch(0.75 0.16 150)',
    danger: 'oklch(0.68 0.19 25)',
  },
  radii: { sm: '8px', md: '12px', lg: '16px' },
  font: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
};

export const light: DefaultTheme = {
  color: {
    background: 'oklch(0.98 0.005 260)',
    gradient:
      'radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.85 0.05 280 / 0.5), transparent 70%), oklch(0.98 0.005 260)',
    accent: 'oklch(0.52 0.18 280)',
    glassBg: 'rgba(0, 0, 0, 0.04)',
    glassBorder: 'rgba(0, 0, 0, 0.1)',
    text: 'oklch(0.22 0.01 260)',
    textMuted: 'oklch(0.44 0.02 260)',
    statusDot: 'oklch(0.55 0.15 150)',
    danger: 'oklch(0.5 0.2 25)',
  },
  radii: { sm: '8px', md: '12px', lg: '16px' },
  font: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
};

export type ThemeMode = 'dark' | 'light';

export const palettes: Record<ThemeMode, DefaultTheme> = { dark, light };
