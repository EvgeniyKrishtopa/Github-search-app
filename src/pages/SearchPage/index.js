import React from 'react';
import Form from '../../components/Form';
import ListRequests from '../../components/ListRequests';

const SearchPage = () => {
  return (
    <div className="container">
      <h1 className="text-center">Github Search</h1>
      <Form />
      <ListRequests />
    </div>
  );
};

export default SearchPage;
