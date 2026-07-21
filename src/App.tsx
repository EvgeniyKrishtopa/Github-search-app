import React from 'react';
import 'normalize.css';
import 'styles/common.scss';
import { Provider } from 'react-redux';
import store from 'app/store';
import SearchPage from 'pages/SearchPage';
import Header from 'components/Header';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Header />
      <SearchPage />
    </Provider>
  );
};

export default App;
