import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from 'store/store';
import Form from './index';

const renderForm = () => {
  const store = setupStore();
  return render(
    <Provider store={store}>
      <Form />
    </Provider>,
  );
};

describe('Form', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('issues a fetch for a non-empty query and clears the input', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
    const { getByPlaceholderText, container } = renderForm();
    const input = getByPlaceholderText('Get repository') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'react' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('react'));
    expect(input.value).toBe('');
  });

  it('issues no fetch for an empty query and still clears the input', () => {
    vi.stubGlobal('fetch', vi.fn());
    const { getByPlaceholderText, container } = renderForm();
    const input = getByPlaceholderText('Get repository') as HTMLInputElement;

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(fetch).not.toHaveBeenCalled();
    expect(input.value).toBe('');
  });
});
