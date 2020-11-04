import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import AccordionItem from 'components/AccordionItem';
import styles from './styles.module.scss';

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
    if (sessions) {
      setCurrentSessions(sessions);
    }
  }, []);

  return (
    <>
      {currentSessions.length > 0 && (
        <h2 className="text-center">Requests History</h2>
      )}
      <ul className={styles.accordion}>
        {currentSessions.length > 0 &&
          currentSessions.map(({ request, data }) => (
            <li key={request} className={styles.listItem}>
              <AccordionItem request={request} data={data} />
            </li>
          ))}
      </ul>
    </>
  );
};

export default ListRequests;
