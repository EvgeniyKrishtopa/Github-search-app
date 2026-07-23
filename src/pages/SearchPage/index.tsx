import React from 'react';
import styled from 'styled-components';
import Form from 'features/searchHistory/Form';
import ListRequests from 'features/searchHistory/ListRequests';

const Main = styled.main`
  max-width: 992px;
  margin: 0 auto;
  padding: 0 24px 48px;
`;

const Hero = styled.section`
  text-align: center;
  padding: 64px 0 40px;
`;

const HeroTitle = styled.h1`
  margin: 0 0 12px;
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.color.text};
`;

const HeroSubtitle = styled.p`
  max-width: 520px;
  margin: 0 auto;
  font-size: 16px;
  color: ${({ theme }) => theme.color.textMuted};
`;

const SearchPage: React.FC = () => {
  return (
    <Main>
      <Hero>
        <HeroTitle>Find any repository, instantly.</HeroTitle>
        <HeroSubtitle>
          Search across GitHub and keep a running history of your last five
          queries.
        </HeroSubtitle>
      </Hero>
      <Form />
      <ListRequests />
    </Main>
  );
};

export default SearchPage;
