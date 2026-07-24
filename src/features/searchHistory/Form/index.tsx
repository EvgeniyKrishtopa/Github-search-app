import React, { useState } from 'react';
import styled from 'styled-components';
import { addSession } from 'features/searchHistory/searchHistorySlice';
import { useAppDispatch } from 'app/hooks';

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 640px;
  margin: 0 auto 40px;

  @media screen and (min-width: 640px) {
    flex-direction: row;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 14px 18px;
  font-family: inherit;
  font-size: 15px;
  color: ${({ theme }) => theme.color.text};
  background: ${({ theme }) => theme.color.glassBg};
  border: 1px solid ${({ theme }) => theme.color.glassBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: border-color 0.2s ease-in-out;

  &::placeholder {
    color: ${({ theme }) => theme.color.textMuted};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.accent};
  }
`;

const SubmitButton = styled.button`
  padding: 14px 24px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.accent};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.color.accent};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition:
    color 0.2s ease-in-out,
    background-color 0.2s ease-in-out;

  &:hover {
    color: ${({ theme }) => theme.color.background};
    background: ${({ theme }) => theme.color.accent};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent};
    outline-offset: 2px;
  }
`;

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
    <StyledForm onSubmit={handleSubmit}>
      <Input
        type="text"
        placeholder="Get repository"
        value={request}
        onChange={e => setRequest(e.target.value)}
      />
      <SubmitButton type="submit">Send Request</SubmitButton>
    </StyledForm>
  );
};

export default Form;
