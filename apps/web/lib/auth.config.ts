import { SignInAction } from '@/feactures/auth/actions/login-action';
import { resfreshTokenAction } from '@/feactures/auth/actions/refresh-token-action';
import { NextAuthConfig, Session, User } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';
import CredentialProvider from 'next-auth/providers/credentials';

const authConfig: NextAuthConfig = {
  providers: [
    CredentialProvider({
      credentials: {
        username: {
          type: 'username',
        },
        password: {
          type: 'password',
        },
      },
      async authorize(
        credentials: Partial<Record<'username' | 'password', unknown>>,
        request: Request,
      ): Promise<User | null> {
        const credential = {
          username: credentials?.username as string,
          password: credentials?.password as string,
        };

        const response = await SignInAction(credential);
        if (response) {
          return {
            id: response.user.id?.toString() ?? '0',
            username: response.user.username ?? '',
            fullname: response.user.fullname ?? '',
            email: response.user.email ?? '',
            role: response.user.rol ?? [], // Add role array
            access_token: response.tokens.access_token ?? '',
            access_expire_in: response.tokens.access_expire_in ?? 0,
            refresh_token: response.tokens.refresh_token ?? '',
            refresh_expire_in: response.tokens.refresh_expire_in ?? 0,
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/', //sigin page
  },
  callbacks: {
    async jwt({
      token,
      user,
      account,
    }: {
      token: any;
      user: User;
      account: any;
    }) {
      // Si es un nuevo login, asignamos los datos
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.fullname = user.fullname;
        token.email = user.email;
        token.role = user.role;
        token.access_token = user.access_token;
        token.access_expire_in = user.access_expire_in;
        token.refresh_token = user.refresh_token;
        token.refresh_expire_in = user.refresh_expire_in;
      }

      // Renovar access_token si ha expirado
      if (Date.now() / 1000 > (token.access_expire_in as number)) {
        if (Date.now() / 1000 > (token.refresh_expire_in as number)) {
          return null; // Forzar logout
        }

        try {
          const res = await resfreshTokenAction({
            token: token.refresh_token as string,
          });
          if (!res) throw new Error('Failed to refresh token');
          token.access_token = res.tokens.access_token;
          token.access_expire_in = res.tokens.access_expire_in;
          token.refresh_token = res.tokens.refresh_token;
          token.refresh_expire_in = res.tokens.refresh_expire_in;
        } catch (error) {
          return null;
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: DefaultJWT }) {
      session.access_token = token.access_token as string;
      session.access_expire_in = token.access_expire_in as number;
      session.refresh_token = token.refresh_token as string;
      session.refresh_expire_in = token.refresh_expire_in as number;
      session.user = {
        id: token.id as number,
        username: token.username as string,
        fullname: token.fullname as string,
        email: token.email as string,
        role: token.role as Array<{ id: number; rol: string }>,
      };
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
