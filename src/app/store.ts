import { configureStore } from '@reduxjs/toolkit';
import { ISession } from 'typings/interfaces';
import { listenerMiddleware } from './listenerMiddleware';
import { githubApi } from './githubApi';
import searchHistoryReducer from 'features/searchHistory/searchHistorySlice';

// Restore the query-key history from localStorage. Only { id, query } is read;
// any extra fields are ignored, and a legacy pre-rework entry that stored the
// query under `request` (alongside `data`/`opened`) still restores its query.
export const loadHistory = (): Array<ISession> => {
  try {
    const raw = localStorage.getItem('sessions');
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): Array<ISession> => {
      if (item === null || typeof item !== 'object') return [];
      const record = item as Record<string, unknown>;
      const query =
        typeof record.query === 'string'
          ? record.query
          : typeof record.request === 'string'
            ? record.request
            : null;
      if (typeof record.id !== 'number' || query === null) return [];
      return [{ id: record.id, query }];
    });
  } catch {
    return [];
  }
};

export const setupStore = (preloadedState?: {
  searchHistory: ReturnType<typeof searchHistoryReducer>;
}) =>
  configureStore({
    reducer: {
      searchHistory: searchHistoryReducer,
      [githubApi.reducerPath]: githubApi.reducer,
    },
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware()
        .prepend(listenerMiddleware.middleware)
        .concat(githubApi.middleware),
  });

// Restored history starts collapsed — no query fires until the user expands an
// entry, so a page load never triggers a search (design D3/D7).
const store = setupStore({
  searchHistory: { entries: loadHistory(), openId: null },
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export default store;
