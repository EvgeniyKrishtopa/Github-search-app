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

const sessionCreator = (sessions, newSession) => {
  if (sessions.length >= 5) {
    return [...sessions.slice(1), newSession];
  }

  return [...sessions, newSession];
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
        sessions: sessionCreator([...state.sessions], action.repos),
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
