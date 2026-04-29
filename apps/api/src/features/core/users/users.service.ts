import * as schema from '@/database/schema';
import { tenantMembers, userPermissions, users } from '@/database/schema';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, isNull, or, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import { AuditHelper } from '../../audit/audit-event.service';
import { SecurityService } from '../security/security.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserQueryDto } from './dtos/user-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly securityService: SecurityService,
    private readonly auditHelper: AuditHelper,
  ) {}

  async findAll(dto: UserQueryDto, currentTenantId?: string): Promise<any> {
    const { page = 1, limit = 10, search, status, tenantId } = dto;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [isNull(users.deletedAt)];

    const effectiveTenantId = currentTenantId || tenantId;

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(users.username, searchTerm),
          ilike(users.fullname, searchTerm),
          ilike(users.email, searchTerm),
        ) as SQL,
      );
    }

    if (status) {
      conditions.push(eq(users.status, status));
    }

    // Si hay un tenantId efectivo, filtramos por los miembros de ese tenant
    if (effectiveTenantId) {
      const members = await this.db.query.tenantMembers.findMany({
        where: eq(tenantMembers.tenantId, effectiveTenantId),
        columns: { userId: true },
      });
      const userIdsInTenant = members.map((m: any) => m.userId);
      if (userIdsInTenant.length === 0) {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }
      conditions.push(inArray(users.id, userIdsInTenant));
    }

    const whereClause = and(...conditions);

    const data = await this.db.query.users.findMany({
      where: whereClause,
      with: {
        tenantMembers: {
          with: {
            tenant: true,
            role: true,
          },
        },
      },
      orderBy: (u, { desc }) => [desc(u.createdAt)],
      limit,
      offset,
    });

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, tenantId?: string): Promise<any | null> {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, id), isNull(users.deletedAt)),
      with: {
        tenantMembers: {
          where: tenantId ? eq(tenantMembers.tenantId, tenantId) : undefined,
          with: {
            tenant: true,
            role: {
              with: {
                rolePermissions: { with: { permission: true } },
              },
            },
          },
        },
        userPermissions: {
          where: tenantId ? eq(userPermissions.tenantId, tenantId) : undefined,
          with: { permission: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByUsername(username: string): Promise<any | null> {
    return await this.db.query.users.findFirst({
      where: and(eq(users.username, username), isNull(users.deletedAt)),
      with: {
        tenantMembers: {
          with: {
            tenant: true,
            role: {
              with: {
                rolePermissions: { with: { permission: true } },
              },
            },
          },
        },
        userPermissions: {
          with: { permission: true },
        },
      },
    });
  }

  async create(dto: CreateUserDto, creatorTenantId?: string): Promise<any> {
    const existingUser = await this.db.query.users.findFirst({
      where: or(eq(users.username, dto.username), eq(users.email, dto.email)),
    });

    if (existingUser) {
      throw new ConflictException('Username or Email already exists');
    }

    const passwordHash = await this.securityService.hashPassword(dto.password);
    const targetTenantId = creatorTenantId || dto.tenantId;

    const newUser = await this.db.transaction(async (tx) => {
      // 1. Crear el usuario base
      const newUser = await tx
        .insert(users)
        .values({
          username: dto.username,
          passwordHash,
          fullname: dto.fullname,
          email: dto.email,
          status: dto.status || 'active',
          isSystemAdmin: dto.isSystemAdmin || false,
        })
        .returning();

      // 2. Si no es un usuario de sistema puro, lo vinculamos a un tenant

      if (targetTenantId && dto.roleId) {
        await tx.insert(tenantMembers).values({
          userId: newUser[0].id,
          tenantId: targetTenantId,
          roleId: dto.roleId,
          isActive: true,
        });
      }
      return newUser;
    });

    await this.auditHelper.logCreate(targetTenantId, 'user', newUser, {
      targetId: newUser[0].id,
      description: `Created user ${newUser[0].username}`,
    });

    return newUser;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    tenantId?: string,
  ): Promise<any> {
    const user = await this.findById(id, tenantId);
    if (!user) throw new NotFoundException('User not found');

    const previousValues = { ...user };
    const updateData: any = {
      fullname: dto.fullname,
      email: dto.email,
      status: dto.status,
      isSystemAdmin: dto.isSystemAdmin,
      updatedAt: new Date(),
    };

    if (dto.password) {
      updateData.passwordHash = await this.securityService.hashPassword(
        dto.password,
      );
    }

    const [updated] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    // Si se pasa un nuevo roleId, actualizamos el tenantMember para ese tenant
    if (tenantId && dto.roleId) {
      await this.db
        .update(tenantMembers)
        .set({ roleId: dto.roleId, updatedAt: new Date() })
        .where(
          and(
            eq(tenantMembers.userId, id),
            eq(tenantMembers.tenantId, tenantId),
          ),
        );
    }

    await this.auditHelper.logUpdate(
      tenantId,
      'user',
      previousValues,
      updated,
      { targetId: id, description: `Updated user ${user.username}` },
    );

    return updated;
  }

  async remove(id: string, tenantId?: string): Promise<void> {
    const user = await this.findById(id, tenantId);
    if (!user) throw new NotFoundException('User not found');

    const previousValues = { ...user };

    // Si se pasa tenantId, solo lo desactivamos de ese tenant?
    // O borrado lógico global? El requerimiento dice "filtrar por tenant".
    // Haremos borrado lógico global si es superadmin, o solo del miembro si es admin.
    if (tenantId) {
      await this.db
        .delete(tenantMembers)
        .where(
          and(
            eq(tenantMembers.userId, id),
            eq(tenantMembers.tenantId, tenantId),
          ),
        );
    } else {
      await this.db
        .update(users)
        .set({ deletedAt: new Date() })
        .where(eq(users.id, id));
    }

    await this.auditHelper.logDelete(tenantId, 'user', previousValues, {
      targetId: id,
      description: `Deleted user ${user.username} (context: ${tenantId || 'global'})`,
    });
  }

  async managePermissions(
    userId: string,
    tenantId: string,
    permissionIds: string[],
  ): Promise<void> {
    // 1. Limpiar permisos especiales previos para este usuario en este tenant
    await this.db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.tenantId, tenantId),
        ),
      );

    // 2. Insertar nuevos
    if (permissionIds.length > 0) {
      const values = permissionIds.map((pId) => ({
        userId,
        tenantId,
        permissionId: pId,
      }));
      await this.db.insert(userPermissions).values(values);
    }

    await this.auditHelper.logUpdate(
      tenantId,
      'user_permissions',
      {},
      { permissionIds },
      {
        targetId: userId,
        description: `Updated special permissions for user ${userId}`,
      },
    );
  }
}
