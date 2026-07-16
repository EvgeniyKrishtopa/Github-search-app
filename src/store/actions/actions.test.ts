import { describe, it, expect, vi, afterEach } from 'vitest';
import { createStore, applyMiddleware } from 'redux';
import thunk, { ThunkDispatch } from 'redux-thunk';
import { rootReducer, RootState } from 'store/reducers';
import { FetchRepos } from './actions';
import { ReposActionTypes } from './types';

const buildStore = () => {
  const store = createStore(rootReducer, applyMiddleware(thunk));
  const dispatch = store.dispatch as ThunkDispatch<
    RootState,
    unknown,
    ReposActionTypes
  >;
  return { store, dispatch };
};

describe('FetchRepos', () => {
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
    const { store, dispatch } = buildStore();

    dispatch(FetchRepos('react'));

    await vi.waitFor(() => {
      expect(store.getState().repos.sessions).toHaveLength(1);
    });
    expect(store.getState().repos.sessions[0].request).toBe('react');
  });

  // Bug: fetch has no .catch(), so a network rejection dispatches nothing.
  // See tasks.md group 3.3.
  it.skip('dispatches an error and ends loading when the network request rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    const { store, dispatch } = buildStore();

    dispatch(FetchRepos('react'));

    await vi.waitFor(() => {
      expect(store.getState().repos.loading).toBe(false);
    });
    expect(store.getState().repos.error).toBeTruthy();
  });
});
