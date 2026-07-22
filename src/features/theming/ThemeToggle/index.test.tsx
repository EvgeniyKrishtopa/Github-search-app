import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import ThemeToggle from './index';
import { setupStore, type AppStore } from 'app/store';
import { palettes, type ThemeMode } from 'app/theme/palettes';

const renderToggle = (mode: ThemeMode): AppStore => {
  const store = setupStore({ theme: { mode } });
  render(
    <Provider store={store}>
      <ThemeProvider theme={palettes[mode]}>
        <ThemeToggle />
      </ThemeProvider>
    </Provider>,
  );
  return store;
};

describe('ThemeToggle', () => {
  it('renders an accessible control reflecting the dark state', () => {
    renderToggle('dark');

    const button = screen.getByRole('button', {
      name: /switch to light theme/i,
    });
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders an accessible control reflecting the light state', () => {
    renderToggle('light');

    const button = screen.getByRole('button', {
      name: /switch to dark theme/i,
    });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('dispatches a toggle and reflects the new state on click', async () => {
    const user = userEvent.setup();
    const store = renderToggle('dark');

    await user.click(
      screen.getByRole('button', { name: /switch to light theme/i }),
    );

    expect(store.getState().theme.mode).toBe('light');
    expect(
      screen.getByRole('button', { name: /switch to dark theme/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
