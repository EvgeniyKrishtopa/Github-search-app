import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const ListRequests = () => {
  const [users, setUsers] = useState([]);
  //const users = useSelector(state => state.users);
  return (
    <ul>
      <li>1</li>
      <li>2</li>
      <li>3</li>
    </ul>
  );
};

export default ListRequests;
