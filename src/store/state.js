import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import repos from './reducers';

/* eslint-disable no-underscore-dangle */
const composeEnhancers =
  process.env.NODE_ENV !== 'production' &&
  typeof window === 'object' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
    : compose;
/* eslint-enable */

const configureStore = preloadedState =>
  createStore(repos, preloadedState, composeEnhancers(applyMiddleware(thunk)));

const store = configureStore({});

export default store;
