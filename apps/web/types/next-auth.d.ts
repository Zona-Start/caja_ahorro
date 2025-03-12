import 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    access_token: string;
    access_expire_in: number;
    refresh_token: string;
    refresh_expire_in: number;
    user: {
      id: number;
      username: string;
      fullname: string;
      email: string;
      // role: {
      //   id: number;
      //   name: string;
      // }[];
    };
  }

  interface User extends DefaultUser {
    id: number;
    username: string;
    fullname: string;
    email: string;
    // role: string;
    access_token: string;
    access_expire_in: number;
    refresh_token: string;
    refresh_expire_in: number;
  }

  interface CredentialsInputs {
    identifier: string;
    password: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: number;
    username: string;
    fullname: string;
    email: string;
    // role: string;
    access_token: string;
    access_expire_in: number;
    refresh_token: string;
    refresh_expire_in: number;
  }
}
