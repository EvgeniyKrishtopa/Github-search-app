import { describe, it, expect } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders } from 'testUtils';
import Form from './index';

const renderForm = () => renderWithProviders(<Form />);

describe('Form', () => {
  it('adds a session for a non-empty query and clears the input', () => {
    const { store, getByPlaceholderText, container } = renderForm();
    const input = getByPlaceholderText('Get repository') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'react' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(store.getState().searchHistory.entries.map(e => e.query)).toEqual([
      'react',
    ]);
    expect(input.value).toBe('');
  });

  it('adds no session for an empty query and still clears the input', () => {
    const { store, getByPlaceholderText, container } = renderForm();
    const input = getByPlaceholderText('Get repository') as HTMLInputElement;

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(store.getState().searchHistory.entries).toHaveLength(0);
    expect(input.value).toBe('');
  });
});
