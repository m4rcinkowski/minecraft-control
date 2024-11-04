import { Box, GlobalStyles, Slider, Typography } from '@mui/material';
import React, { SyntheticEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useTimer } from '../../hooks/useTimer.ts';
import { ChallengeProps } from '.';

const MIN = 10;
const MAX = 100;
const TIMEOUT = 10;

const getFailureTime = () => +Date.now() / 1_000 + TIMEOUT;

export const GenericSlider: React.FC<ChallengeProps> = ({
  onSuccess,
  onFailure,
  currentStatus,
}) => {
  const { t } = useTranslation();
  const defaultValue = currentStatus?.Name === 'running' ? MAX : MIN;
  const [value, setValue] = React.useState<number>(defaultValue);

  const [stopTs, setStopTs] = React.useState<number>(getFailureTime());

  const { timeEnded } = useTimer(stopTs);

  useEffect(() => {
    if (timeEnded) {
      onFailure();
    }
  }, [onFailure, timeEnded]);

  const onChange = (
    _event: Event | SyntheticEvent<Element, Event>,
    value: number | number[],
  ) => {
    const threshold = defaultValue === MAX ? MIN : MAX;

    if (value === threshold) {
      onSuccess();
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      flexDirection="column"
      sx={{
        padding: '0 3rem',
        maxWidth: 'md',
        margin: '0 auto',
      }}
    >
      <GlobalStyles
        styles={{
          '#root': {
            backgroundColor: `rgba(82, 163, 53, ${(value - MIN) / (MAX - MIN) - 0.1})`,
            ...(value !== defaultValue && {
              transition: 'background-color 0s',
            }),
          },
        }}
      />
      <Typography variant="h6" gutterBottom align="center">
        {t(
          currentStatus.Name === 'running'
            ? 'challenge.generic.confirmStopping'
            : 'challenge.slider.confirmStarting',
        )}
      </Typography>

      <Slider
        defaultValue={defaultValue}
        min={MIN}
        max={MAX}
        onChangeCommitted={onChange}
        onChange={(_event, value) => {
          setValue(value as number);
          setStopTs(getFailureTime());
        }}
      />

      {currentStatus.playersCount > 0 && (
        <Typography variant="body1" gutterBottom align="center">
          {t('challenge.generic.peoplePlaying', {
            count: currentStatus.playersCount,
          })}
        </Typography>
      )}
    </Box>
  );
};
