import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { setupStore, type AppStore, type RootState } from 'app/store';
import { palettes } from 'app/theme/palettes';

// Shared MediaQueryList stub: jsdom doesn't implement window.matchMedia, so both
// setupTests.ts (default stub) and tests that drive the prefers-color-scheme
// branch build one from here — a single mock shape, not two copies to keep in
// sync. Every query reports the given `matches`.
export const createMatchMedia = (matches: boolean): typeof window.matchMedia =>
  vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;

interface ProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: AppStore;
  preloadedState?: Partial<RootState>;
}

// Renders a component inside the same two providers the real app mounts: the
// Redux store and the styled-components ThemeProvider fed the active palette.
// Every styled component reads `theme`, so component tests need both — this is
// the single wrapper they share instead of re-declaring it per file. The palette
// follows the store's theme mode, so a preloaded `theme.mode` is honored.
export const renderWithProviders = (
  ui: ReactElement,
  {
    preloadedState,
    store = setupStore(preloadedState),
    ...options
  }: ProvidersOptions = {},
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <ThemeProvider theme={palettes[store.getState().theme.mode]}>
        {children}
      </ThemeProvider>
    </Provider>
  );

  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
};
