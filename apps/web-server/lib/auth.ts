import NextAuth, { NextAuthConfig, Session } from 'next-auth';
import authConfig from './auth.config';

export const {
  handlers,
  signIn,
  signOut,
  auth,
}: {
  handlers: any;
  signIn: (provider?: string) => Promise<void>;
  signOut: () => Promise<void>;
  auth: () => Promise<Session | null>;
} = NextAuth({
  session: { strategy: 'jwt' },
  ...(authConfig as NextAuthConfig),
});
