import { configureStore } from '@reduxjs/toolkit';
import { ISession } from 'typings/interfaces';
import { listenerMiddleware } from './listenerMiddleware';
import { githubApi } from './githubApi';
import reposReducer from './reposSlice';

const loadSessions = (): Array<ISession> => {
  try {
    const raw = localStorage.getItem('sessions');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const setupStore = (preloadedState?: {
  repos: ReturnType<typeof reposReducer>;
}) =>
  configureStore({
    reducer: {
      repos: reposReducer,
      [githubApi.reducerPath]: githubApi.reducer,
    },
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware()
        .prepend(listenerMiddleware.middleware)
        .concat(githubApi.middleware),
  });

const store = setupStore({
  repos: { loading: false, error: null, sessions: loadSessions() },
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export default store;
