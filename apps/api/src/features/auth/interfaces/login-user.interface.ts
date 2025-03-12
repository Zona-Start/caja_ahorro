export interface LoginUserInterface {
  message: string;
  user: User;
  tokens: Tokens;
}

interface User {
  id: number;
  username: string;
  fullname: string;
  email?: string;
  rol: Roles[];
}

export interface Roles {
  id: number;
  rol: string;
}

interface Tokens {
  access_token: string;
  access_expire_in: number;
  refresh_token: string;
  refresh_expire_in: number;
}
