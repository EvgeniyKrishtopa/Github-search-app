import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { setupStore } from 'app/store';
import { renderWithProviders } from 'testUtils';
import SearchPage from './index';

const jsonResponse = (items: Array<Record<string, unknown>>) =>
  new Response(JSON.stringify({ items }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

describe('SearchPage integration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('searches, shows live results in the opened session, and serves cache on re-expand', async () => {
    const items = [
      { id: 1, name: 'react', html_url: 'https://github.com/facebook/react' },
    ];
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(items)));
    vi.stubGlobal('fetch', fetchMock);
    const store = setupStore();

    const { getByPlaceholderText, getByText, container } = renderWithProviders(
      <SearchPage />,
      { store },
    );

    // Submit a search — a session is created, opened, and fetches live.
    const input = getByPlaceholderText('Get repository') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'facebook' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => {
      expect(getByText('react').closest('a')).toHaveAttribute(
        'href',
        'https://github.com/facebook/react',
      );
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.getState().searchHistory.entries).toHaveLength(1);
    expect(container.querySelector('.isOpen')).not.toBeNull();

    // buttons: [0] the form's submit, [1] the accordion toggle.
    const toggle = () =>
      fireEvent.click(container.querySelectorAll('button')[1]);

    // Collapse the session, then re-expand it within the cache window.
    toggle();
    await waitFor(() =>
      expect(container.querySelector('.isOpen')).toBeNull(),
    );
    toggle();
    await waitFor(() =>
      expect(container.querySelector('.isOpen')).not.toBeNull(),
    );

    // Re-expanding served from cache — no second request was issued.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getByText('react').closest('a')).toHaveAttribute(
      'href',
      'https://github.com/facebook/react',
    );
  });
});
