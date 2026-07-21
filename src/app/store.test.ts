import { describe, it, expect, beforeEach } from 'vitest';
import { loadHistory, setupStore } from './store';

beforeEach(() => {
  localStorage.clear();
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
