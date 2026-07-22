import React from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { selectThemeMode, toggleTheme } from 'features/theming/themeSlice';

const ToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: ${({ theme }) => theme.color.text};
  background: ${({ theme }) => theme.color.glassBg};
  border: 1px solid ${({ theme }) => theme.color.glassBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  transition:
    border-color 0.2s ease-in-out,
    opacity 0.2s ease-in-out;

  &:hover {
    border-color: ${({ theme }) => theme.color.accent};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent};
    outline-offset: 2px;
  }
`;

// Connected: owns no local state, reads mode from the store and dispatches the
// single toggleTheme action (design D3). Header stays dumb by composing this.
const ThemeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectThemeMode);
  const isLight = mode === 'light';

  return (
    <ToggleButton
      type="button"
      aria-pressed={isLight}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      onClick={() => dispatch(toggleTheme())}
    >
      <span aria-hidden="true">{isLight ? '☀' : '🌙'}</span>
    </ToggleButton>
  );
};

export default ThemeToggle;
