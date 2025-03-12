import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import {  users, usersRole } from '../index';

export async function seedUserAdmin(db: NodePgDatabase<typeof schema>) {

  // Insert admin user
  try {
    // Password is already hashed in your SQL, but in a real application you might want to hash it here
    // const hashedPassword = await hash('your_password', 10);
    const hashedPassword = '$2b$10$6esl7d/BOINamScuReRoPuYFC8iSJgpk61LHm2X3PCU5hu/St8vHW';

    const [adminUser] = await db.insert(users).values({
      username: 'superadmin',
      email: 'admin@zonastart.com',
      fullname: 'Super Administrador',
      password: hashedPassword,
      isTwoFactorEnabled: false,
      isEmailVerified: true,
      isActive: true
    }).returning({ id: users.id }).onConflictDoNothing();

    if (adminUser) {
      // Assign superadmin role to the user
      await db.insert(usersRole).values({
        roleId: 1, // Assuming 'superadmin' has ID 1 based on the insert order
        userId: adminUser.id
      }).onConflictDoNothing();
      console.log('Admin user created and assigned superadmin role');
    } else {
      console.log('Admin user already exists, skipping');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}