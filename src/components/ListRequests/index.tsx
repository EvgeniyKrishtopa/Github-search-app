import AccordionItem from 'components/AccordionItem';
import { useAppSelector } from 'store/hooks';
import styles from './styles.module.scss';

const ListRequests = () => {
  const entries = useAppSelector(({ searchHistory }) => searchHistory.entries);
  const openId = useAppSelector(({ searchHistory }) => searchHistory.openId);

  if (entries.length === 0) {
    return null;
  }

  return (
    <>
      <h2 className="text-center">Requests History</h2>
      <ul className={styles.accordion}>
        {entries.map(({ id, query }) => (
          <li key={id} className={styles.listItem}>
            <AccordionItem id={id} query={query} isOpen={openId === id} />
          </li>
        ))}
      </ul>
    </>
  );
};

export default ListRequests;
