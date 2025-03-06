export class User {
  id?: string;
  username!: string;
  email!: string;
  fullname!: string;
  phone?: string | null;
  password?: string;
  isTwoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  isEmailVerified?: boolean;
  isActive!: boolean;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export class UserRole {
  id!: string;
  userId!: string;
  roleId!: number;
  created_at?: Date | null;
  updated_at?: Date | null;
}
