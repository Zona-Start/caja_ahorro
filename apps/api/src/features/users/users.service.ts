
import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { eq } from 'drizzle-orm';
import { User } from '@/features/users/entities/user.entity';
import { users, usersRole, roles } from 'src/database/index';


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
      .where(eq(users.id, id));

    if (find.length === 0) {
      throw new HttpException('User does not exist', HttpStatus.BAD_REQUEST);
    }

    return find[0];
  }
}
