import { StatusData } from '../model';

const FN_URL = import.meta.env.VITE_FN_URL as string;

const getApi = () => {
  let authToken: string | undefined;

  const getFetchOpts = () =>
    (!!authToken && {
      headers: { Authorization: authToken },
    }) ||
    undefined;

  return {
    setToken: (token: string) => {
      authToken = token;
    },
    hasToken: () => !!authToken,
    getStatus: async (): Promise<StatusData> => {
      const response = await fetch(`${FN_URL}/?action=status`, getFetchOpts());

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      return response.json();
    },
    changeInstanceState: async (action: 'start' | 'stop') => {
      const response = await fetch(
        `${FN_URL}/?action=${action}`,
        getFetchOpts(),
      );

      if (!response.ok) {
        throw new Error('Failed to change status');
      }

      return;
    },
  };
};

export default getApi();
