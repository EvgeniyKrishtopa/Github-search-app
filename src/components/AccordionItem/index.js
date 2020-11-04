import React, { useState } from 'react';
import styles from './styles.module.scss';

const RequestItem = ({ request, data }) => {
  const [opened, setOpened] = useState(false);
  return (
    <div className={`${styles.accrodionItem} ${opened ? 'isOpen' : ''}`}>
      <div className={styles.accrodionItemHeader}>
        <span>
          Request: <strong className={styles.requestTitle}>{request}</strong>
        </span>
        <button
          className={styles.iconItem}
          onClick={() => setOpened(!opened)}
        ></button>
      </div>
      <div className={styles.accrodionItemBody}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </div>
    </div>
  );
};

export default RequestItem;
