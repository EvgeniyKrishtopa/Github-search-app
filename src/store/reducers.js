import {
  GET_REPOS_STARTED,
  GET_REPOS_SUCCESS,
  GET_REPOS_ERROR,
} from './constants';

const STATE = {
  loading: false,
  users: [],
  sessions: [],
  error: null,
};

const repos = (state = STATE, action) => {
  switch (action.type) {
    case GET_REPOS_STARTED:
      return {
        ...state,
        loading: action.loading,
      };

    case GET_REPOS_SUCCESS:
      return {
        ...state,
        users: action.users,
        sessions: [...state.sessions, action.users],
        loading: action.loading,
      };

    case GET_REPOS_ERROR:
      return {
        ...state,
        error: action.error,
      };
  }
};

export default repos;
