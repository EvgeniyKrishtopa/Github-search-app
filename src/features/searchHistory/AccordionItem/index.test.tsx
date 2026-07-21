import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore, AppStore } from 'app/store';
import AccordionItem from './index';

const jsonResponse = (items: Array<Record<string, unknown>>) =>
  new Response(JSON.stringify({ items }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const renderItem = (
  props: { id: number; query: string; isOpen: boolean },
  store: AppStore = setupStore(),
) =>
  render(
    <Provider store={store}>
      <AccordionItem {...props} />
    </Provider>,
  );

describe('AccordionItem', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not fetch while collapsed', () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse([])));
    vi.stubGlobal('fetch', fetchMock);

    renderItem({ id: 1, query: 'react', isOpen: false });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows a loader while the open search is in flight', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );

    const { container } = renderItem({ id: 1, query: 'react', isOpen: true });

    expect(container.querySelector('.page-center')).not.toBeNull();
  });

  it("isolates an error to the failing session, not a sibling that succeeds", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: Request) => {
        const q = new URL(input.url).searchParams.get('q');
        if (q === 'boom') {
          return Promise.reject(new Error('offline'));
        }
        return Promise.resolve(
          jsonResponse([
            { id: 1, name: 'react', html_url: 'https://github.com/x/react' },
          ]),
        );
      }),
    );

    const { getByText, queryAllByText } = render(
      <Provider store={setupStore()}>
        <AccordionItem id={1} query="facebook" isOpen />
        <AccordionItem id={2} query="boom" isOpen />
      </Provider>,
    );

    await waitFor(() => {
      expect(queryAllByText(/Couldn.t load repositories/)).toHaveLength(1);
    });
    // The succeeding sibling still renders its result, uncontaminated. Its
    // header reads "facebook", so the "react" match is the repo link alone.
    expect(getByText('react')).toBeInTheDocument();
  });

  it('fetches when open and links each repository name to its GitHub URL', async () => {
    const items = [
      { id: 1, name: 'react', html_url: 'https://github.com/facebook/react' },
      { id: 2, name: 'redux', html_url: 'https://github.com/reduxjs/redux' },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse(items))),
    );

    const { getByText } = renderItem({ id: 1, query: 'facebook', isOpen: true });

    await waitFor(() => {
      expect(getByText('react').closest('a')).toHaveAttribute(
        'href',
        'https://github.com/facebook/react',
      );
    });
    expect(getByText('redux').closest('a')).toHaveAttribute(
      'href',
      'https://github.com/reduxjs/redux',
    );
  });

  it('shows the empty message when the open search returns no repositories', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse([]))),
    );

    const { getByText } = renderItem({ id: 1, query: 'react', isOpen: true });

    await waitFor(() => {
      expect(
        getByText('This request does not have any repos!'),
      ).toBeInTheDocument();
    });
  });

  it('shows an error message when the open search returns a non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('nope', { status: 500 }))),
    );

    const { getByText } = renderItem({ id: 1, query: 'react', isOpen: true });

    await waitFor(() => {
      expect(getByText(/Couldn.t load repositories/)).toBeInTheDocument();
    });
  });

  it('shows an error message when the open search rejects (offline)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );

    const { getByText } = renderItem({ id: 1, query: 'react', isOpen: true });

    await waitFor(() => {
      expect(getByText(/Couldn.t load repositories/)).toBeInTheDocument();
    });
  });

  it('toggles the session open state when the header button is clicked', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse([]))),
    );
    const store = setupStore({
      searchHistory: { entries: [{ id: 1, query: 'react' }], openId: null },
    });

    const { container } = renderItem(
      { id: 1, query: 'react', isOpen: false },
      store,
    );
    fireEvent.click(container.querySelector('button') as HTMLButtonElement);

    expect(store.getState().searchHistory.openId).toBe(1);
  });

  it('does not refetch when re-expanding the same session within the cache window', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse([])));
    vi.stubGlobal('fetch', fetchMock);
    const store = setupStore();

    const open = (isOpen: boolean) => (
      <Provider store={store}>
        <AccordionItem id={1} query="react" isOpen={isOpen} />
      </Provider>
    );
    const { rerender } = render(open(true));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    // Collapse (unsubscribe) then re-expand (re-subscribe) — served from cache.
    rerender(open(false));
    rerender(open(true));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
