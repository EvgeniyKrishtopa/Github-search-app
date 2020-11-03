import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const ListRequests = () => {
  const [currentSessions, setCurrentSessions] = useState([]);
  const sessions = useSelector(({ repos }) => repos.sessions);

  useEffect(() => {
    if (sessions.length !== 0) {
      localStorage.setItem('sessions', JSON.stringify(sessions));
      setCurrentSessions(sessions);
    }
  }, [sessions]);

  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem('sessions'));
    setCurrentSessions(sessions);
  }, []);

  return (
    <ul>
      {currentSessions.map((item, index) => (
        <li key={index}>{index}</li>
      ))}
    </ul>
  );
};

export default ListRequests;
