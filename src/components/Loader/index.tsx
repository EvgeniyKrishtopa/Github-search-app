import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px 0;
`;

const Spinner = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid ${({ theme }) => theme.color.glassBorder};
  border-top-color: ${({ theme }) => theme.color.accent};
  animation: ${spin} 0.9s linear infinite;
`;

const Loader: React.FC = () => {
  return (
    <LoaderWrapper role="status" aria-label="Loading">
      <Spinner aria-hidden="true" />
    </LoaderWrapper>
  );
};

export default Loader;
