import { createListenerMiddleware } from '@reduxjs/toolkit';
import { addSession } from 'features/searchHistory/searchHistorySlice';
import { toggleTheme } from 'features/theming/themeSlice';
import type { RootState } from './store';

export const listenerMiddleware = createListenerMiddleware();

// Persist only when the log itself changes (a session is added) — never on an
// accordion toggle, since `openId` is ephemeral UI state. Only the queries are
// written; results are re-fetched live on expand.
listenerMiddleware.startListening({
  actionCreator: addSession,
  effect: (_action, listenerApi) => {
    const { entries } = (listenerApi.getState() as RootState).searchHistory;
    localStorage.setItem('sessions', JSON.stringify(entries));
  },
});

// Persist the theme choice under its own key on every toggle, independent of
// the search-history rule above (design D2). The key is distinct so theme
// persistence never disturbs stored search history.
listenerMiddleware.startListening({
  actionCreator: toggleTheme,
  effect: (_action, listenerApi) => {
    const { mode } = (listenerApi.getState() as RootState).theme;
    localStorage.setItem('theme-mode', mode);
  },
});
