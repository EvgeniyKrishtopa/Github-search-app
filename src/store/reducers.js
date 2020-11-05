import {
  GET_REPOS_STARTED,
  GET_REPOS_SUCCESS,
  GET_REPOS_ERROR,
  GET_SESSIONS_FROM_LOCALSTORAGE,
} from './constants';

const initialState = {
  loading: false,
  sessions: [],
  error: null,
};

const sessionCreator = (sessions, newSession, request) => {
  if (sessions.length >= 5) {
    return [
      { request, data: newSession, opened: true },
      ...sessions.slice(0, 4).map(item => {
        item.opened = false;
        return item;
      }),
    ];
  }

  return [
    { request, data: newSession, opened: true },
    ...sessions.map(item => {
      item.opened = false;
      return item;
    }),
  ];
};

const repos = (state = initialState, action) => {
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

    default:
      return state;
  }
};

export default repos;
