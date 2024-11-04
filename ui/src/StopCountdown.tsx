import styled from '@emotion/styled';
import { Fade, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const Counter = styled(Typography, {
  shouldForwardProp: (propName) => propName !== 'ended',
})<{ ended: boolean }>`
  @keyframes blink {
    0% {
      opacity: 0;
    }

    50% {
      opacity: 1;
    }

    100% {
      opacity: 0;
    }
  }

  animation: ${({ ended }) => (ended ? 'blink 1s infinite' : 'none')};
`;

const getNowDiff = (stopTs: number) => stopTs - Date.now() / 1_000;

export const StopCountdown: React.FC<{
  stopTs: number; // seconds
}> = ({ stopTs: extStopTs }) => {
  const { t } = useTranslation();
  const [stopTs, setStopTs] = useState(extStopTs);
  const [timeLeft, setTimeLeft] = useState(Math.max(0, getNowDiff(stopTs)));
  const ended = timeLeft <= 0;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (extStopTs) setStopTs(extStopTs);
  }, [extStopTs]);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = getNowDiff(stopTs);
      setTimeLeft(Math.max(0, diff));

      if (Math.round(diff) === -3) {
        // extra time for EC2 to actually change the instance status
        queryClient.invalidateQueries({ queryKey: ['status'] });
      }
      if (diff < -30) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [queryClient, stopTs]);

  const minutes = !ended ? Math.floor(timeLeft / 60) : 0;
  const seconds = !ended ? Math.floor(timeLeft % 60) : 0;

  return (
    <div>
      <Typography variant="h6" align="center">
        {t('stopCountdown.title')}
      </Typography>

      <Counter ended={ended} variant="h1" align="center">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </Counter>

      <Fade in={ended}>
        <Typography variant="h6" align="center" color="warning">
          {t('stopCountdown.ended')}
        </Typography>
      </Fade>
    </div>
  );
};
