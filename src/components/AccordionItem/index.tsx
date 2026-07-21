import React from 'react';
import { toggleSession } from 'store/searchHistorySlice';
import { useAppDispatch } from 'store/hooks';
import { useSearchReposQuery } from 'store/githubApi';
import Repository from 'components/Repository';
import Loader from 'components/Loader';
import styles from './styles.module.scss';

interface AccordionItemProps {
  id: number;
  query: string;
  isOpen: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ id, query, isOpen }) => {
  const dispatch = useAppDispatch();
  // Only the open session fetches; collapsed ones skip. Re-expanding the same
  // session within the cache window is served from cache (design D1/D4).
  const { data: repos, isFetching, isError } = useSearchReposQuery(
    { id, q: query },
    { skip: !isOpen },
  );

  const toggle = () => dispatch(toggleSession(id));

  const renderBody = () => {
    if (isFetching) {
      return <Loader />;
    }
    if (isError) {
      return (
        <p className="warning">
          Couldn&apos;t load repositories. Try searching again.
        </p>
      );
    }
    if (repos && repos.length > 0) {
      return (
        <ul className={styles.repos}>
          {repos.map(({ id: repoId, name, html_url }) => (
            <li key={repoId}>
              <Repository name={name} url={html_url} />
            </li>
          ))}
        </ul>
      );
    }
    return <p>This request does not have any repos!</p>;
  };

  return (
    <div className={`${styles.accrodionItem} ${isOpen ? 'isOpen' : ''}`}>
      <div className={styles.accrodionItemHeader}>
        <span>
          Request: <strong className={styles.requestTitle}>{query}</strong>
        </span>
        <button className={styles.iconItem} onClick={toggle}></button>
      </div>
      <div className={styles.accrodionItemBody}>{renderBody()}</div>
    </div>
  );
};

export default React.memo(AccordionItem);
