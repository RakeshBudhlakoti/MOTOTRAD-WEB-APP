'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '@/store';


import { Toaster, toast } from 'react-hot-toast';

// Globally intercept and sanitize toast.error to prevent React rendering crashes
// when raw NestJS backend exception objects are passed instead of strings.
if (typeof window !== 'undefined') {
  const originalToastError = toast.error;
  toast.error = (message: any, options?: any) => {
    let sanitizedMessage = message;
    if (typeof message === 'object' && message !== null) {
      if (typeof message.message === 'string') {
        sanitizedMessage = message.message;
      } else if (Array.isArray(message.message)) {
        sanitizedMessage = message.message.join(', ');
      } else {
        sanitizedMessage = JSON.stringify(message);
      }
    }
    return originalToastError(sanitizedMessage, options);
  };
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" reverseOrder={false} />
      </QueryClientProvider>
    </Provider>
  );
}
