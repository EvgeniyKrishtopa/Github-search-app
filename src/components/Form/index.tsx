import React, { useState } from 'react';
import { addSession } from 'store/searchHistorySlice';
import { useAppDispatch } from 'store/hooks';
import styles from './styles.module.scss';

const Form: React.FC = () => {
  const dispatch = useAppDispatch();
  const [request, setRequest] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (request) {
      dispatch(addSession(request));
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
