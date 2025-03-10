import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { users, roles, usersRole } from 'src/database/index';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class UserRolesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async getRolesByUserId(userId: number) {
    // Check if user exists
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (user.length === 0) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Get roles for the user
    const userRoles = await this.drizzle
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(usersRole)
      .leftJoin(roles, eq(roles.id, usersRole.roleId))
      .where(eq(usersRole.userId, userId));

    return userRoles;
  }

  async assignRoleToUser(assignRoleDto: AssignRoleDto) {
    const { userId, roleId } = assignRoleDto;

    // Check if user exists
    const user = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (user.length === 0) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Check if role exists
    const role = await this.drizzle
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));

    if (role.length === 0) {
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }

    // Check if the user already has this role
    const existingUserRole = await this.drizzle
      .select()
      .from(usersRole)
      .where(
        and(
          eq(usersRole.userId, userId),
          eq(usersRole.roleId, roleId),
        ),
      );

    if (existingUserRole.length > 0) {
      throw new HttpException('User already has this role', HttpStatus.BAD_REQUEST);
    }

    // Assign role to user
    await this.drizzle.insert(usersRole).values({
      userId,
      roleId,
    });

    // Return the updated roles
    return this.getRolesByUserId(userId);
  }

  async removeRoleFromUser(userId: number, roleId: number) {
    // Check if the user-role relationship exists
    const userRole = await this.drizzle
      .select()
      .from(usersRole)
      .where(
        and(
          eq(usersRole.userId, userId),
          eq(usersRole.roleId, roleId),
        ),
      );

    if (userRole.length === 0) {
      throw new HttpException(
        'User-role relationship not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Remove the role from the user
    await this.drizzle
      .delete(usersRole)
      .where(
        and(
          eq(usersRole.userId, userId),
          eq(usersRole.roleId, roleId),
        ),
      );

    return { message: 'Role removed from user successfully' };
  }
}