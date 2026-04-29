import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { globalSettings, moduleSettings } from '@/database/schema';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  CreateGlobalSettingDto,
  CreateModuleSettingDto,
  SettingsQueryDto,
  UpdateGlobalSettingDto,
  UpdateModuleSettingDto,
} from './dto/settings.dto';

/**
 * Servicio para gestionar configuraciones del sistema
 * Incluye settings globales y settings por módulo/submódulo
 */
@Injectable()
export class SettingsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  // ==================== Global Settings ====================

  async getGlobal(
    key: string,
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<string | null> {
    const db = tx ?? this.db;
    const setting = await db.query.globalSettings.findFirst({
      where: (s, { eq }) => eq(s.key, key),
    });
    return setting?.value || null;
  }

  async createGlobal(
    dto: CreateGlobalSettingDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const [created] = await db
      .insert(globalSettings)
      .values({
        key: dto.key,
        value: dto.value,
        description: dto.description,
        category: dto.category,
      })
      .returning();

    await this.auditHelper.logCreate(undefined, 'global_setting', created, {
      targetId: created.id,
      description: `Created global setting ${dto.key}`,
    });

    return created;
  }

  async updateGlobal(
    id: string,
    dto: UpdateGlobalSettingDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const previous = await db.query.globalSettings.findFirst({
      where: (s, { eq }) => eq(s.id, id),
    });
    if (!previous) throw new NotFoundException('Global setting not found');

    const [updated] = await db
      .update(globalSettings)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(globalSettings.id, id))
      .returning();

    await this.auditHelper.logUpdate(
      undefined,
      'global_setting',
      previous,
      updated,
      {
        targetId: id,
        description: `Updated global setting ${previous.key}`,
      },
    );

    return updated;
  }

  async removeGlobal(id: string, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.db;
    const previous = await db.query.globalSettings.findFirst({
      where: (s, { eq }) => eq(s.id, id),
    });
    if (!previous) throw new NotFoundException('Global setting not found');

    await db.delete(globalSettings).where(eq(globalSettings.id, id));

    await this.auditHelper.logDelete(undefined, 'global_setting', previous, {
      targetId: id,
      description: `Deleted global setting ${previous.key}`,
    });

    return { message: 'Global setting deleted successfully' };
  }

  async findAllGlobal(
    dto: SettingsQueryDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const { page = 1, limit = 10, search, category } = dto;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (category) conditions.push(eq(globalSettings.category, category));
    if (search) {
      conditions.push(
        or(
          ilike(globalSettings.key, `%${search}%`),
          ilike(globalSettings.description, `%${search}%`),
        ) as SQL,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.globalSettings.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (s, { asc }) => [asc(s.category), asc(s.key)],
    });

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(globalSettings)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ==================== Module Settings ====================

  async getModule(
    tenantId: string,
    module: string,
    key: string,
    submodule = '',
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const setting = await db.query.moduleSettings.findFirst({
      where: (s, { and, eq }) =>
        and(
          eq(s.tenantId, tenantId),
          eq(s.module, module),
          eq(s.submodule, submodule),
          eq(s.key, key),
        ),
    });
    return setting?.value || null;
  }

  async createModule(
    dto: CreateModuleSettingDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const [created] = await db
      .insert(moduleSettings)
      .values({
        tenantId: dto.tenantId,
        module: dto.module,
        submodule: dto.submodule,
        key: dto.key,
        value: dto.value,
        description: dto.description,
      })
      .returning();

    await this.auditHelper.logCreate(dto.tenantId, 'module_setting', created, {
      targetId: created.id,
      description: `Created module setting ${dto.module}/${dto.key} for tenant ${dto.tenantId}`,
    });

    return created;
  }

  async updateModule(
    id: string,
    dto: UpdateModuleSettingDto,
    tenantId?: string,
    userId?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;

    // Si tenantId está presente, validamos propiedad
    const whereCondition = tenantId
      ? and(eq(moduleSettings.id, id), eq(moduleSettings.tenantId, tenantId))
      : eq(moduleSettings.id, id);

    const previous = await db.query.moduleSettings.findFirst({
      where: whereCondition,
    });
    if (!previous)
      throw new NotFoundException('Module setting not found or unauthorized');

    const [updated] = await db
      .update(moduleSettings)
      .set({
        ...dto,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(moduleSettings.id, id))
      .returning();

    await this.auditHelper.logUpdate(
      previous.tenantId,
      'module_setting',
      previous,
      updated,
      {
        targetId: id,
        description: `Updated module setting ${previous.module}/${previous.key}`,
      },
    );

    return updated;
  }

  async removeModule(id: string, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.db;
    const previous = await db.query.moduleSettings.findFirst({
      where: (s, { eq }) => eq(s.id, id),
    });
    if (!previous) throw new NotFoundException('Module setting not found');

    await db.delete(moduleSettings).where(eq(moduleSettings.id, id));

    await this.auditHelper.logDelete(
      previous.tenantId,
      'module_setting',
      previous,
      {
        targetId: id,
        description: `Deleted module setting ${previous.module}/${previous.key}`,
      },
    );

    return { message: 'Module setting deleted successfully' };
  }

  async findAllModule(
    dto: SettingsQueryDto,
    currentTenantId?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const { page = 1, limit = 10, search, module, submodule, tenantId } = dto;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    // Si no es superadmin (no tiene tenantId en query o queremos forzar el del contexto)
    const effectiveTenantId = currentTenantId || tenantId;
    if (effectiveTenantId) {
      conditions.push(eq(moduleSettings.tenantId, effectiveTenantId));
    }

    if (module) conditions.push(eq(moduleSettings.module, module));
    if (submodule) conditions.push(eq(moduleSettings.submodule, submodule));

    if (search) {
      conditions.push(
        or(
          ilike(moduleSettings.key, `%${search}%`),
          ilike(moduleSettings.description, `%${search}%`),
        ) as SQL,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.moduleSettings.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (s, { asc }) => [asc(s.module), asc(s.submodule), asc(s.key)],
    });

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(moduleSettings)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
