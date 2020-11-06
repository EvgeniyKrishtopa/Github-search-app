import {
  GET_REPOS_STARTED,
  GET_REPOS_SUCCESS,
  GET_REPOS_ERROR,
  GET_SESSIONS_FROM_LOCALSTORAGE,
  CHANGE_SESSION_OPENED_STATUS,
} from 'store/constants';
import { ISession } from 'typings/interfaces';

interface IGetReposStarted {
  type: typeof GET_REPOS_STARTED;
  loading: boolean;
}

interface IGetReposSuccess {
  type: typeof GET_REPOS_SUCCESS;
  loading: boolean;
  error: null;
  request: string;
  repos: Array<any>;
  id: number;
}

interface IGetReposError {
  type: typeof GET_REPOS_ERROR;
  error: string;
}

interface IGetSessions {
  type: typeof GET_SESSIONS_FROM_LOCALSTORAGE;
  sessions: Array<ISession>;
}

interface IChangeSessionOpenedStatus {
  type: typeof CHANGE_SESSION_OPENED_STATUS;
  activeItem: number;
}

export type ReposActionTypes =
  | IGetReposStarted
  | IGetReposSuccess
  | IGetReposError
  | IGetSessions
  | IChangeSessionOpenedStatus;
