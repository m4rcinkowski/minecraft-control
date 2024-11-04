import { Box, Fade, GlobalStyles } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import api from './api';
import { Challenge } from './components/Challenge';
import { Logo } from './Logo.tsx';
import { isAnyPending, StatusData } from './model';
import { Spinner } from './Spinner.tsx';
import { StatusView } from './StatusView.tsx';

export const RemoteControl = () => {
  const [challengeOpen, setChallengeOpen] = useState<boolean>(false);
  const [previousStatus, setPreviousStatus] = useState<StatusData | null>(null);

  const queryClient = useQueryClient();
  const { mutate, isPending: isMutationPending } = useMutation({
    mutationFn: api.changeInstanceState,
  });

  const { data: status, isPending: isQueryPending } = useQuery({
    queryKey: ['status'],
    queryFn: api.getStatus,
    staleTime: 60_000,
    refetchInterval: ({ state: { data: recentStatus } }) => {
      if (
        // if the server's still running, but theoretically it shouldn't be, then update its status more frequently
        recentStatus?.Name === 'running' &&
        recentStatus?.predictedStop &&
        +Date.now() / 1_000 > recentStatus?.predictedStop
      ) {
        return 2_000;
      }

      switch (recentStatus?.Name) {
        case 'pending':
          return 1_000;
        case 'stopping':
          return 5_000;
        default:
          return 15_000;
      }
    },
  });

  const toggleInstanceState = useCallback(() => {
    const action =
      status?.Name === 'stopped'
        ? 'start'
        : status?.Name === 'running'
          ? 'stop'
          : undefined;

    if (action)
      mutate(action, {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: ['status'] }),
      });
  }, [mutate, queryClient, status?.Name]);

  useEffect(() => {
    if (status?.Name && previousStatus?.Name !== status?.Name) {
      setPreviousStatus(status);
    }
  }, [previousStatus?.Name, status]);

  useEffect(() => {
    if (
      status?.Name &&
      status?.Name !== previousStatus?.Name &&
      challengeOpen
    ) {
      setChallengeOpen(false);
    }
  }, [challengeOpen, previousStatus?.Name, status?.Name]);

  const showSpinner =
    isQueryPending || isMutationPending || isAnyPending(status?.Name) || false;

  return (
    <Grid container columns={2} height="100vh" maxHeight="100vh">
      <GlobalStyles
        styles={{
          '#root': {
            transition: 'background-color 0.5s ease-in-out',
          },
        }}
      />
      <Grid
        size={{ xs: 2, md: 2 }}
        container
        direction="column"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Logo
          status={status?.Name ?? 'stopped'}
          onClick={() => {
            setChallengeOpen((t) => !t);
          }}
          highlight={challengeOpen}
        />
        <Spinner show={showSpinner} />

        <Box sx={{ position: 'relative', width: '100%' }}>
          {status && (
            <Fade in={challengeOpen}>
              <Challenge
                open={challengeOpen}
                currentStatus={status}
                onSuccess={() => {
                  setChallengeOpen(false);
                  toggleInstanceState();
                }}
                onFailure={() => setChallengeOpen(false)}
              />
            </Fade>
          )}

          {status && !isMutationPending && (
            <Fade in={!challengeOpen}>
              <StatusView status={status} />
            </Fade>
          )}
        </Box>
      </Grid>
    </Grid>
  );
};
