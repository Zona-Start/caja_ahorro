import Providers from '@/components/layout/providers';
import { auth } from '@/lib/auth';
import { cn } from '@repo/shadcn/lib/utils';
import '@repo/shadcn/shadcn.css';
import { Metadata } from 'next';
import localFont from 'next/font/local';
import NextTopLoader from 'nextjs-toploader';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';

const GeistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const GeistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export const metadata = {
  metadataBase: new URL('https://turbo-npn.onrender.com'),
  title: {
    default: 'Caja de Ahorro',
    template: '%s | Caja de Ahorro',
  },
  openGraph: {
    type: 'website',
    title: 'Caja de Ahorro',
    description: 'Sistema integral para cajas de ahorro',
    url: 'https://turbo-npn.onrender.com',
    images: [
      {
        url: '/og-bg.png',
        width: 1200,
        height: 628,
        alt: 'Turbo NPN Logo',
      },
    ],
  },
} satisfies Metadata;

const RootLayout = async ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(GeistMono.variable, GeistSans.variable, 'antialiased')}
        suppressHydrationWarning
      >
        <NextTopLoader showSpinner={false} />
        <Providers session={session}>
          <Toaster />
          {children}
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
