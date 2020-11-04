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

const getReposSuccess = (response, repository) => {
  return {
    type: GET_REPOS_SUCCESS,
    loading: false,
    error: null,
    request: repository,
    repos: response,
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
          dispatch(getReposSuccess(response.items, repository));
        });
      } else {
        dispatch(getReposError(response.statusText));
      }
    });
  };
};
