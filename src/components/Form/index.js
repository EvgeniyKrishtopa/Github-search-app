import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FetchRepos } from '../../store/actions/actions';
import styles from './styles.module.scss';

const Form = () => {
  const dispatch = useDispatch();
  const error = useSelector(({ repos }) => repos.error);

  const [request, setRequest] = useState('');
  const [errorResponse, setErrorResponse] = useState(null);

  useEffect(() => {
    setErrorResponse(error);
  }, [error]);

  const handleSubmit = e => {
    e.preventDefault(e);
    if (request) {
      dispatch(FetchRepos(request));
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
