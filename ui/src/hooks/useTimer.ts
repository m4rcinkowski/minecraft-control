import { useEffect, useState } from 'react';

const getNowDiff = (stopTs: number) => stopTs - Date.now() / 1_000;

export const useTimer = (
  stopTs: number,
  { stopAtSecondsOverdue } = { stopAtSecondsOverdue: 30 },
) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, getNowDiff(stopTs)));
  const ended = timeLeft <= 0;

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = getNowDiff(stopTs);
      setTimeLeft(diff);

      if (diff < -stopAtSecondsOverdue) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [stopAtSecondsOverdue, stopTs]);

  return { timeLeft, timeEnded: ended };
};
