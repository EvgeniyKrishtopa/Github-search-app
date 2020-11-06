import React from 'react';
import Form from 'components/Form';
import ListRequests from 'components/ListRequests';
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
