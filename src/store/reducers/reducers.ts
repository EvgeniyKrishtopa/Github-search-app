import {
  GET_REPOS_STARTED,
  GET_REPOS_SUCCESS,
  GET_REPOS_ERROR,
  GET_SESSIONS_FROM_LOCALSTORAGE,
  CHANGE_SESSION_OPENED_STATUS,
} from '../constants';
import { ISession, IState } from 'typings/interfaces';
import { ReposActionTypes } from 'store/actions/types';

const initialState: IState = {
  loading: false,
  sessions: [],
  error: null,
};

const sessionCreator = (
  sessions: Array<ISession>,
  newSession: Array<any>,
  request: string,
  id: number,
): Array<ISession> => {
  if (sessions.length >= 5) {
    return [
      { request, data: newSession, opened: true, id },
      ...sessions.slice(0, 4).map(item => {
        item.opened = false;
        return item;
      }),
    ];
  }

  return [
    { request, data: newSession, opened: true, id },
    ...sessions.map(item => {
      item.opened = false;
      return item;
    }),
  ];
};

const sessionActiveHandler = (
  sessions: Array<ISession>,
  activeItem: number,
): Array<ISession> => {
  return [
    ...sessions.map(item => {
      if (item.id === activeItem) {
        item.opened = !item.opened;
      } else {
        item.opened = false;
      }

      return item;
    }),
  ];
};

const repos = (state = initialState, action: ReposActionTypes): IState => {
  switch (action.type) {
    case GET_REPOS_STARTED:
      return {
        ...state,
        loading: action.loading,
      };

    case GET_REPOS_SUCCESS:
      return {
        ...state,
        sessions: sessionCreator(
          [...state.sessions],
          action.repos,
          action.request,
          action.id,
        ),
        loading: action.loading,
      };

    case GET_REPOS_ERROR:
      return {
        ...state,
        error: action.error,
      };

    case GET_SESSIONS_FROM_LOCALSTORAGE:
      return {
        ...state,
        sessions: action.sessions,
      };

    case CHANGE_SESSION_OPENED_STATUS:
      return {
        ...state,
        sessions: sessionActiveHandler([...state.sessions], action.activeItem),
      };

    default:
      return state;
  }
};

export default repos;
