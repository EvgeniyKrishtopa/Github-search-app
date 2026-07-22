import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import type { ComponentProps } from 'react';
import type { DefaultTheme } from 'styled-components';
import App, { ThemedApp } from './App';
import store, { setupStore } from 'app/store';
import { palettes, type ThemeMode } from 'app/theme/palettes';

// styled-components injects styles into a detached CSSOM sheet under jsdom, so
// the applied palette isn't readable from the DOM. Instead, wrap the real
// ThemeProvider to capture the theme ThemedApp hands it — this is the exact
// store→palette link (theme={palettes[mode]}) that no other test covers, and a
// regression to a hardcoded palette would be caught here. The real provider
// still renders, so GlobalStyle and the tree below get proper theme context.
const { capturedThemes } = vi.hoisted(() => ({
  capturedThemes: [] as DefaultTheme[],
}));

vi.mock('styled-components', async importOriginal => {
  const actual = await importOriginal<typeof import('styled-components')>();
  return {
    ...actual,
    ThemeProvider: (props: ComponentProps<typeof actual.ThemeProvider>) => {
      if (props.theme) capturedThemes.push(props.theme as DefaultTheme);
      return <actual.ThemeProvider {...props} />;
    },
  };
});

const renderThemedApp = (mode: ThemeMode) =>
  render(
    <Provider
      store={setupStore({
        theme: { mode },
        searchHistory: { entries: [], openId: null },
      })}
    >
      <ThemedApp />
    </Provider>,
  );

beforeEach(() => {
  capturedThemes.length = 0;
});

describe('ThemedApp', () => {
  it('renders the app tree and selects the dark palette from the store mode', () => {
    renderThemedApp('dark');

    // The app actually rendered (Form input present), not just the provider.
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(capturedThemes).toContain(palettes.dark);
    expect(capturedThemes).not.toContain(palettes.light);
  });

  it('selects the light palette when the store mode is light', () => {
    renderThemedApp('light');

    expect(capturedThemes).toContain(palettes.light);
    expect(capturedThemes).not.toContain(palettes.dark);
  });

  it('mounts the default App with the singleton store and a resolved palette', () => {
    render(<App />);

    // The default export wires the real singleton store; it renders the tree and
    // hands ThemeProvider a palette resolved from the store's hydrated mode.
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(capturedThemes).toContain(palettes[store.getState().theme.mode]);
  });
});
