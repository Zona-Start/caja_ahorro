export class User {
  id: string;
  username: string;
  email: string;
  status: 'active' | 'inactive' | 'blocked';
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  passwordHash?: string;
}
