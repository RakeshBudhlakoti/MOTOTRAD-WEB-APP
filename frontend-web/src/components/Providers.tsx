'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/slices/authSlice';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');
    if (storedUser && storedToken) {
      try {
        dispatch(setCredentials({ 
          user: JSON.parse(storedUser), 
          token: storedToken 
        }));
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
  }, [dispatch]);

  return <>{children}</>;
}

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { SettingsProvider, useSettings } from '@/context/SettingsContext';

function PayPalWrapper({ children }: { children: React.ReactNode }) {
  const { getSetting } = useSettings();
  const paypalClientId = getSetting(
    'paypal_client_id',
    'AUrs-7hHxNlEJQyC2-KKh4SD2G5jjn7C8Hndaf3wYTEuksPrGwwpPmb7luLFJNYIVbVQVxHr2lz06uOb'
  );

  return (
    <PayPalScriptProvider options={{ 
      clientId: paypalClientId,
      currency: "USD",
      intent: "capture"
    }}>
      {children}
    </PayPalScriptProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <PayPalWrapper>
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                {children}
                <Toaster position="bottom-right" />
              </ThemeProvider>
            </PayPalWrapper>
          </SettingsProvider>
        </QueryClientProvider>
      </AuthInitializer>
    </Provider>
  );
}
