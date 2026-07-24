import React from 'react';
import { toggleSession } from 'features/searchHistory/searchHistorySlice';
import { useAppDispatch } from 'app/hooks';
import { useSearchReposQuery } from 'app/githubApi';
import Repository from 'features/searchHistory/Repository';
import Loader from 'components/Loader';
import {
  Card,
  HeaderButton,
  RequestLabel,
  RequestTitle,
  Chevron,
  Body,
  ReposGrid,
  Message,
  ErrorMessage,
} from './styles';

interface AccordionItemProps {
  id: number;
  query: string;
  isOpen: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ id, query, isOpen }) => {
  const dispatch = useAppDispatch();
  // Only the open session fetches; collapsed ones skip. Re-expanding the same
  // session within the cache window is served from cache (design D1/D4).
  const { data: repos, isFetching, isError } = useSearchReposQuery(
    { id, q: query },
    { skip: !isOpen },
  );

  const toggle = () => dispatch(toggleSession(id));

  const renderBody = () => {
    if (isFetching) {
      return <Loader />;
    }
    if (isError) {
      return (
        <ErrorMessage>
          Couldn&apos;t load repositories. Try searching again.
        </ErrorMessage>
      );
    }
    if (repos && repos.length > 0) {
      return (
        <ReposGrid>
          {repos.map(({ id: repoId, name, html_url }) => (
            <li key={repoId}>
              <Repository name={name} url={html_url} />
            </li>
          ))}
        </ReposGrid>
      );
    }
    return <Message>This request does not have any repos!</Message>;
  };

  return (
    <Card>
      <HeaderButton type="button" onClick={toggle} aria-expanded={isOpen}>
        <span>
          <RequestLabel>Request: </RequestLabel>
          <RequestTitle>{query}</RequestTitle>
        </span>
        <Chevron $isOpen={isOpen} aria-hidden="true">
          ▾
        </Chevron>
      </HeaderButton>
      {isOpen && <Body>{renderBody()}</Body>}
    </Card>
  );
};

export default React.memo(AccordionItem);
