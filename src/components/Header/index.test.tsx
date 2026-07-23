import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from 'testUtils';
import Header from './index';

describe('Header', () => {
  it('renders the brand label and version tag', () => {
    renderWithProviders(<Header />);

    expect(screen.getByText('Repo Search')).toBeInTheDocument();
    expect(screen.getByText('v2.0')).toBeInTheDocument();
  });

  it('composes the theme toggle as an accessible control', () => {
    // Default test mode is dark (setupTests stubs matchMedia → matches:false),
    // so the toggle offers switching to light.
    renderWithProviders(<Header />);

    expect(
      screen.getByRole('button', { name: /switch to light theme/i }),
    ).toBeInTheDocument();
  });
});
