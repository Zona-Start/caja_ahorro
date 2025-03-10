export class User {
  id?: number;
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
  id!: number;
  userId!: number;
  roleId!: number;
  created_at?: Date | null;
  updated_at?: Date | null;
}
