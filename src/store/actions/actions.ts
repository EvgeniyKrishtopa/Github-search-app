import { ThunkAction } from 'redux-thunk';
import { ISession } from 'typings/interfaces';
import { RootState } from 'store/reducers';
import { ReposActionTypes } from './types';

import {
  GET_REPOS_STARTED,
  GET_REPOS_SUCCESS,
  GET_REPOS_ERROR,
  GET_SESSIONS_FROM_LOCALSTORAGE,
  CHANGE_SESSION_OPENED_STATUS,
} from '../constants';

type ThunkType = ThunkAction<void, RootState, unknown, ReposActionTypes>;

const getReposStarted = (): ReposActionTypes => {
  return {
    type: GET_REPOS_STARTED,
    loading: true,
  };
};

const getReposSuccess = (
  response: Array<any>,
  repository: string,
): ReposActionTypes => {
  return {
    type: GET_REPOS_SUCCESS,
    loading: false,
    error: null,
    request: repository,
    repos: response,
    id: Date.now(),
  };
};

const getReposError = (error: string): ReposActionTypes => {
  return {
    type: GET_REPOS_ERROR,
    error,
  };
};

export const FetchRepos = (repository: string): ThunkType => {
  return dispatch => {
    dispatch(getReposStarted());

    fetch(
      `https://api.github.com/search/repositories?q=${repository}?&per_page=8`,
    ).then(response => {
      if (response.ok) {
        response.json().then(response => {
          dispatch(getReposSuccess(response.items, repository));
        });
      } else {
        dispatch(getReposError(response.statusText));
      }
    });
  };
};

export const GetSessions = (sessions: Array<ISession>): ReposActionTypes => {
  return {
    type: GET_SESSIONS_FROM_LOCALSTORAGE,
    sessions,
  };
};

export const ChangeSessionOpenedStatus = (
  activeItem: number,
): ReposActionTypes => {
  return {
    type: CHANGE_SESSION_OPENED_STATUS,
    activeItem,
  };
};
