import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { systemSettings } from 'src/database/index';

@Injectable()
export class GenerateCodeService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}

  async generateCustomReference(
    key: string,
    abbreviation: string,
  ): Promise<string> {
    // Fetch the current correlative number and increment it

    try {
      const result = await this.db.transaction(async (tx) => {
        // Lock the row for update
        const setting = await tx.query.systemSettings.findFirst({
          where: eq(systemSettings.key, key),
        });

        if (!setting) {
          throw new InternalServerErrorException(
            `System setting '${key}' not found.`,
          );
        }

        const currentNumber = parseInt(setting.value, 10);
        if (isNaN(currentNumber)) {
          throw new InternalServerErrorException(
            `Invalid correlative number format for '${key}'.`,
          );
        }

        const nextNumber = currentNumber + 1;
        const nextValue = nextNumber.toString().padStart(5, '0'); // Pad with leading zeros
        await this.updateValueSetting(key, nextValue); // Update the setting with the new value
        return nextValue; // Return the generated reference
      });
      return `${abbreviation}-${result}`; // Prefix the reference
    } catch (error) {
      console.error('Error generating custom reference:', error);
      throw new InternalServerErrorException(
        'Failed to generate custom loan reference.',
      );
    }
  }

  async updateValueSetting(key: string, value: string): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        // Lock the row for update
        const setting = await tx.query.systemSettings.findFirst({
          where: eq(systemSettings.key, key),
          // Add forUpdate() if your Drizzle version supports it for row locking
          // Example: columns: {}, with: { forUpdate: true }
        });

        if (!setting) {
          throw new InternalServerErrorException(
            `System setting '${key}' not found.`,
          );
        }
        // Update the setting with the new value
        await tx
          .update(systemSettings)
          .set({ value: String(value), updatedAt: new Date() }) // Assuming you have an updatedById field to set too
          .where(eq(systemSettings.id, setting.id));
      });
    } catch (error) {
      console.error('Error generating custom reference:', error);
      throw new InternalServerErrorException(
        'Failed to generate custom loan reference.',
      );
    }
  }

  async generateNextReference(
    prefix: string,
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<string> {
    const db = tx ?? this.db;
    const year = new Date().getFullYear();
    const key = `${prefix}-${year}`;

    return db.transaction(async (tx) => {
      // bloqueo explícito (FOR UPDATE)
      const [setting] = await tx
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, key))
        .for('update'); // Drizzle ≥ 0.30 → .for('update')

      if (!setting) {
        // primer uso del año: lo creamos
        await tx.insert(systemSettings).values({
          key,
          value: '1',
          description: `${prefix} sequence ${year}`,
        });
        return `${prefix}-${year}-000001`;
      }

      const next = parseInt(setting.value, 10) + 1;
      const nextStr = next.toString().padStart(6, '0'); // 6 dígitos

      await tx
        .update(systemSettings)
        .set({ value: next.toString() })
        .where(eq(systemSettings.key, key));

      return `${prefix}-${year}-${nextStr}`;
    });
  }

  async generateGlobalCode(
    prefix: string,
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<string> {
    const db = tx ?? this.db;
    return db.transaction(async (tx) => {
      const [setting] = await tx
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, prefix))
        .for('update');

      if (!setting) {
        // primer uso: creamos la fila
        await tx.insert(systemSettings).values({
          key: prefix,
          value: '1',
          description: `Global sequence ${prefix}`,
        });
        return `${prefix}-${'1'.padStart(6, '0')}`;
      }

      const next = parseInt(setting.value, 10) + 1;
      await tx
        .update(systemSettings)
        .set({ value: next.toString() })
        .where(eq(systemSettings.key, prefix));

      return `${prefix}-${next.toString().padStart(6, '0')}`;
    });
  }
}
