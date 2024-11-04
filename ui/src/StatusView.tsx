import { Box, Stack, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { StatusData } from './model';
import { StopCountdown } from './StopCountdown';

type Props = {
  status: StatusData;
  style?: React.CSSProperties;
};

export const StatusView: React.FC<Props> = React.forwardRef(
  ({ style, status }, ref) => {
    const { t } = useTranslation();
    const statusName = status?.Name;
    const predictedStop = status?.predictedStop;

    return (
      <Box display="flex" justifyContent="center" style={style} ref={ref}>
        <Stack
          spacing={2}
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {statusName && (
            <Typography variant="h3">
              {t(`status.name.${statusName}`)}
            </Typography>
          )}
          {statusName && status?.author && (
            <Typography variant="subtitle1">
              {t(`status.authored.${statusName}`, { author: status.author })}
            </Typography>
          )}

          {statusName === 'running' && status?.playersCount !== undefined ? (
            <Typography variant="h3" style={{ margin: '2rem' }}>
              {t(`status.playersCount`, { count: status.playersCount })}
            </Typography>
          ) : null}

          {(statusName === 'running' &&
            predictedStop &&
            status?.playersCount === 0 && (
              <StopCountdown stopTs={predictedStop} />
            )) ||
            null}
        </Stack>
      </Box>
    );
  },
);
