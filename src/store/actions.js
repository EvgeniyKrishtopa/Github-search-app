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

const getReposSuccess = repos => {
  return {
    type: GET_REPOS_SUCCESS,
    loading: false,
    error: null,
    repos,
  };
};

const getReposError = error => {
  return {
    type: GET_REPOS_ERROR,
    error: error,
  };
};

export const FetchRepos = repository => {
  return dispatch => {
    dispatch(getReposStarted());

    fetch(
      `https://api.github.com/search/repositories?q=${repository}?&per_page=8`,
    ).then(response => {
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
