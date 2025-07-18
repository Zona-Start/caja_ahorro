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

        const partes = value.split('-')[1];
        // Update the setting with the new value
        await tx
          .update(systemSettings)
          .set({ value: partes, updatedAt: new Date() }) // Assuming you have an updatedById field to set too
          .where(eq(systemSettings.id, setting.id));
      });
    } catch (error) {
      console.error('Error generating custom reference:', error);
      throw new InternalServerErrorException(
        'Failed to generate custom loan reference.',
      );
    }
  }
}
