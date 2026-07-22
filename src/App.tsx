import React from 'react';
// normalize.css + common.scss stay until Group 6: unmigrated components still
// use the global .container/.row/.warning utility classes until they're ported.
import 'normalize.css';
import 'styles/common.scss';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import store from 'app/store';
import { useAppSelector } from 'app/hooks';
import { selectThemeMode } from 'features/theming/themeSlice';
import { palettes } from 'app/theme/palettes';
import { GlobalStyle } from 'app/theme/GlobalStyle';
import SearchPage from 'pages/SearchPage';
import Header from 'components/Header';

// Sits inside <Provider> so it can read the theme mode from the store, then
// feeds the active palette to every styled component and mounts the themed
// global reset. index.tsx stays unchanged (design D2). Exported so the
// store→provider wiring is testable against a preloaded mode.
export const ThemedApp: React.FC = () => {
  const mode = useAppSelector(selectThemeMode);

  return (
    <ThemeProvider theme={palettes[mode]}>
      <GlobalStyle />
      <Header />
      <SearchPage />
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  );
};

export default App;
