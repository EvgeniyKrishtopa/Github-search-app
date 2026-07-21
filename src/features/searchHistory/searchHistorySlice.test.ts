import { describe, it, expect } from 'vitest';
import reducer, { addSession, toggleSession } from './searchHistorySlice';
import { SearchHistoryState } from 'typings/interfaces';

const initial: SearchHistoryState = { entries: [], openId: null };

// Build an addSession action with an explicit id, bypassing the `prepare`
// Date.now() so multi-entry ordering/cap tests are deterministic.
const add = (id: number, query: string) => ({
  type: addSession.type,
  payload: { id, query },
});

describe('searchHistory: addSession', () => {
  it('records a session with only the query, newest-first', () => {
    let state = reducer(initial, add(1, 'react'));
    state = reducer(state, add(2, 'vue'));
    expect(state.entries).toEqual([
      { id: 2, query: 'vue' },
      { id: 1, query: 'react' },
    ]);
  });

  it('assigns the id inside the reducer from the dispatched query', () => {
    const state = reducer(initial, addSession('react'));
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0].query).toBe('react');
    expect(typeof state.entries[0].id).toBe('number');
    // No results are stored on the entry.
    expect(Object.keys(state.entries[0]).sort()).toEqual(['id', 'query']);
  });

  it('opens the newly created session', () => {
    const state = reducer(initial, add(1, 'react'));
    expect(state.openId).toBe(1);
  });

  it('opens the new session, overriding a previously open one', () => {
    const state = reducer(
      { entries: [{ id: 1, query: 'react' }], openId: 1 },
      add(2, 'vue'),
    );
    expect(state.openId).toBe(2);
  });
});

describe('searchHistory: history cap', () => {
  it('retains all sessions below the cap', () => {
    let state = initial;
    for (let id = 1; id <= 3; id += 1) {
      state = reducer(state, add(id, `q${id}`));
    }
    expect(state.entries).toHaveLength(3);
  });

  it('caps at 5, dropping the oldest and keeping the newest', () => {
    let state = initial;
    for (let id = 1; id <= 6; id += 1) {
      state = reducer(state, add(id, `q${id}`));
    }
    expect(state.entries).toHaveLength(5);
    expect(state.entries.map(e => e.query)).not.toContain('q1');
    expect(state.entries[0].query).toBe('q6');
  });
});

describe('searchHistory: single-open toggle', () => {
  const twoSessions: SearchHistoryState = {
    entries: [
      { id: 1, query: 'react' },
      { id: 2, query: 'vue' },
    ],
    openId: null,
  };

  it('opens a collapsed session', () => {
    const state = reducer(twoSessions, toggleSession(1));
    expect(state.openId).toBe(1);
  });

  it('collapses the currently open session when toggled again', () => {
    const state = reducer({ ...twoSessions, openId: 1 }, toggleSession(1));
    expect(state.openId).toBeNull();
  });

  it('keeps at most one session open when switching', () => {
    const state = reducer({ ...twoSessions, openId: 1 }, toggleSession(2));
    expect(state.openId).toBe(2);
  });
});
