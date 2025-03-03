import { Box } from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import api from './api';
import { RemoteControl } from './RemoteControl.tsx';

const restrictedEmails =
  import.meta.env.VITE_RESTRICTED_EMAILS?.split(',') ?? [];

export const KEY_TOKEN = 'authToken';

const App = () => {
  const { t } = useTranslation();

  const [authToken, setAuthToken] = useState<string>(
    window.sessionStorage.getItem(KEY_TOKEN) ?? '',
  );

  useEffect(() => {
    if (authToken) {
      api.setToken(authToken);
    }
  }, [authToken]);

  if (authToken) {
    const userEmail = jwtDecode<{ email: string }>(authToken)?.email;
    console.log({ userEmail });

    if (!userEmail || !restrictedEmails.includes(userEmail)) {
      return <h1>{t('accessDenied')}</h1>;
    }
  }

  return (
    <>
      {!authToken && (
        <Box
          height="100vh"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              const token = credentialResponse.credential ?? '';
              window.sessionStorage.setItem(KEY_TOKEN, token);
              setAuthToken(token);
            }}
            auto_select
          />
        </Box>
      )}
      {authToken && <RemoteControl />}
    </>
  );
};

export default App;
