import React from 'react';
import Form from 'features/searchHistory/Form';
import ListRequests from 'features/searchHistory/ListRequests';
import styles from './styles.module.scss';

const SearchPage: React.FC = () => {
  return (
    <main className={styles.main}>
      <div className="container">
        <Form />
        <ListRequests />
      </div>
    </main>
  );
};

export default SearchPage;
