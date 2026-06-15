import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  permissionActionEnum,
  permissions,
  permissionScopeEnum,
} from '@/database/schema';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { PermissionPaginationDto } from './dtos/permission-pagination.dto';

type ActionType = (typeof permissionActionEnum)[number];
type ScopeType = (typeof permissionScopeEnum)[number];

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) { }

  async findAll(): Promise<any[]> {
    return await this.db.query.permissions.findMany({
      orderBy: (permissions, { desc }) => [desc(permissions.createdAt)],
    });
  }

  async findAllByPagination(
    paginationDto?: PermissionPaginationDto,
  ): Promise<{ data: any[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      searchType = '',
      sortBy = 'id',
      sortOrder = 'asc',
      resource,
      action,
      scope,
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      switch (searchType) {
        case 'name':
          searchConditions.push(ilike(permissions.name, `%${search}%`));
          break;
        case 'resource':
          searchConditions.push(ilike(permissions.resource, `%${search}%`));
          break;
        case 'action':
          searchConditions.push(ilike(permissions.action, `%${search}%`));
          break;
      }
    }

    if (resource) {
      searchConditions.push(eq(permissions.resource, resource));
    }

    if (action) {
      searchConditions.push(eq(permissions.action, action as ActionType));
    }

    if (scope) {
      searchConditions.push(eq(permissions.scope, scope as ScopeType));
    }

    const searchCondition = and(...searchConditions);

    const orderByColumn = permissions[sortBy as keyof typeof permissions];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(permissions)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select()
      .from(permissions)
      .where(searchCondition)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

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

    return {
      data,
      meta,
    };
  }

  async findById(id: string): Promise<any | null> {
    return await this.db.query.permissions.findFirst({
      where: eq(permissions.id, id),
    });
  }

  async findByResourceAndAction(
    resource: string,
    action: string,
    scope?: string,
  ): Promise<any | null> {
    return await this.db.query.permissions.findFirst({
      where: and(
        eq(permissions.resource, resource),
        eq(permissions.action, action as ActionType),
        scope ? eq(permissions.scope, scope as ScopeType) : undefined,
      ),
    });
  }

  async create(
    createPermissionDto: CreatePermissionDto,
    userId: string,
  ): Promise<any> {
    const existingPermission = await this.findByResourceAndAction(
      createPermissionDto.resource,
      createPermissionDto.action,
      createPermissionDto.scope,
    );

    if (existingPermission) {
      throw new ConflictException(
        `Permission ${createPermissionDto.resource}:${createPermissionDto.action}:${createPermissionDto.scope || 'own'} already exists`,
      );
    }

    const [newPermission] = await this.db
      .insert(permissions)
      .values({
        name: createPermissionDto.name,
        resource: createPermissionDto.resource,
        action: createPermissionDto.action as ActionType,
        scope: createPermissionDto.scope as ScopeType,
        description: createPermissionDto.description,
        isActive: true,
        createdById: userId,
      })
      .returning();

    await this.auditHelper.logCreate(undefined, 'permission', newPermission, {
      targetId: newPermission.id,
      description: `Created global permission ${newPermission.resource}:${newPermission.action}`,
    });

    return newPermission;
  }

  async remove(id: string): Promise<void> {
    const permission = await this.findById(id);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const previousValues = { ...permission };

    await this.db.delete(permissions).where(eq(permissions.id, id));

    await this.auditHelper.logDelete(undefined, 'permission', previousValues, {
      targetId: id,
      description: `Deleted global permission ${permission.resource}:${permission.action}`,
    });
  }
}
