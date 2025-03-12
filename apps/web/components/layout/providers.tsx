import { ThemeProvider } from '@repo/shadcn/themes-provider';
import { SessionProvider, SessionProviderProps } from 'next-auth/react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ReactNode } from 'react';

type ProvidersProps = {
  children: ReactNode;
};
const Providers = ({
  session,
  children,
}: {
  session: SessionProviderProps['session'];
  children: ReactNode;
}) => {
  return (
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
  );
};

export default Providers;
