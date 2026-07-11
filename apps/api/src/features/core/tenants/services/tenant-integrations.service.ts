import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { tenantModuleIntegrations } from '@/database/schema';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ConfigureIntegrationDto } from '../dto/tenant-integrations.dto';

@Injectable()
export class TenantIntegrationService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}

  async configure(
    tenantId: string,
    dto: ConfigureIntegrationDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const existing = await this.findBySourceAndTarget(
      tenantId,
      dto.sourceModule,
      dto.targetModule,
      tx,
    );

    if (existing) {
      const [updated] = await db
        .update(tenantModuleIntegrations)
        .set({
          isEnabled: dto.isEnabled,
          config: dto.config ?? existing.config,
        })
        .where(eq(tenantModuleIntegrations.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(tenantModuleIntegrations)
      .values({
        tenantId,
        sourceModule: dto.sourceModule as any,
        targetModule: dto.targetModule as any,
        isEnabled: dto.isEnabled,
        config: dto.config,
      })
      .returning();
    return created;
  }

  async toggle(
    tenantId: string,
    sourceModule: string,
    targetModule: string,
    isEnabled: boolean,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const existing = await this.findBySourceAndTarget(
      tenantId,
      sourceModule,
      targetModule,
      tx,
    );
    if (!existing) {
      throw new NotFoundException(
        `Integration from ${sourceModule} to ${targetModule} not found`,
      );
    }

    const [updated] = await db
      .update(tenantModuleIntegrations)
      .set({ isEnabled })
      .where(eq(tenantModuleIntegrations.id, existing.id))
      .returning();
    return updated;
  }

  async findAllByTenant(
    tenantId: string,
    isEnabled?: boolean,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    return db.query.tenantModuleIntegrations.findMany({
      where: (tmi, { eq, and }) => {
        const conditions: SQL[] = [eq(tmi.tenantId, tenantId)];
        if (isEnabled !== undefined) {
          conditions.push(eq(tmi.isEnabled, isEnabled));
        }
        return and(...conditions);
      },
      orderBy: (tmi, { asc }) => [asc(tmi.sourceModule), asc(tmi.targetModule)],
    });
  }

  async findBySourceAndTarget(
    tenantId: string,
    sourceModule: string,
    targetModule: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    return db.query.tenantModuleIntegrations.findFirst({
      where: (tmi, { eq, and }) =>
        and(
          eq(tmi.tenantId, tenantId),
          eq(tmi.sourceModule, sourceModule as any),
          eq(tmi.targetModule, targetModule as any),
        ),
    });
  }

  async remove(
    tenantId: string,
    sourceModule: string,
    targetModule: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const existing = await this.findBySourceAndTarget(
      tenantId,
      sourceModule,
      targetModule,
      tx,
    );
    if (!existing) {
      throw new NotFoundException(
        `Integration from ${sourceModule} to ${targetModule} not found`,
      );
    }
    await db
      .delete(tenantModuleIntegrations)
      .where(eq(tenantModuleIntegrations.id, existing.id));
    return { message: 'Integration deleted successfully' };
  }
}
