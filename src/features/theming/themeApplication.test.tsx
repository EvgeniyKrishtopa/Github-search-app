import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import styled, { ThemeProvider } from 'styled-components';
import { palettes, type ThemeMode } from 'app/theme/palettes';

// A token-dependent styled component: it surfaces the resolved accent token as a
// data attribute (via attrs, which receives the active theme), so the palette a
// component actually renders with is directly assertable through the provider —
// exercising the "Dark/Light theme applied" spec scenarios, not just the slice.
const Swatch = styled.div.attrs<{ 'data-accent'?: string }>(({ theme }) => ({
  'data-accent': theme.color.accent,
}))``;

const renderSwatch = (mode: ThemeMode) =>
  render(
    <ThemeProvider theme={palettes[mode]}>
      <Swatch data-testid="swatch" />
    </ThemeProvider>,
  );

describe('theme application', () => {
  it('renders the dark palette accent under the dark theme', () => {
    renderSwatch('dark');
    expect(screen.getByTestId('swatch')).toHaveAttribute(
      'data-accent',
      palettes.dark.color.accent,
    );
  });

  it('renders the light palette accent under the light theme', () => {
    renderSwatch('light');
    expect(screen.getByTestId('swatch')).toHaveAttribute(
      'data-accent',
      palettes.light.color.accent,
    );
  });

  it('resolves a different accent for each theme', () => {
    expect(palettes.dark.color.accent).not.toBe(palettes.light.color.accent);
  });
});
