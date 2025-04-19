import { systemSettings } from '@/database/schema/core';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { UpdateSettingSystemDto } from './dto/update-setting-system.dto';
import { SettingSystem } from './entities/settings-system.entity';

@Injectable()
export class SettingsSystemService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<SettingSystem[]> {
    return await this.drizzle.select().from(systemSettings);
  }

  async findOne(id: number): Promise<SettingSystem> {
    const result = await this.drizzle
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.id, id));

    if (!result.length) {
      throw new NotFoundException(`Settings with ID ${id} not found`);
    }

    return result[0];
  }

  async findKey(key: string): Promise<SettingSystem> {
    const result = await this.drizzle
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));

    if (!result.length) {
      throw new NotFoundException(`Settings with ID ${key} not found`);
    }

    return result[0];
  }

  async update(
    id: number,
    updateSettingSystemDto: UpdateSettingSystemDto,
  ): Promise<SettingSystem> {
    const existingSetting = await this.findOne(id);

    if (!existingSetting) {
      throw new NotFoundException(`Settings System not found`);
    }

    const result = await this.drizzle
      .update(systemSettings)
      .set({
        ...updateSettingSystemDto,
      })
      .where(eq(systemSettings.id, id))
      .returning();

    return result[0];
  }
}
