import styled from 'styled-components';
import AccordionItem from 'features/searchHistory/AccordionItem';
import { useAppSelector } from 'app/hooks';

const SectionLabel = styled.h2`
  margin-bottom: 16px;
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.textMuted};
`;

const AccordionList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ListRequests = () => {
  const entries = useAppSelector(({ searchHistory }) => searchHistory.entries);
  const openId = useAppSelector(({ searchHistory }) => searchHistory.openId);

  if (entries.length === 0) {
    return null;
  }

  return (
    <>
      <SectionLabel>Request History</SectionLabel>
      <AccordionList>
        {entries.map(({ id, query }) => (
          <li key={id}>
            <AccordionItem id={id} query={query} isOpen={openId === id} />
          </li>
        ))}
      </AccordionList>
    </>
  );
};

export default ListRequests;
