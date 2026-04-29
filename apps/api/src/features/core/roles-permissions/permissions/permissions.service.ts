import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  permissionActionEnum,
  permissionResourceEnum,
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
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreatePermissionDto } from './dtos/create-permission.dto';

type ResourceType = (typeof permissionResourceEnum.enumValues)[number];
type ActionType = (typeof permissionActionEnum.enumValues)[number];
type ScopeType = (typeof permissionScopeEnum.enumValues)[number];

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  async findAll(): Promise<any[]> {
    return await this.db.query.permissions.findMany({
      orderBy: (permissions, { desc }) => [desc(permissions.createdAt)],
    });
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
        eq(permissions.resource, resource as ResourceType),
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
        resource: createPermissionDto.resource as ResourceType,
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
