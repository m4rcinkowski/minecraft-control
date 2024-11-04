import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useIsMutating } from '@tanstack/react-query';
import * as React from 'react';

import LogoIcon from './assets/minecraft.svg?react';
import { isAnyPending, Status } from './model';

const Container = styled('div', {
  shouldForwardProp: (prop) => !['disabled', 'highlight'].includes(prop),
})<{ disabled: boolean; highlight: boolean }>`
  will-change: filter;
  transition: filter 600ms;
  -webkit-tap-highlight-color: transparent;

  ${({ disabled }) => !disabled && 'cursor: pointer;'}
  & svg {
    height: 16em;
  }

  &.stopped {
    color: #c8c8c8;
    filter: grayscale(100%)
      ${({ highlight }) => (highlight ? 'drop-shadow(0 0 2em #ffcb52)' : '')};
  }

  &.pending,
  &.stopping {
    color: #ffcb52;
    filter: grayscale(0%);
  }

  &.running {
    color: #52a335;
    filter: grayscale(0%)
      ${({ highlight }) => (highlight ? 'drop-shadow(0 0 2em #ffcb52)' : '')};
  }

  ${({ disabled }) =>
    !disabled &&
    css`
      &.stopped:hover,
      &.stopped:active {
        filter: grayscale(100%) drop-shadow(0 0 2em #52a335);
      }
      &.running:hover,
      &.running:active {
        filter: drop-shadow(0 0 2em #ffcb52);
      }
    `}
`;

export const Logo: React.FC<{
  status: Status;
  highlight: boolean;
  onClick: () => void;
}> = ({ status, onClick, highlight }) => {
  const isMutating = useIsMutating();
  const disabled = isAnyPending(status) || isMutating > 0;

  return (
    <Container
      className={`${status}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      highlight={highlight}
    >
      <LogoIcon />
    </Container>
  );
};
