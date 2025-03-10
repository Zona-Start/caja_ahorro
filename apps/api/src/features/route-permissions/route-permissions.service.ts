import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { routePermissions, permissions } from '@/database/index';
import { CreateRoutePermissionDto } from './dto/create-route-permission.dto';
import { UpdateRoutePermissionDto } from './dto/update-route-permission.dto';
import { RoutePermission } from './entities/route-permission.entity';

@Injectable()
export class RoutePermissionsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<RoutePermission[]> {
    return await this.drizzle.select().from(routePermissions);
  }

  async findOne(id: number): Promise<RoutePermission> {
    const routePermission = await this.drizzle
      .select()
      .from(routePermissions)
      .where(eq(routePermissions.id, id));

    if (routePermission.length === 0) {
      throw new HttpException('Route permission not found', HttpStatus.NOT_FOUND);
    }

    return routePermission[0];
  }

  async findByRoute(route: string): Promise<RoutePermission[]> {
    return await this.drizzle
      .select()
      .from(routePermissions)
      .where(eq(routePermissions.route, route));
  }

  async create(createRoutePermissionDto: CreateRoutePermissionDto): Promise<RoutePermission> {
    // Check if permission exists
    const permission = await this.drizzle
      .select()
      .from(permissions)
      .where(eq(permissions.id, createRoutePermissionDto.permissionId));

    if (permission.length === 0) {
      throw new HttpException('Permission not found', HttpStatus.NOT_FOUND);
    }

    const [routePermission] = await this.drizzle
      .insert(routePermissions)
      .values({
        route: createRoutePermissionDto.route,
        permissionId: createRoutePermissionDto.permissionId,
      })
      .returning();

    return routePermission;
  }

  async update(id: number, updateRoutePermissionDto: UpdateRoutePermissionDto): Promise<RoutePermission> {
    // Check if route permission exists
    await this.findOne(id);

    // Check if permission exists if permissionId is provided
    if (updateRoutePermissionDto.permissionId) {
      const permission = await this.drizzle
        .select()
        .from(permissions)
        .where(eq(permissions.id, updateRoutePermissionDto.permissionId));

      if (permission.length === 0) {
        throw new HttpException('Permission not found', HttpStatus.NOT_FOUND);
      }
    }

    await this.drizzle
      .update(routePermissions)
      .set({
        route: updateRoutePermissionDto.route,
        permissionId: updateRoutePermissionDto.permissionId,
        updated_at: new Date(),
      })
      .where(eq(routePermissions.id, id));

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    // Check if route permission exists
    await this.findOne(id);

    await this.drizzle.delete(routePermissions).where(eq(routePermissions.id, id));

    return { message: 'Route permission deleted successfully' };
  }

  async getPermissionsByRoute(route: string): Promise<any[]> {
    return await this.drizzle
      .select({
        id: permissions.id,
        name: permissions.name,
        route: routePermissions.route,
      })
      .from(routePermissions)
      .leftJoin(permissions, eq(permissions.id, routePermissions.permissionId))
      .where(eq(routePermissions.route, route));
  }
}