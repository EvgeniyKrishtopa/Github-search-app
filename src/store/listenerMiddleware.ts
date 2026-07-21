import { createListenerMiddleware } from '@reduxjs/toolkit';
import { addSession } from './searchHistorySlice';
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
