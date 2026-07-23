import React from 'react';
import styled from 'styled-components';
import ThemeToggle from 'features/theming/ThemeToggle';

const StyledHeader = styled.header`
  border-bottom: 1px solid ${({ theme }) => theme.color.glassBorder};
  background: ${({ theme }) => theme.color.glassBg};
`;

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 992px;
  margin: 0 auto;
  padding: 16px 24px;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Logo = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.accent};
`;

const ProjectTitle = styled.strong`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Version = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 12px;
  color: ${({ theme }) => theme.color.textMuted};
`;

// Dumb presentational shell: composes the connected <ThemeToggle/> but reads no
// store state of its own (design D3). The `</>` logo is plain branding, not a
// link — the redesign specifies logo/label/version/toggle only.
const Header: React.FC = () => {
  return (
    <StyledHeader>
      <Bar>
        <Brand>
          <Logo aria-hidden="true">&lt;/&gt;</Logo>
          <ProjectTitle>Repo Search</ProjectTitle>
        </Brand>
        <Actions>
          <Version>v2.0</Version>
          <ThemeToggle />
        </Actions>
      </Bar>
    </StyledHeader>
  );
};

export default Header;
