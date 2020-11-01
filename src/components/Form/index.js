import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FetchRepos } from '../../store/actions';
import styles from './styles.module.scss';

const Form = () => {
  const [request, setRequest] = useState('');
  const dispatch = useDispatch();
  const handleSubmit = e => {
    e.preventDefault(e);
    if (request) {
      dispatch(FetchRepos(request));
    }

    setRequest('');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        type="text"
        placeholder="Get repository"
        className={styles.input}
        value={request}
        onChange={e => setRequest(e.target.value)}
      />
      <button type="submit" className={styles.btn}>
        Send Request
      </button>
    </form>
  );
};

export default Form;
