import styled from 'styled-components';

// Glass card + accessible disclosure header, matching the redesign. Kept in a
// sibling styles.ts so index.tsx stays focused on data flow (design D3).
export const Card = styled.div`
  background: ${({ theme }) => theme.color.glassBg};
  border: 1px solid ${({ theme }) => theme.color.glassBorder};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

export const HeaderButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 16px 20px;
  font-family: inherit;
  font-size: 15px;
  text-align: left;
  color: ${({ theme }) => theme.color.text};
  background: none;
  border: none;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent};
    outline-offset: -2px;
  }
`;

export const RequestLabel = styled.span`
  color: ${({ theme }) => theme.color.textMuted};
`;

export const RequestTitle = styled.strong`
  color: ${({ theme }) => theme.color.text};
  text-transform: capitalize;
`;

export const Chevron = styled.span<{ $isOpen: boolean }>`
  flex-shrink: 0;
  color: ${({ theme }) => theme.color.textMuted};
  transition: transform 0.3s ease-in-out;
  transform: rotate(${({ $isOpen }) => ($isOpen ? '180deg' : '0deg')});
`;

export const Body = styled.div`
  padding: 0 20px 20px;
`;

export const ReposGrid = styled.ul`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px 24px;

  @media screen and (min-width: 480px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const Message = styled.p`
  color: ${({ theme }) => theme.color.textMuted};
`;

export const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.color.danger};
`;
