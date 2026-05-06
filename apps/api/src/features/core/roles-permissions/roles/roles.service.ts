import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  permissionActionEnum,
  permissionResourceEnum,
  permissionScopeEnum,
  roles,
} from '@/database/schema';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, isNull, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateRoleDto } from './dtos/create-role.dto';
import { RoleQueryDto } from './dtos/roles-query.dto';

type ResourceType = (typeof permissionResourceEnum.enumValues)[number];
type ActionType = (typeof permissionActionEnum.enumValues)[number];
type ScopeType = (typeof permissionScopeEnum.enumValues)[number];

@Injectable()
export class RolesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  async findAll(dto: RoleQueryDto, currentTenantId?: string): Promise<any> {
    const { page = 1, limit = 10, search, tenantId } = dto;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [isNull(roles.deletedAt)];

    const effectiveTenantId = currentTenantId || tenantId;
    if (effectiveTenantId) {
      conditions.push(eq(roles.tenantId, effectiveTenantId));
    }

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(roles.name, searchTerm),
          ilike(roles.description, searchTerm),
        ) as SQL,
      );
    }

    const whereClause = and(...conditions);

    const data = await this.db.query.roles.findMany({
      where: whereClause,
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
      },
      orderBy: (r, { desc }) => [desc(r.createdAt)],
      limit,
      offset,
    });

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(roles)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, tenantId?: string): Promise<any | null> {
    const condition = tenantId
      ? and(
          eq(roles.id, id),
          eq(roles.tenantId, tenantId),
          isNull(roles.deletedAt),
        )
      : and(eq(roles.id, id), isNull(roles.deletedAt));

    return await this.db.query.roles.findFirst({
      where: condition,
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
      },
    });
  }

  async findByName(name: string, tenantId: string): Promise<any | null> {
    return await this.db.query.roles.findFirst({
      where: and(
        eq(roles.name, name),
        eq(roles.tenantId, tenantId),
        isNull(roles.deletedAt),
      ),
    });
  }

  async create(
    createRoleDto: CreateRoleDto,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const existingRole = await this.findByName(createRoleDto.name, tenantId);
    if (existingRole) {
      throw new ConflictException('Role already exists for this tenant');
    }

    const [newRole] = await this.db
      .insert(roles)
      .values({
        tenantId: tenantId,
        name: createRoleDto.name,
        description: createRoleDto.description,
        isDefault: createRoleDto.isDefault || false,
        createdById: userId,
      })
      .returning();

    await this.auditHelper.logCreate(newRole.tenantId, 'role', newRole, {
      targetId: newRole.id,
      description: `Created role ${newRole.name}`,
    });

    return newRole;
  }

  async update(
    id: string,
    dto: Partial<CreateRoleDto>,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const role = await this.findById(id, tenantId);
    if (!role) throw new NotFoundException('Role not found');

    const previousValues = { ...role };

    const [updated] = await this.db
      .update(roles)
      .set({
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault,
        updatedAt: new Date(),
        updatedById: userId,
      })
      .where(and(eq(roles.id, id), eq(roles.tenantId, tenantId)))
      .returning();

    if (!updated) {
      throw new NotFoundException('Role not found after update');
    }

    await this.auditHelper.logUpdate(
      updated.tenantId,
      'role',
      previousValues,
      updated,
      { targetId: id, description: `Updated role ${updated.name}` },
    );

    return updated;
  }

  async remove(id: string, tenantId: string, userId?: string): Promise<void> {
    const role = await this.findById(id, tenantId);
    if (!role) throw new NotFoundException('Role not found');

    if (role.isDefault) {
      throw new ConflictException('Cannot delete default role');
    }

    const previousValues = { ...role };

    await this.db
      .update(roles)
      .set({ deletedAt: new Date(), updatedById: userId })
      .where(and(eq(roles.id, id), eq(roles.tenantId, tenantId)));

    await this.auditHelper.logDelete(role.tenantId, 'role', previousValues, {
      targetId: id,
      description: `Deleted role ${role.name}`,
    });
  }
}
