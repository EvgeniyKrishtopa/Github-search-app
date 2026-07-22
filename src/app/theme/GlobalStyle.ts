import { createGlobalStyle } from 'styled-components';

// Replaces normalize.css + src/styles/common.scss: a minimal reset plus the
// themed body background gradient, base font, and link colors — all from theme
// tokens so both palettes flow through the single ThemeProvider (design D1).
export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
  }

  body {
    min-width: 320px;
    min-height: 100vh;
    font-family: ${({ theme }) => theme.font.sans};
    font-size: 16px;
    line-height: 1.6;
    color: ${({ theme }) => theme.color.text};
    background: ${({ theme }) => theme.color.gradient} fixed;
    -webkit-font-smoothing: antialiased;
  }

  p {
    margin: 0;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  a {
    color: ${({ theme }) => theme.color.accent};
    text-decoration: none;
    transition: opacity 0.2s ease-in-out;
  }

  a:hover {
    opacity: 0.8;
  }
`;
