import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { moduleSettings, tenantModules } from '@/database/schema';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class TenantProvisioningService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}

  async activate(
    tenantId: string,
    moduleCode: string,
    activatedBy?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const existing = await this.findByTenantAndModule(tenantId, moduleCode, tx);

    if (existing) {
      if (existing.status === 'ENABLED') {
        return existing;
      }
      const [updated] = await db
        .update(tenantModules)
        .set({
          status: 'ENABLED',
          activatedAt: new Date(),
          activatedBy,
          deactivatedAt: null,
          deactivatedBy: null,
        })
        .where(eq(tenantModules.id, existing.id))
        .returning();

      await db
        .update(moduleSettings)
        .set({ isActive: true })
        .where(
          and(
            eq(moduleSettings.tenantId, tenantId),
            eq(moduleSettings.module, moduleCode.toLowerCase()),
          ),
        );

      return updated;
    }

    const [created] = await db
      .insert(tenantModules)
      .values({
        tenantId,
        moduleCode: moduleCode as any,
        status: 'ENABLED',
        activatedBy,
      })
      .returning();
    return created;
  }

  async deactivate(
    tenantId: string,
    moduleCode: string,
    deactivatedBy?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const existing = await this.findByTenantAndModule(tenantId, moduleCode, tx);
    if (!existing) {
      throw new NotFoundException(
        `Module ${moduleCode} is not provisioned for this tenant`,
      );
    }

    const [updated] = await db
      .update(tenantModules)
      .set({
        status: 'DISABLED',
        deactivatedAt: new Date(),
        deactivatedBy,
      })
      .where(eq(tenantModules.id, existing.id))
      .returning();

    await db
      .update(moduleSettings)
      .set({ isActive: false })
      .where(
        and(
          eq(moduleSettings.tenantId, tenantId),
          eq(moduleSettings.module, moduleCode.toLowerCase()),
        ),
      );

    return updated;
  }

  async isModuleActive(
    tenantId: string,
    moduleCode: string,
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<boolean> {
    const db = tx ?? this.db;
    const record = await this.findByTenantAndModule(tenantId, moduleCode, tx);
    return record?.status === 'ENABLED';
  }

  async findAllByTenant(
    tenantId: string,
    status?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    return db.query.tenantModules.findMany({
      where: (tm, { eq, and }) => {
        const conditions: SQL[] = [eq(tm.tenantId, tenantId)];
        if (status) {
          conditions.push(eq(tm.status, status as any));
        }
        return and(...conditions);
      },
      orderBy: (tm, { asc }) => [asc(tm.moduleCode)],
    });
  }

  async findByTenantAndModule(
    tenantId: string,
    moduleCode: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    return db.query.tenantModules.findFirst({
      where: (tm, { eq, and }) =>
        and(eq(tm.tenantId, tenantId), eq(tm.moduleCode, moduleCode as any)),
    });
  }

  async toggleStatus(
    tenantId: string,
    moduleCode: string,
    newStatus: 'ENABLED' | 'DISABLED' | 'SETUP_REQUIRED',
    userId?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    if (newStatus === 'ENABLED') {
      return this.activate(tenantId, moduleCode, userId, tx);
    }
    return this.deactivate(tenantId, moduleCode, userId, tx);
  }
}
