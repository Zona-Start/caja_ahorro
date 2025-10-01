import { SignInAction } from '@/feactures/auth/actions/login-action';
import { logoutAction } from '@/feactures/auth/actions/logout-action';
import { resfreshTokenAction } from '@/feactures/auth/actions/refresh-token-action';
import { CredentialsSignin, NextAuthConfig, Session, User } from 'next-auth';
import { DefaultJWT, JWT } from 'next-auth/jwt';
import CredentialProvider from 'next-auth/providers/credentials';

let isRefreshing = false; // Bandera para evitar múltiples solicitudes de refresco

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
      ): Promise<User | null> {
        const credential = {
          username: credentials?.username as string,
          password: credentials?.password as string,
        };

        const response = await SignInAction(credential);
        if (
          response &&
          'type' in response &&
          (response.type === 'API_ERROR' ||
            response.type === 'VALIDATION_ERROR')
        ) {
          throw new CredentialsSignin(response.message);
        }

        if (response !== null && 'user' in response && response.user) {
          return {
            id: response.user.id.toString(),
            username: response.user.username,
            fullname: response.user.fullname,
            email: response.user.email,
            role: response.user.rol,
            access_token: response.tokens.access_token,
            access_expire_in: response.tokens.access_expire_in,
            refresh_token: response.tokens.refresh_token,
            refresh_expire_in: response.tokens.refresh_expire_in,
          };
        } else {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/', //sigin page
    //error: '/error',
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: User }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          username: user.username,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
          access_token: user.access_token,
          access_expire_in: user.access_expire_in,
          refresh_token: user.refresh_token,
          refresh_expire_in: user.refresh_expire_in,
        };
      }

      const now = Math.floor(Date.now() / 1000);

      /* 2. ¿refresh token caducado? → logout */
      if (now > (token.refresh_expire_in as number)) {
        return null;
      }

      /* 3. ¿access token aún válido? → no tocar */
      if (now < (token.access_expire_in as number)) {
        return token;
      }

      /* 4. Access token caducado pero refresh token válido → refrescar */
      try {
        const res = await resfreshTokenAction({
          token: token.refresh_token as string,
        });

        // Ahora puedes validar la propiedad 'type' del objeto devuelto
        if (res.type === 'API_ERROR') {
          return null; // Forzar logout
        }

        if (res.tokens) {
          return {
            ...token, // Mantenemos datos como id, email, role, etc.
            access_token: res.tokens.access_token,
            access_expire_in: res.tokens.access_expire_in,
            refresh_token: res.tokens.refresh_token,
            refresh_expire_in: res.tokens.refresh_expire_in,
          };
        }
      } catch (error) {
        // En caso de error inesperado, también forzamos el logout
        return null;
      }
    },
    async session({ session, token }: { session: Session; token: DefaultJWT }) {
      if (token) {
        session.user = {
          id: token.id as number,
          username: token.username as string,
          fullname: token.fullname as string,
          email: token.email as string,
          role: token.role as Array<{ id: number; rol: string }>,
        };
        session.access_token = token.access_token as string;
        session.access_expire_in = token.access_expire_in as number;
        session.refresh_token = token.refresh_token as string;
        session.refresh_expire_in = token.refresh_expire_in as number;
      }

      return session;
    },
  },
  events: {
    async signOut(message) {
      // 1.  verificamos que venga token (puede no venir con algunos providers)
      const token = (message as { token?: JWT }).token;
      if (!token?.access_token) return;
      try {
        await logoutAction(String(token?.id));
      } catch {
        /* silencioso para que next-auth siempre cierre */
      }
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
