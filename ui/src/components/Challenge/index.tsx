import { Box } from '@mui/material';
import React from 'react';

import { StatusData } from '../../model';
import { GenericSlider } from './GenericSlider.tsx';

export type ChallengeProps = {
  onSuccess: () => void;
  onFailure: () => void;
  currentStatus: StatusData;
};

type Props = ChallengeProps & {
  open: boolean;
  style?: React.CSSProperties;
};

export const Challenge: React.FC<Props> = React.forwardRef(
  ({ open, style, ...rest }, ref) => {
    return (
      <Box
        ref={ref}
        style={style}
        sx={{ height: '6rem', position: 'absolute', width: '100%' }}
      >
        {open && <GenericSlider {...rest} />}
      </Box>
    );
  },
);
