import React from 'react';
import 'normalize.css';
import 'styles/common.scss';
import { Provider } from 'react-redux';
import store from 'store/store';
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

// intentional type error for CI verification (to be reverted)
const __ciVerificationBrokenType: string = 12345;
