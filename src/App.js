import React from 'react';
import 'normalize.css';
import './styles/common.scss';
import { Provider } from 'react-redux';
import store from './store/state';
import SearchPage from './pages/SearchPage';
import Header from './components/Header';

function App() {
  return (
    <Provider store={store}>
      <Header />
      <SearchPage />
    </Provider>
  );
}

export default App;
