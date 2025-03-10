import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { audit } from '@/database/index';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { Audit } from './entities/audit.entity';

@Injectable()
export class AuditService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<Audit[]> {
    const results = await this.drizzle.select().from(audit);
    return results.map((record) => ({
      ...record,
      details: record.details as JSON,
    }));
  }

  async findOne(id: number): Promise<Audit> {
    const auditRecord = await this.drizzle
      .select()
      .from(audit)
      .where(eq(audit.id, id));

    if (auditRecord.length === 0) {
      throw new HttpException('Audit record not found', HttpStatus.NOT_FOUND);
    }

    return {
      ...auditRecord[0],
      details: auditRecord[0].details as JSON,
    };
  }

  async create(createAuditDto: CreateAuditDto): Promise<Audit> {
    const [auditRecord] = await this.drizzle
      .insert(audit)
      .values({
        affectedTable: createAuditDto.affectedTable,
        action: createAuditDto.action,
        recordId: createAuditDto.recordId,
        userId: createAuditDto.userId,
        details: createAuditDto.details,
      })
      .returning();

    return {
      ...auditRecord,
      details: auditRecord.details as JSON,
    };
  }

  async update(id: number, updateAuditDto: UpdateAuditDto): Promise<Audit> {
    // Check if audit record exists
    await this.findOne(id);

    await this.drizzle
      .update(audit)
      .set({
        affectedTable: updateAuditDto.affectedTable,
        action: updateAuditDto.action,
        recordId: updateAuditDto.recordId,
        userId: updateAuditDto.userId,
        details: updateAuditDto.details,
      })
      .where(eq(audit.id, id));

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    // Check if audit record exists
    await this.findOne(id);

    await this.drizzle.delete(audit).where(eq(audit.id, id));

    return { message: 'Audit record deleted successfully' };
  }
}
