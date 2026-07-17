import React, { useState, useEffect } from 'react';
import { fetchRepos } from 'store/reposSlice';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import styles from './styles.module.scss';

const Form: React.FC = () => {
  const dispatch = useAppDispatch();
  const error = useAppSelector(({ repos }) => repos.error);

  const [request, setRequest] = useState<string>('');
  const [errorResponse, setErrorResponse] = useState<null | string>(null);

  useEffect(() => {
    setErrorResponse(error);
  }, [error]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (request) {
      dispatch(fetchRepos(request));
    }

    setRequest('');
  };

  return (
    <>
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
      {errorResponse && <p className="text-center warning">{errorResponse}</p>}
    </>
  );
};

export default Form;
