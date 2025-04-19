import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { activityLogsSystem } from '@/database/index';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateActivityLogsSystemDto } from './dto/create-activity-logs-system.dto';
import { UpdateActivityLogsSystemDto } from './dto/update-activity-logs-system.dto';
import { ActivityLogsSystem } from './entities/activity-logs-system.entity';

@Injectable()
export class ActivityLogsSystemService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<ActivityLogsSystem[]> {
    const result = await this.drizzle.select().from(activityLogsSystem);
    return result as unknown as ActivityLogsSystem[];
  }

  async findOne(id: string): Promise<ActivityLogsSystem> {
    const auditRecord = await this.drizzle
      .select()
      .from(activityLogsSystem)
      .where(eq(activityLogsSystem.id, id));

    if (auditRecord.length === 0) {
      throw new HttpException(
        'Activity log system  not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return auditRecord[0] as ActivityLogsSystem;
  }

  async create(
    createActivityLogsSystemDto: CreateActivityLogsSystemDto,
  ): Promise<ActivityLogsSystem> {
    const [auditRecord] = await this.drizzle
      .insert(activityLogsSystem)
      .values({
        userId: createActivityLogsSystemDto.userId,
        type: createActivityLogsSystemDto.type,
        description: createActivityLogsSystemDto.description,
        timestamp: createActivityLogsSystemDto.timestamp,
      })
      .returning();

    return auditRecord as ActivityLogsSystem;
  }

  async update(
    id: string,
    updateActivityLogsSystemDto: UpdateActivityLogsSystemDto,
  ): Promise<ActivityLogsSystem> {
    const find = await this.findOne(id);
    if (!find) {
      throw new HttpException(
        'Activity log system not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const result = await this.drizzle
      .update(activityLogsSystem)
      .set({
        userId: updateActivityLogsSystemDto.userId,
        type: updateActivityLogsSystemDto.type,
        description: updateActivityLogsSystemDto.description,
        timestamp: updateActivityLogsSystemDto.timestamp,
      })
      .where(eq(activityLogsSystem.id, id))
      .returning();

    return result[0] as ActivityLogsSystem;
  }
}
