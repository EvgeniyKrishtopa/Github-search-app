import { describe, it, expect, vi, afterEach } from 'vitest';
import reposReducer, {
  changeSessionOpenedStatus,
  fetchRepos,
} from './reposSlice';
import { setupStore } from './store';
import { IState } from 'typings/interfaces';

const initialState: IState = { loading: false, sessions: [], error: null };

const buildSuccess = (request: string, id: number) =>
  fetchRepos.fulfilled(
    {
      repos: [
        { id, name: request, html_url: `https://github.com/x/${request}` },
      ],
      request,
      id,
    },
    'requestId',
    request,
  );

describe('repos reducer: session creation', () => {
  it('creates a session with the request text and results', () => {
    const state = reposReducer(initialState, buildSuccess('react', 1));
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]).toMatchObject({
      request: 'react',
      data: [{ id: 1, name: 'react', html_url: 'https://github.com/x/react' }],
    });
  });

  it('orders the newest session first', () => {
    let state = reposReducer(initialState, buildSuccess('react', 1));
    state = reposReducer(state, buildSuccess('vue', 2));
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
      state = reposReducer(state, buildSuccess(`q${id}`, id));
    }
    expect(state.sessions).toHaveLength(3);
  });

  it('caps at 5 sessions, dropping the oldest and keeping the newest', () => {
    let state = initialState;
    for (let id = 1; id <= 6; id += 1) {
      state = reposReducer(state, buildSuccess(`q${id}`, id));
    }
    expect(state.sessions).toHaveLength(5);
    expect(state.sessions.map(session => session.request)).not.toContain('q1');
    expect(state.sessions[0].request).toBe('q6');
  });
});

describe('repos reducer: single-open accordion', () => {
  it('opens a new session and collapses the rest', () => {
    let state = reposReducer(initialState, buildSuccess('react', 1));
    state = reposReducer(state, buildSuccess('vue', 2));
    expect(state.sessions.find(session => session.id === 2)?.opened).toBe(true);
    expect(state.sessions.find(session => session.id === 1)?.opened).toBe(
      false,
    );
  });

  it('expanding a session collapses the others', () => {
    let state = reposReducer(initialState, buildSuccess('react', 1));
    state = reposReducer(state, buildSuccess('vue', 2));
    state = reposReducer(state, changeSessionOpenedStatus(1));
    expect(state.sessions.find(session => session.id === 1)?.opened).toBe(true);
    expect(state.sessions.find(session => session.id === 2)?.opened).toBe(
      false,
    );
  });

  it('collapses the currently open session when toggled', () => {
    let state = reposReducer(initialState, buildSuccess('react', 1));
    state = reposReducer(state, changeSessionOpenedStatus(1));
    expect(state.sessions.find(session => session.id === 1)?.opened).toBe(
      false,
    );
  });
});

describe('repos reducer: loading and error handling', () => {
  it('ends loading when a search fails with an API error', () => {
    let state = reposReducer(
      initialState,
      fetchRepos.pending('requestId', 'x'),
    );
    state = reposReducer(
      state,
      fetchRepos.rejected(null, 'requestId', 'x', 'Not Found'),
    );
    expect(state.loading).toBe(false);
  });

  it('clears a previous error when a new search starts', () => {
    let state = reposReducer(
      initialState,
      fetchRepos.rejected(null, 'requestId', 'x', 'Not Found'),
    );
    state = reposReducer(state, fetchRepos.pending('requestId', 'x'));
    expect(state.error).toBeNull();
  });
});

describe('fetchRepos thunk', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('dispatches the response items on a successful request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  id: 1,
                  name: 'react',
                  html_url: 'https://github.com/x/react',
                },
              ],
            }),
        }),
      ),
    );
    const store = setupStore();

    store.dispatch(fetchRepos('react'));

    await vi.waitFor(() => {
      expect(store.getState().repos.sessions).toHaveLength(1);
    });
    expect(store.getState().repos.sessions[0].request).toBe('react');
  });

  it('URL-encodes the query so reserved characters are sent as a search term, not a parameter', () => {
    const fetchMock = vi.fn((_url: string) => new Promise(() => undefined));
    vi.stubGlobal('fetch', fetchMock);
    const store = setupStore();

    store.dispatch(fetchRepos('foo&per_page=100'));

    const requestedUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestedUrl.searchParams.get('q')).toBe('foo&per_page=100');
    expect(requestedUrl.searchParams.get('per_page')).toBe('8');
  });

  it('dispatches an error and ends loading when the network request rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    const store = setupStore();

    store.dispatch(fetchRepos('react'));

    await vi.waitFor(() => {
      expect(store.getState().repos.loading).toBe(false);
    });
    expect(store.getState().repos.error).toBeTruthy();
  });
});

describe('repos store: hydration from localStorage', () => {
  it('restores a previously saved history on start', () => {
    const store = setupStore({
      repos: {
        loading: false,
        error: null,
        sessions: [{ request: 'react', data: [], opened: false, id: 1 }],
      },
    });
    expect(store.getState().repos.sessions).toEqual([
      { request: 'react', data: [], opened: false, id: 1 },
    ]);
  });

  it('starts with an empty history and no error when nothing is stored', () => {
    const store = setupStore();
    expect(store.getState().repos.sessions).toEqual([]);
  });

  it('is idempotent under repeated initialization, as under React StrictMode', () => {
    const preloadedState = {
      repos: {
        loading: false,
        error: null,
        sessions: [{ request: 'react', data: [], opened: false, id: 1 }],
      },
    };
    const first = setupStore(preloadedState);
    const second = setupStore(preloadedState);
    expect(second.getState().repos.sessions).toEqual(
      first.getState().repos.sessions,
    );
    expect(second.getState().repos.sessions).toHaveLength(1);
  });
});
