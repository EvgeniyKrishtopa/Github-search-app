import { describe, it, expect, vi, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { setupStore } from 'app/store';
import { renderWithProviders } from 'testUtils';
import ListRequests from './index';

describe('ListRequests', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing when there is no history', () => {
    const { container } = renderWithProviders(<ListRequests />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders one accordion per session, expands only the openId session, and fetches only that one', async () => {
    // The open session subscribes; keep its request pending so it just loads.
    const fetchMock = vi.fn((_input: Request) => new Promise(() => undefined));
    vi.stubGlobal('fetch', fetchMock);
    const store = setupStore({
      searchHistory: {
        entries: [
          { id: 1, query: 'react' },
          { id: 2, query: 'vue' },
        ],
        openId: 2,
      },
    });

    const { getByText, container } = renderWithProviders(<ListRequests />, {
      store,
    });

    expect(getByText('react')).toBeInTheDocument();
    expect(getByText('vue')).toBeInTheDocument();
    // Single-open: exactly one item carries the global `isOpen` class.
    expect(container.querySelectorAll('.isOpen')).toHaveLength(1);
    // Only the expanded session issues a request; the collapsed one does not.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(new URL(fetchMock.mock.calls[0][0].url).searchParams.get('q')).toBe(
      'vue',
    );
  });
});
