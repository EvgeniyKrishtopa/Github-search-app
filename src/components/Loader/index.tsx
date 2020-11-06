import React from 'react';
import styles from './styles.module.scss';

const Loader: React.FC = () => {
  return (
    <div className="page-center">
      <div className={styles.ldsDualRing}></div>
    </div>
  );
};

export default Loader;
