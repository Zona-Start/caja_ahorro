import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { users, roles, usersRole } from 'src/database/index';
import { eq, like, or, SQL, sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(paginationDto?: PaginationDto): Promise<{ data: User[], meta: any }> {
    const { page = 1, limit = 10, search = '', sortBy = 'id', sortOrder = 'asc' } = paginationDto || {};
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Build search condition
    let searchCondition: SQL<unknown> | undefined;
    if (search) {
      searchCondition = or(
        like(users.username, `%${search}%`),
        like(users.email, `%${search}%`),
        like(users.fullname, `%${search}%`)
      );
    }
    
    // Build sort condition
    const orderBy = sortOrder === 'asc' 
      ? sql`${users[sortBy as keyof typeof users]} asc` 
      : sql`${users[sortBy as keyof typeof users]} desc`;
    
    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(searchCondition);
    
    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get paginated data
    const data = await this.drizzle
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
      .where(searchCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Build pagination metadata
    const meta = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data, meta };
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
      .leftJoin(usersRole, eq(usersRole.userId, users.id))
      .leftJoin(roles, eq(roles.id, usersRole.roleId))
      .where(eq(users.id, parseInt(id)));

    if (find.length === 0) {
      throw new HttpException('User does not exist', HttpStatus.BAD_REQUEST);
    }

    return find[0];
  }

  // Rest of the service remains the same
  async create(
    createUserDto: CreateUserDto,
    roleId: number = 2,
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return await this.drizzle.transaction(async (tx) => {
      // Create the user with proper type assertion
      const newUser = await tx
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
        .returning()
        .then(rows => rows[0]);

      if (!newUser) {
        throw new HttpException('Failed to create user', HttpStatus.BAD_REQUEST);
      }

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
