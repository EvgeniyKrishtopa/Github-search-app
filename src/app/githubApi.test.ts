import { describe, it, expect, vi, afterEach } from 'vitest';
import { githubApi } from './githubApi';
import { setupStore } from './store';

const jsonResponse = (items: Array<unknown>) =>
  new Response(JSON.stringify({ items }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const requestedUrl = (fetchMock: ReturnType<typeof vi.fn>, call = 0) =>
  new URL((fetchMock.mock.calls[call][0] as Request).url);

describe('githubApi searchRepos endpoint', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('transforms the response into its items array on success', async () => {
    const items = [{ id: 1, name: 'react', html_url: 'https://x/react' }];
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse(items))),
    );
    const store = setupStore();

    const result = await store.dispatch(
      githubApi.endpoints.searchRepos.initiate({ id: 1, q: 'react' }),
    );

    expect(result.data).toEqual(items);
  });

  it('requests a bounded page size of 8', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse([])));
    vi.stubGlobal('fetch', fetchMock);
    const store = setupStore();

    await store.dispatch(
      githubApi.endpoints.searchRepos.initiate({ id: 1, q: 'react' }),
    );

    const url = requestedUrl(fetchMock);
    expect(url.origin).toBe('https://api.github.com');
    expect(url.pathname).toBe('/search/repositories');
    expect(url.searchParams.get('per_page')).toBe('8');
  });

  it('URL-encodes the query so reserved characters stay a search term', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse([])));
    vi.stubGlobal('fetch', fetchMock);
    const store = setupStore();

    await store.dispatch(
      githubApi.endpoints.searchRepos.initiate({
        id: 1,
        q: 'foo&per_page=100',
      }),
    );

    const url = requestedUrl(fetchMock);
    expect(url.searchParams.get('q')).toBe('foo&per_page=100');
    expect(url.searchParams.get('per_page')).toBe('8');
  });

  it('keys the cache per session id: same query text but different ids each fetch, a repeated id does not', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse([])));
    vi.stubGlobal('fetch', fetchMock);
    const store = setupStore();

    // Same (id, q) twice → one cache entry, one request (dedup).
    await store.dispatch(
      githubApi.endpoints.searchRepos.initiate({ id: 1, q: 'react' }),
    );
    await store.dispatch(
      githubApi.endpoints.searchRepos.initiate({ id: 1, q: 'react' }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Same text, different id → distinct cache entry → a fresh request.
    await store.dispatch(
      githubApi.endpoints.searchRepos.initiate({ id: 2, q: 'react' }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
