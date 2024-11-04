export type Status = 'stopped' | 'running' | 'pending' | 'stopping';

export const isAnyPending = (status?: Status) =>
  !!status && ['pending', 'stopping'].includes(status);

export type StatusData = {
  Code: number;
  Name: Status;
  predictedStop: number;
  playersCount: number;
  author?: string;
};
