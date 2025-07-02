import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { auditLogs } from '@/database/index';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateAuditLogsDto } from './dto/create-audit.dto';
import { UpdateAuditLogsDto } from './dto/update-audit.dto';
import { Audit } from './entities/audit.entity';
import { Action } from './dto/audit-logs-enum';
import { ActionEnumAudit } from '@/types/enum';

@Injectable()
export class AuditLogsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<Audit[]> {
    const results = await this.drizzle.select().from(auditLogs);
    return results.map((record) => ({
      ...record,
      action: record.action as ActionEnumAudit,
      previousData: record.previousData as JSON,
      newData: record.newData  as JSON,
    }));
  }

  async findOne(id: number): Promise<Audit> {
    const auditRecord = await this.drizzle
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id));

    if (auditRecord.length === 0) {
      throw new HttpException('Audit record not found', HttpStatus.NOT_FOUND);
    }

    return {
      ...auditRecord[0],
      action: auditRecord[0].action as ActionEnumAudit,
      previousData: auditRecord[0].previousData as JSON,
      newData: auditRecord[0].newData  as JSON,
    };
  }

  async create(createAuditLogsDto: CreateAuditLogsDto): Promise<Audit> {
    const [auditRecord] = await this.drizzle
      .insert(auditLogs)
      .values({
        tableName: createAuditLogsDto.tableName,
        recordId: createAuditLogsDto.recordId,
        action: createAuditLogsDto.action as ActionEnumAudit,
        userId: createAuditLogsDto.userId,
        area: createAuditLogsDto.area,
        description: createAuditLogsDto.description,
        previousData: createAuditLogsDto.previousData,
        newData: createAuditLogsDto.newData,
      })
      .returning();

    return {
      ...auditRecord,
      action: auditRecord.action as ActionEnumAudit,
      previousData: auditRecord.previousData as JSON,
      newData: auditRecord.newData  as JSON,
    };
  }

  async update(id: number, updateAuditLogsDto: UpdateAuditLogsDto): Promise<Audit> {
    // Check if audit record exists
    await this.findOne(id);

    await this.drizzle
      .update(auditLogs)
      .set({
        tableName: updateAuditLogsDto.tableName,
        recordId: updateAuditLogsDto.recordId,
        action: updateAuditLogsDto.action as ActionEnumAudit,
        userId: updateAuditLogsDto.userId,
        area: updateAuditLogsDto.area,
        description: updateAuditLogsDto.description,
        previousData: updateAuditLogsDto.previousData,
        newData: updateAuditLogsDto.newData,
      })
      .where(eq(auditLogs.id, id));

    return this.findOne(id);
  }
}
