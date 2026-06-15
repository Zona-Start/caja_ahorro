import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { tenantSettings } from '@/database/schema';
import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { TenantProvisioningService } from '../services/tenant-provisioning.service';
import {
  CreateTenantSettingDto,
  UpdateTenantSettingDto,
} from './dto/tenant-settings.dto';

@Injectable()
export class TenantSettingsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly provisioningService: TenantProvisioningService,
  ) {}

  async findAllByTenant(tenantId: string, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.db;
    return db.query.tenantSettings.findMany({
      where: (s, { eq }) => eq(s.tenantId, tenantId),
      orderBy: (s, { asc }) => [asc(s.category), asc(s.key)],
    });
  }

  async findById(
    id: string,
    tenantId?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;

    const setting = await db.query.tenantSettings.findFirst({
      where: (s, { eq, and }) => {
        return tenantId
          ? and(eq(s.id, id), eq(s.tenantId, tenantId))
          : eq(s.id, id);
      },
    });

    if (!setting) {
      throw new NotFoundException(`Tenant setting with ID ${id} not found`);
    }

    return setting;
  }

  async findByTenantAndKey(
    tenantId: string,
    key: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    return db.query.tenantSettings.findFirst({
      where: (s, { and, eq }) => and(eq(s.tenantId, tenantId), eq(s.key, key)),
    });
  }

  async findByTenantAndCategory(
    tenantId: string,
    category: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    return db.query.tenantSettings.findMany({
      where: (s, { and, eq }) =>
        and(eq(s.tenantId, tenantId), eq(s.category, category)),
      orderBy: (s, { asc }) => [asc(s.key)],
    });
  }

  async findByTenantAndModule(
    tenantId: string,
    moduleCode: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    return db.query.tenantSettings.findMany({
      where: (s, { and, eq }) =>
        and(eq(s.tenantId, tenantId), eq(s.category, moduleCode)),
      orderBy: (s, { asc }) => [asc(s.key)],
    });
  }

  async create(
    tenantId: string,
    dto: CreateTenantSettingDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;

    if (dto.moduleCode) {
      const isActive = await this.provisioningService.isModuleActive(
        tenantId,
        dto.moduleCode,
        tx,
      );
      if (!isActive) {
        throw new BadRequestException(
          `Cannot save settings for module ${dto.moduleCode}: module is not active for this tenant`,
        );
      }
    }

    const existing = await this.findByTenantAndKey(tenantId, dto.key, tx);
    if (existing)
      throw new Error(
        `Setting with key "${dto.key}" already exists for this tenant`,
      );

    const [setting] = await db
      .insert(tenantSettings)
      .values({
        tenantId: tenantId,
        key: dto.key,
        value: dto.value,
        category: dto.moduleCode ?? dto.category,
      } as unknown as typeof tenantSettings.$inferInsert)
      .returning();

    return setting;
  }

  async update(
    id: string,
    dto: UpdateTenantSettingDto,
    tenantId: string,
    userId?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    await this.findById(id, tenantId, tx);

    const [updated] = await db
      .update(tenantSettings)
      .set({
        value: dto.value,
        updatedById: userId,
      })
      .where(
        and(eq(tenantSettings.id, id), eq(tenantSettings.tenantId, tenantId)),
      )
      .returning();
    return updated;
  }

  async remove(
    id: string,
    tenantId: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    await this.findById(id, tenantId, tx);
    await db.delete(tenantSettings).where(eq(tenantSettings.id, id));
    return { message: 'Setting deleted successfully' };
  }

  async upsert(
    tenantId: string,
    key: string,
    value: string,
    category: string = 'general',
    userId?: string,
    moduleCode?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    if (moduleCode) {
      const isActive = await this.provisioningService.isModuleActive(
        tenantId,
        moduleCode,
        tx,
      );
      if (!isActive) {
        throw new BadRequestException(
          `Cannot upsert settings for module ${moduleCode}: module is not active`,
        );
      }
    }

    const existing = await this.findByTenantAndKey(tenantId, key, tx);
    if (existing) {
      await this.update(existing.id, { value }, tenantId, userId, tx);
      return existing;
    }

    return this.create(
      tenantId,
      { key, value, category: moduleCode ?? category, moduleCode: moduleCode as any },
      tx,
    );
  }
}
