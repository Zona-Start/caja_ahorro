import { User } from '@/features/users/entities/user.entity';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { roles, users, usersRole } from 'src/database/index';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.drizzle
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullname: users.fullname,
        phone: users.phone,
        isActive: users.isActive,
        role: roles.name,
      })
      .from(users)
      .leftJoin(usersRole, eq(usersRole.id, users.id))
      .leftJoin(roles, eq(roles.id, usersRole.roleId));
  }

  async findOne(id: string): Promise<User> {
    const find = await this.drizzle
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullname: users.fullname,
        phone: users.phone,
        isActive: users.isActive,
        role: roles.name,
      })
      .from(users)
      .leftJoin(usersRole, eq(usersRole.id, users.id))
      .leftJoin(roles, eq(roles.id, usersRole.roleId))
      .where(eq(users.id, parseInt(id)));

    if (find.length === 0) {
      throw new HttpException('User does not exist', HttpStatus.BAD_REQUEST);
    }

    return find[0];
  }

  async create(
    createUserDto: CreateUserDto,
    roleId: number = 2,
  ): Promise<User> {
    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Start a transaction
    return await this.drizzle.transaction(async (tx) => {
      // Create the user
      const [newUser] = await tx
        .insert(users)
        .values({
          username: createUserDto.username,
          email: createUserDto.email,
          password: hashedPassword,
          fullname: createUserDto.fullname,
          isActive: true,
          phone: createUserDto.phone,
          isEmailVerified: false,
          isTwoFactorEnabled: false,
        })
        .returning();

      // Assign role to user
      await tx.insert(usersRole).values({
        userId: newUser.id,
        roleId: roleId,
      });

      // Return the created user with role
      const [userWithRole] = await tx
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          fullname: users.fullname,
          phone: users.phone,
          isActive: users.isActive,
          role: roles.name,
        })
        .from(users)
        .leftJoin(usersRole, eq(usersRole.userId, users.id))
        .leftJoin(roles, eq(roles.id, usersRole.roleId))
        .where(eq(users.id, newUser.id));

      return userWithRole;
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const userId = parseInt(id);

    // Check if user exists
    await this.findOne(id);

    // Prepare update data
    const updateData: any = {};
    if (updateUserDto.username) updateData.username = updateUserDto.username;
    if (updateUserDto.email) updateData.email = updateUserDto.email;
    if (updateUserDto.fullname) updateData.fullname = updateUserDto.fullname;
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    await this.drizzle
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    // Return updated user
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const userId = parseInt(id);

    // Check if user exists
    await this.findOne(id);

    // Delete user (this will cascade delete related records due to foreign key constraints)
    await this.drizzle.delete(users).where(eq(users.id, userId));

    return { message: 'User deleted successfully' };
  }
}
