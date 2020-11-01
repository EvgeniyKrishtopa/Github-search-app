import React from 'react';
import 'normalize.css';
import './styles/common.scss';
import { Provider } from 'react-redux';
import store from './store/state';
import SearchPage from './pages/SearchPage';

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <SearchPage />
      </div>
    </Provider>
  );
}

export default App;
