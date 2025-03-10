import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { roles } from 'src/database/index';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<Role[]> {
    return await this.drizzle.select().from(roles);
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.drizzle
      .select()
      .from(roles)
      .where(eq(roles.id, id));

    if (role.length === 0) {
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }

    return role[0];
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const [role] = await this.drizzle
      .insert(roles)
      .values({
        name: createRoleDto.name,
      })
      .returning();

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    // Check if role exists
    await this.findOne(id);

    await this.drizzle
      .update(roles)
      .set({
        name: updateRoleDto.name,
      })
      .where(eq(roles.id, id));

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    // Check if role exists
    await this.findOne(id);

    await this.drizzle.delete(roles).where(eq(roles.id, id));

    return { message: 'Role deleted successfully' };
  }
}
