import React from 'react';
import { useDispatch } from 'react-redux';
import { ChangeSessionOpenedStatus } from 'store/actions/actions';
import Repository from 'components/Repository';
import styles from './styles.module.scss';
import { ISession } from 'typings/interfaces';

const RequestItem: React.FC<ISession> = ({ data, id, opened, request }) => {
  const dispatch = useDispatch();

  const changeOpenStatus = () => {
    dispatch(ChangeSessionOpenedStatus(id));
  };

  return (
    <div className={`${styles.accrodionItem} ${opened ? 'isOpen' : ''}`}>
      <div className={styles.accrodionItemHeader}>
        <span>
          Request: <strong className={styles.requestTitle}>{request}</strong>
        </span>
        <button className={styles.iconItem} onClick={changeOpenStatus}></button>
      </div>
      <div className={styles.accrodionItemBody}>
        <ul className={styles.repos}>
          {data.length > 0 ? (
            data.map(({ id, name, html_url }) => (
              <li key={id}>
                <Repository name={name} url={html_url} />
              </li>
            ))
          ) : (
            <p>This request does not have any repos!</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default React.memo(RequestItem);
