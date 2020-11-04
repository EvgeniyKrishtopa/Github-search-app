import {
  GET_REPOS_STARTED,
  GET_REPOS_SUCCESS,
  GET_REPOS_ERROR,
} from './constants';

const initialState = {
  loading: false,
  sessions: [],
  error: null,
};

const sessionCreator = (sessions, newSession, request) => {
  if (sessions.length >= 5) {
    const sessionsUpdated = [
      ...sessions.slice(1),
      { request, data: newSession },
    ];
    return sessionsUpdated.reverse();
  }

  const sessionsUpdated = [...sessions, { request, data: newSession }];
  return sessionsUpdated.reverse();
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

    default:
      return state;
  }
};

export default repos;
