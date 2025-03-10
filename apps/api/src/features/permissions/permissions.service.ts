import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { permissions } from 'src/database/index';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return await this.drizzle.select().from(permissions);
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.drizzle
      .select()
      .from(permissions)
      .where(eq(permissions.id, id));

    if (permission.length === 0) {
      throw new HttpException('Permission not found', HttpStatus.NOT_FOUND);
    }

    return permission[0];
  }

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const [permission] = await this.drizzle
      .insert(permissions)
      .values({
        name: createPermissionDto.name,
      })
      .returning();

    return permission;
  }

  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    // Check if permission exists
    await this.findOne(id);

    await this.drizzle
      .update(permissions)
      .set({
        name: updatePermissionDto.name,
      })
      .where(eq(permissions.id, id));

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    // Check if permission exists
    await this.findOne(id);

    await this.drizzle.delete(permissions).where(eq(permissions.id, id));

    return { message: 'Permission deleted successfully' };
  }
}
