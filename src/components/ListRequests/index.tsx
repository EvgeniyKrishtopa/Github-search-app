import AccordionItem from 'components/AccordionItem';
import Loader from 'components/Loader';
import { useAppSelector } from 'store/hooks';
import styles from './styles.module.scss';

const ListRequests = () => {
  const sessions = useAppSelector(({ repos }) => repos.sessions);
  const loading = useAppSelector(({ repos }) => repos.loading);

  return (
    <>
      {sessions.length > 0 && <h2 className="text-center">Requests History</h2>}
      {loading ? (
        <Loader />
      ) : (
        <ul className={styles.accordion}>
          {sessions.length > 0 &&
            sessions.map(({ data, id, opened, request }) => (
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
