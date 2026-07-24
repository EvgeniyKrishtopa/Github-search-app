import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadHistory, loadThemeMode, setupStore } from './store';
import { createMatchMedia } from 'testUtils';

beforeEach(() => {
  localStorage.clear();
});

describe('loadThemeMode', () => {
  const original = window.matchMedia;
  // setupTests installs a default (matches: false) stub; restore it afterwards
  // so nothing leaks into later tests.
  afterEach(() => {
    window.matchMedia = original;
  });

  it('prefers a persisted choice over the OS preference', () => {
    localStorage.setItem('theme-mode', 'light');
    window.matchMedia = createMatchMedia(false); // OS reports dark
    expect(loadThemeMode()).toBe('light');
  });

  it('ignores a malformed persisted value and falls through to the OS', () => {
    // OS prefers light: proves the malformed value is rejected and the code
    // re-checks matchMedia, rather than short-circuiting to the 'dark' default
    // (which would pass even for a broken fallthrough).
    localStorage.setItem('theme-mode', 'sepia');
    window.matchMedia = createMatchMedia(true);
    expect(loadThemeMode()).toBe('light');
  });

  it('resolves to dark when no choice is persisted and the OS prefers dark', () => {
    window.matchMedia = createMatchMedia(false);
    expect(loadThemeMode()).toBe('dark');
  });

  it('resolves to light when no choice is persisted and the OS prefers light', () => {
    window.matchMedia = createMatchMedia(true);
    expect(loadThemeMode()).toBe('light');
  });

  it('falls back to dark when matchMedia is unavailable', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    expect(loadThemeMode()).toBe('dark');
  });

  it('falls back to dark when matchMedia throws', () => {
    window.matchMedia = vi.fn(() => {
      throw new Error('blocked');
    }) as unknown as typeof window.matchMedia;
    expect(loadThemeMode()).toBe('dark');
  });
});

describe('loadHistory', () => {
  it('restores { id, query } entries from stored history', () => {
    localStorage.setItem(
      'sessions',
      JSON.stringify([
        { id: 1, query: 'react' },
        { id: 2, query: 'vue' },
      ]),
    );

    expect(loadHistory()).toEqual([
      { id: 1, query: 'react' },
      { id: 2, query: 'vue' },
    ]);
  });

  it('restores queries from a legacy old-shape payload, ignoring extra fields', () => {
    localStorage.setItem(
      'sessions',
      JSON.stringify([
        {
          request: 'react',
          data: [{ id: 9, name: 'react', html_url: 'https://x/react' }],
          opened: true,
          id: 1,
        },
      ]),
    );

    expect(loadHistory()).toEqual([{ id: 1, query: 'react' }]);
  });

  it('returns an empty history when nothing is stored', () => {
    expect(loadHistory()).toEqual([]);
  });

  it('returns an empty history when the stored value is malformed', () => {
    localStorage.setItem('sessions', 'not json');
    expect(loadHistory()).toEqual([]);

    localStorage.setItem('sessions', JSON.stringify({ not: 'an array' }));
    expect(loadHistory()).toEqual([]);
  });

  it('skips entries missing an id or a query/request', () => {
    localStorage.setItem(
      'sessions',
      JSON.stringify([{ id: 1 }, { query: 'x' }, { id: 2, query: 'ok' }, null]),
    );

    expect(loadHistory()).toEqual([{ id: 2, query: 'ok' }]);
  });
});

describe('setupStore hydration', () => {
  it('restores a preloaded history and starts it collapsed', () => {
    const store = setupStore({
      searchHistory: { entries: [{ id: 1, query: 'react' }], openId: null },
    });

    expect(store.getState().searchHistory.entries).toEqual([
      { id: 1, query: 'react' },
    ]);
    expect(store.getState().searchHistory.openId).toBeNull();
  });

  it('is idempotent under repeated initialization, as under React StrictMode', () => {
    localStorage.setItem(
      'sessions',
      JSON.stringify([{ id: 1, query: 'react' }]),
    );

    const first = setupStore({
      searchHistory: { entries: loadHistory(), openId: null },
    });
    const second = setupStore({
      searchHistory: { entries: loadHistory(), openId: null },
    });

    expect(second.getState().searchHistory.entries).toEqual(
      first.getState().searchHistory.entries,
    );
    expect(second.getState().searchHistory.entries).toHaveLength(1);
  });
});
