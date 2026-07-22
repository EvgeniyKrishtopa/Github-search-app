import { describe, it, expect, beforeEach } from 'vitest';
import { setupStore } from './store';
import { addSession, toggleSession } from 'features/searchHistory/searchHistorySlice';
import { toggleTheme } from 'features/theming/themeSlice';

beforeEach(() => {
  localStorage.clear();
});

describe('history persistence (listenerMiddleware)', () => {
  it('writes the queries to localStorage when a session is added', () => {
    const store = setupStore();

    store.dispatch(addSession('react'));

    const stored = JSON.parse(localStorage.getItem('sessions') ?? 'null');
    expect(stored).toHaveLength(1);
    expect(stored[0].query).toBe('react');
    // Only { id, query } is persisted — no repository results.
    expect(Object.keys(stored[0]).sort()).toEqual(['id', 'query']);
  });

  it('does not write to localStorage on an accordion toggle', () => {
    const store = setupStore({
      searchHistory: { entries: [{ id: 1, query: 'react' }], openId: null },
    });

    store.dispatch(toggleSession(1));

    expect(localStorage.getItem('sessions')).toBeNull();
  });
});

describe('theme persistence (listenerMiddleware)', () => {
  it('writes the mode to its own theme-mode key on toggle', () => {
    const store = setupStore({ theme: { mode: 'dark' } });

    store.dispatch(toggleTheme());

    expect(localStorage.getItem('theme-mode')).toBe('light');
  });

  it('leaves persisted search history untouched when the theme toggles', () => {
    const store = setupStore({ theme: { mode: 'dark' } });
    store.dispatch(addSession('react'));
    const historyBefore = localStorage.getItem('sessions');

    store.dispatch(toggleTheme());

    expect(localStorage.getItem('sessions')).toBe(historyBefore);
    expect(localStorage.getItem('theme-mode')).toBe('light');
  });
});
