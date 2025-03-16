'use client';
import { ThemeProvider } from '@repo/shadcn/themes-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, SessionProviderProps } from 'next-auth/react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ReactNode } from 'react';

type ProvidersProps = {
  children: ReactNode;
};

const queryClient = new QueryClient();
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
          </NuqsAdapter>
        </ThemeProvider>
      </QueryClientProvider>
    </>
  );
};

export default Providers;
