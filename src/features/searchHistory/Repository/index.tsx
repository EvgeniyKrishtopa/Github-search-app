import React from 'react';
import styled from 'styled-components';
import { IRepository } from 'typings/interfaces';

// Green status dot + repo name, matching the redesign's history rows. The
// clickable link is preserved (accessibility/function unchanged, design D4).
const RepoLink = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 15px;
  line-height: 1.3;
  color: ${({ theme }) => theme.color.text};
  break-inside: avoid;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: ${({ theme }) => theme.color.accent};
  }
`;

const StatusDot = styled.span`
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.statusDot};
`;

const RepoName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Repository: React.FC<IRepository> = ({ name, url }) => {
  return (
    <RepoLink href={url}>
      <StatusDot aria-hidden="true" />
      <RepoName>{name}</RepoName>
    </RepoLink>
  );
};

export default React.memo(Repository);
