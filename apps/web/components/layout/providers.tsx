'use client';
import { ThemeProvider } from '@repo/shadcn/themes-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SessionProvider, SessionProviderProps } from 'next-auth/react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      gcTime: 60 * 60 * 1000, // 1 hora para garbage collection
      staleTime: 60 * 60 * 1000, // 1 hora para considerar datos obsoletos
      refetchOnWindowFocus: false, // No recargar al enfocar la ventana
      refetchOnMount: true, // Recargar al montar el componente
    },
  },
});
const Providers = ({
  session,
  children,
}: {
  session: SessionProviderProps['session'];
  children: ReactNode;
}) => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <NuqsAdapter>
            <SessionProvider session={session}>{children}</SessionProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </NuqsAdapter>
        </ThemeProvider>
      </QueryClientProvider>
    </>
  );
};

export default Providers;
