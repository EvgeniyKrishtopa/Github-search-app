import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AccordionItem from 'components/AccordionItem';
import { GetSessions } from 'store/actions/actions';
import Loader from 'components/Loader';
import styles from './styles.module.scss';
import { ISession } from 'typings/interfaces';
import { RootState } from 'store/reducers';

const ListRequests = () => {
  const [currentSessions, setCurrentSessions] = useState<Array<ISession>>([]);
  const sessions = useSelector<RootState, Array<ISession>>(
    ({ repos }) => repos.sessions,
  );
  const loading = useSelector<RootState, boolean>(({ repos }) => repos.loading);
  const dispatch = useDispatch();

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('sessions', JSON.stringify(sessions));
      setCurrentSessions(sessions);
    }
    setCurrentSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]') as
      | Array<ISession>
      | [];
    if (sessions.length > 0) {
      dispatch(GetSessions(sessions));
    }
  }, [dispatch]);

  return (
    <>
      {currentSessions.length > 0 && (
        <h2 className="text-center">Requests History</h2>
      )}
      {loading ? (
        <Loader />
      ) : (
        <ul className={styles.accordion}>
          {currentSessions.length > 0 &&
            currentSessions.map(({ data, id, opened, request }) => (
              <li key={id} className={styles.listItem}>
                <AccordionItem
                  data={data}
                  id={id}
                  opened={opened}
                  request={request}
                />
              </li>
            ))}
        </ul>
      )}
    </>
  );
};

export default ListRequests;
