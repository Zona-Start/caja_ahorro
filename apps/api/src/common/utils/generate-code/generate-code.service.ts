import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/schema';
import { moduleSettings } from 'src/database/schema/tables/core';

@Injectable()
export class GenerateCodeService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) { }

  private findSetting(
    tx: NodePgDatabase<typeof schema>,
    tenantId: string,
    module: string,
    submodule: string,
    key: string,
  ) {
    return tx
      .select()
      .from(moduleSettings)
      .where(
        and(
          eq(moduleSettings.tenantId, tenantId),
          eq(moduleSettings.module, module),
          eq(moduleSettings.submodule, submodule),
          eq(moduleSettings.key, key),
        ),
      )
      .for('update')
      .limit(1);
  }

  async generateCustomReference(
    tenantId: string,
    module: string,
    submodule: string,
    key: string,
    abbreviation: string,
  ): Promise<string> {
    try {
      const result = await this.db.transaction(async (tx) => {
        const [setting] = await this.findSetting(
          tx,
          tenantId,
          module,
          submodule,
          key,
        );

        if (!setting) {
          throw new NotFoundException(
            `Module setting '${module}/${submodule}/${key}' not found for tenant.`,
          );
        }

        const currentNumber = parseInt(setting?.value || '0', 10);
        if (isNaN(currentNumber)) {
          throw new InternalServerErrorException(
            `Invalid number format for setting '${key}'.`,
          );
        }

        const nextNumber = currentNumber + 1;
        const nextValue = nextNumber.toString().padStart(5, '0');

        await tx
          .update(moduleSettings)
          .set({ value: nextValue, updatedAt: new Date() })
          .where(eq(moduleSettings.id, setting.id));

        return nextValue;
      });

      return `${abbreviation}-${result}`;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to generate custom reference.',
      );
    }
  }

  async updateValueSetting(
    tenantId: string,
    module: string,
    submodule: string,
    key: string,
    value: string,
  ): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        const [setting] = await this.findSetting(
          tx,
          tenantId,
          module,
          submodule,
          key,
        );

        if (!setting) {
          throw new NotFoundException(
            `Module setting '${module}/${submodule}/${key}' not found for tenant.`,
          );
        }

        await tx
          .update(moduleSettings)
          .set({ value: String(value), updatedAt: new Date() })
          .where(eq(moduleSettings.id, setting.id));
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to update module setting.',
      );
    }
  }

  async generateNextReference(
    prefix: string,
    tenantId: string,
    module: string,
    submodule: string,
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<string> {
    const db = tx ?? this.db;
    const year = new Date().getFullYear();
    const key = `${prefix}-${year}`;

    return db.transaction(async (transaction) => {
      const [setting] = await transaction
        .select()
        .from(moduleSettings)
        .where(
          and(
            eq(moduleSettings.tenantId, tenantId),
            eq(moduleSettings.module, module),
            eq(moduleSettings.submodule, submodule),
            eq(moduleSettings.key, key),
          ),
        )
        .for('update')
        .limit(1);

      if (!setting) {
        await transaction.insert(moduleSettings).values({
          tenantId,
          module,
          submodule,
          key,
          value: '1',
          description: `${prefix} sequence ${year} for tenant ${tenantId}`,
        });
        return `${prefix}-${year}-000001`;
      }

      const next = parseInt(setting.value ?? '0', 10) + 1;
      const nextStr = next.toString().padStart(6, '0');

      await transaction
        .update(moduleSettings)
        .set({ value: next.toString(), updatedAt: new Date() })
        .where(eq(moduleSettings.id, setting.id));

      // return `${prefix}-${year}-${nextStr}`;
      return `${prefix}-${nextStr}`;
    });
  }

  async generateGlobalCode(
    prefix: string,
    tenantId: string,
    module: string,
    submodule: string,
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<string> {
    const db = tx ?? this.db;

    return db.transaction(async (transaction) => {
      const [setting] = await transaction
        .select()
        .from(moduleSettings)
        .where(
          and(
            eq(moduleSettings.tenantId, tenantId),
            eq(moduleSettings.module, module),
            eq(moduleSettings.submodule, submodule),
            eq(moduleSettings.key, prefix),
          ),
        )
        .for('update')
        .limit(1);

      // if (!setting) {
      //   await transaction.insert(moduleSettings).values({
      //     tenantId,
      //     module: 'SEQUENCES',
      //     submodule: 'GLOBAL',
      //     key: prefix,
      //     value: '1',
      //     description: `Global sequence ${prefix} for tenant ${tenantId}`,
      //   });
      //   return `${prefix}-000001`;
      // }

      const next = parseInt(setting?.value || '0', 10) + 1;

      await transaction
        .update(moduleSettings)
        .set({ value: next.toString(), updatedAt: new Date() })
        .where(eq(moduleSettings.id, setting.id));

      return `${prefix}-${next.toString().padStart(6, '0')}`;
    });
  }
}
