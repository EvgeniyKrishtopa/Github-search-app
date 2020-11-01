import {
  GET_REPOS_STARTED,
  GET_REPOS_SUCCESS,
  GET_REPOS_ERROR,
} from './constants';

const getReposStarted = () => {
  return {
    type: GET_REPOS_STARTED,
    loading: true,
  };
};

const getReposSuccess = users => {
  return {
    type: GET_REPOS_SUCCESS,
    loading: false,
    error: null,
    users,
  };
};

const getReposError = error => {
  return {
    type: GET_REPOS_ERROR,
    error: error,
  };
};

export const FetchRepos = user => {
  return dispatch => {
    dispatch(getReposStarted());

    fetch(`https://api.github.com/search/users?q=${user}`).then(response => {
      if (response.ok) {
        response.json().then(response => {
          dispatch(getReposSuccess(response.items));
        });
      } else {
        dispatch(getReposError(response.statusText));
      }
    });
  };
};
