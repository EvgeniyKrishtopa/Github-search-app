import { describe, it, expect } from 'vitest';
import repos from './reducers';
import {
  GET_REPOS_STARTED,
  GET_REPOS_SUCCESS,
  GET_REPOS_ERROR,
  GET_SESSIONS_FROM_LOCALSTORAGE,
  CHANGE_SESSION_OPENED_STATUS,
} from '../constants';
import { IState, ISession } from 'typings/interfaces';
import { ReposActionTypes } from 'store/actions/types';

const initialState: IState = { loading: false, sessions: [], error: null };

const buildSuccess = (request: string, id: number): ReposActionTypes => ({
  type: GET_REPOS_SUCCESS,
  loading: false,
  error: null,
  request,
  repos: [{ id, name: request, html_url: `https://github.com/x/${request}` }],
  id,
});

describe('repos reducer: session creation', () => {
  it('creates a session with the request text and results', () => {
    const state = repos(initialState, buildSuccess('react', 1));
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]).toMatchObject({
      request: 'react',
      data: [{ id: 1, name: 'react', html_url: 'https://github.com/x/react' }],
    });
  });

  it('orders the newest session first', () => {
    let state = repos(initialState, buildSuccess('react', 1));
    state = repos(state, buildSuccess('vue', 2));
    expect(state.sessions.map(session => session.request)).toEqual([
      'vue',
      'react',
    ]);
  });
});

describe('repos reducer: history cap', () => {
  it('retains all sessions below the cap', () => {
    let state = initialState;
    for (let id = 1; id <= 3; id += 1) {
      state = repos(state, buildSuccess(`q${id}`, id));
    }
    expect(state.sessions).toHaveLength(3);
  });

  it('caps at 5 sessions, dropping the oldest and keeping the newest', () => {
    let state = initialState;
    for (let id = 1; id <= 6; id += 1) {
      state = repos(state, buildSuccess(`q${id}`, id));
    }
    expect(state.sessions).toHaveLength(5);
    expect(state.sessions.map(session => session.request)).not.toContain('q1');
    expect(state.sessions[0].request).toBe('q6');
  });
});

describe('repos reducer: single-open accordion', () => {
  it('opens a new session and collapses the rest', () => {
    let state = repos(initialState, buildSuccess('react', 1));
    state = repos(state, buildSuccess('vue', 2));
    expect(state.sessions.find(session => session.id === 2)?.opened).toBe(true);
    expect(state.sessions.find(session => session.id === 1)?.opened).toBe(
      false,
    );
  });

  it('expanding a session collapses the others', () => {
    let state = repos(initialState, buildSuccess('react', 1));
    state = repos(state, buildSuccess('vue', 2));
    state = repos(state, { type: CHANGE_SESSION_OPENED_STATUS, activeItem: 1 });
    expect(state.sessions.find(session => session.id === 1)?.opened).toBe(true);
    expect(state.sessions.find(session => session.id === 2)?.opened).toBe(
      false,
    );
  });

  it('collapses the currently open session when toggled', () => {
    let state = repos(initialState, buildSuccess('react', 1));
    state = repos(state, { type: CHANGE_SESSION_OPENED_STATUS, activeItem: 1 });
    expect(state.sessions.find(session => session.id === 1)?.opened).toBe(
      false,
    );
  });
});

describe('repos reducer: hydration from localStorage', () => {
  const saved: Array<ISession> = [
    { request: 'react', data: [], opened: false, id: 1 },
  ];

  it('replaces the session list', () => {
    const state = repos(initialState, {
      type: GET_SESSIONS_FROM_LOCALSTORAGE,
      sessions: saved,
    });
    expect(state.sessions).toEqual(saved);
  });

  it('is idempotent when dispatched twice', () => {
    let state = repos(initialState, {
      type: GET_SESSIONS_FROM_LOCALSTORAGE,
      sessions: saved,
    });
    state = repos(state, {
      type: GET_SESSIONS_FROM_LOCALSTORAGE,
      sessions: saved,
    });
    expect(state.sessions).toEqual(saved);
    expect(state.sessions).toHaveLength(1);
  });
});

describe('repos reducer: known bugs (fixed in migration group 3)', () => {
  // Bug: GET_REPOS_ERROR never sets loading: false. See tasks.md group 3.1.
  it.skip('ends loading when a search fails with an API error', () => {
    let state = repos(initialState, { type: GET_REPOS_STARTED, loading: true });
    state = repos(state, { type: GET_REPOS_ERROR, error: 'Not Found' });
    expect(state.loading).toBe(false);
  });

  // Bug: a stale error is never cleared when a new search starts. See tasks.md group 3.2.
  it.skip('clears a previous error when a new search starts', () => {
    let state = repos(initialState, {
      type: GET_REPOS_ERROR,
      error: 'Not Found',
    });
    state = repos(state, { type: GET_REPOS_STARTED, loading: true });
    expect(state.error).toBeNull();
  });
});
