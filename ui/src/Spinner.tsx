import styled from '@emotion/styled';
import LoopRoundedIcon from '@mui/icons-material/LoopRounded';

export const Spinner = styled(LoopRoundedIcon, {
  shouldForwardProp: (propName) => propName !== 'show',
})<{ show: boolean }>`
  opacity: ${({ show }) => (show ? 1 : 0)};
  transition: opacity 250ms;

  @keyframes rotate {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(-360deg);
    }
  }

  animation: rotate 2s linear infinite;
`;
