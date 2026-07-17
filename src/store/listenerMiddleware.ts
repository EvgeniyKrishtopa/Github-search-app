import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { changeSessionOpenedStatus, fetchRepos } from './reposSlice';
import type { RootState } from './store';

export const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  matcher: isAnyOf(fetchRepos.fulfilled, changeSessionOpenedStatus),
  effect: (_action, listenerApi) => {
    const { sessions } = (listenerApi.getState() as RootState).repos;
    localStorage.setItem('sessions', JSON.stringify(sessions));
  },
});
