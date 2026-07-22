import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { ISession } from 'typings/interfaces';
import { listenerMiddleware } from './listenerMiddleware';
import { githubApi } from './githubApi';
import searchHistoryReducer from 'features/searchHistory/searchHistorySlice';
import themeReducer from 'features/theming/themeSlice';
import type { ThemeMode } from 'app/theme/palettes';

const THEME_STORAGE_KEY = 'theme-mode';

// Resolve the initial theme in load order: a persisted choice wins; otherwise
// the OS preference via matchMedia; otherwise 'dark'. matchMedia is
// feature-detected (not just window-guarded) because this repo's jsdom test env
// defines window but not window.matchMedia, and store.ts is eagerly imported
// across the suite (design D2). Isolated here so browser-API access lives in one
// place, mirroring loadHistory.
export const loadThemeMode = (): ThemeMode => {
  try {
    const persisted = localStorage.getItem(THEME_STORAGE_KEY);
    if (persisted === 'dark' || persisted === 'light') return persisted;

    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {
      return window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
    }
  } catch {
    // localStorage or matchMedia unavailable/throwing — fall back to dark, so a
    // module-eval-time resolution can never crash the app before it renders.
  }

  return 'dark';
};

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

const rootReducer = combineReducers({
  searchHistory: searchHistoryReducer,
  theme: themeReducer,
  [githubApi.reducerPath]: githubApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

// Partial<RootState> is RTK's documented preloadedState shape for a combined
// reducer: each slice can be omitted (callers preload only what they need)
// without forcing any reducer to accept an undefined preloaded state.
export const setupStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware()
        .prepend(listenerMiddleware.middleware)
        .concat(githubApi.middleware),
  });

// Restored history starts collapsed — no query fires until the user expands an
// entry, so a page load never triggers a search (design D3/D7). Theme mode is
// resolved once here and injected as preloadedState, so there's no flash-then-
// switch on load (design D2).
const store = setupStore({
  searchHistory: { entries: loadHistory(), openId: null },
  theme: { mode: loadThemeMode() },
});

export type AppStore = typeof store;
export type AppDispatch = AppStore['dispatch'];

export default store;
