import { describe, it, expect } from 'vitest';
import reducer, {
  toggleTheme,
  selectThemeMode,
  type ThemeState,
} from './themeSlice';
import type { RootState } from 'app/store';

describe('themeSlice', () => {
  it('defaults to dark mode', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ mode: 'dark' });
  });

  it('toggles dark → light', () => {
    const next = reducer({ mode: 'dark' }, toggleTheme());
    expect(next).toEqual({ mode: 'light' });
  });

  it('toggles light → dark', () => {
    const next = reducer({ mode: 'light' }, toggleTheme());
    expect(next).toEqual({ mode: 'dark' });
  });
});

describe('selectThemeMode', () => {
  it('reads the mode from state', () => {
    const state = { theme: { mode: 'light' } as ThemeState } as RootState;
    expect(selectThemeMode(state)).toBe('light');
  });
});
