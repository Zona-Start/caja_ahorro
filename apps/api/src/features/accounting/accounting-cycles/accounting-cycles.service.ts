import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, ilike, inArray, lte, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  CreateAccountingCycleDto,
  UpdateAccountingCycleDto,
} from './dto/accounting-cycles.schema';

@Injectable()
export class AccountingCyclesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateAccountingCycleDto,
  ) {
    // 0. Validar solapamiento
    const startDateStr = new Date(dto.startDate).toISOString().split('T')[0];
    const endDateStr = new Date(dto.endDate).toISOString().split('T')[0];

    const overlapping = await this.drizzle
      .select({ id: schema.accountingCycles.id })
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.tenantId, tenantId),
          inArray(schema.accountingCycles.status, ['OPEN', 'PENDING']),
          or(
            and(
              gte(schema.accountingCycles.startDate, startDateStr),
              lte(schema.accountingCycles.startDate, endDateStr),
            ),
            and(
              gte(schema.accountingCycles.endDate, startDateStr),
              lte(schema.accountingCycles.endDate, endDateStr),
            ),
            and(
              lte(schema.accountingCycles.startDate, startDateStr),
              gte(schema.accountingCycles.endDate, endDateStr),
            ),
          ),
        ),
      )
      .limit(1);

    if (overlapping.length) {
      throw new ConflictException(
        'Un ciclo con estatus OPEN o PENDING ya existe en el rango de fechas.',
      );
    }

    const [raw] = await this.drizzle
      .insert(schema.accountingCycles)
      .values({
        tenantId: tenantId,
        startDate: startDateStr,
        endDate: endDateStr,
        status: 'OPEN',
        description: dto.description,
        createdById: userId,
      })
      .returning();

    await this.auditHelper.logCreate(tenantId, 'accountingCycles', raw, {
      targetId: raw.id,
      description: `Ciclo contable creado: ${raw.description || raw.id}`,
    });

    return raw;
  }

  async findAll(tenantId: string) {
    return await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(eq(schema.accountingCycles.tenantId, tenantId));
  }

  async findAllPaginated(tenantId: string, paginationDto: any) {
    const { page = 1, limit = 10, search = '' } = paginationDto;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [
      eq(schema.accountingCycles.tenantId, tenantId),
    ];
    if (search) {
      conditions.push(
        ilike(schema.accountingCycles.description, `%${search}%`),
      );
    }

    const where = and(...conditions);

    const [total] = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.accountingCycles)
      .where(where);

    const data = await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(where)
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        totalCount: Number(total.count),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(Number(total.count) / Number(limit)),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const [result] = await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.tenantId, tenantId),
          eq(schema.accountingCycles.id, id),
        ),
      );

    if (!result) throw new NotFoundException('Ciclo no encontrado');
    return result;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateAccountingCycleDto,
  ) {
    const current = await this.findOne(tenantId, id);
    const [updated] = await this.drizzle
      .update(schema.accountingCycles)
      .set({ ...dto, updatedById: userId, updatedAt: new Date() })
      .where(
        and(
          eq(schema.accountingCycles.tenantId, tenantId),
          eq(schema.accountingCycles.id, id),
        ),
      )
      .returning();

    await this.auditHelper.logUpdate(
      tenantId,
      'accountingCycles',
      current,
      updated,
      {
        targetId: id,
        description: `Ciclo contable actualizado: ${id}`,
      },
    );
    return updated;
  }

  async close(tenantId: string, userId: string, id: string) {
    const current = await this.findOne(tenantId, id);
    const [closed] = await this.drizzle
      .update(schema.accountingCycles)
      .set({ status: 'CLOSED', closedAt: new Date(), updatedById: userId })
      .where(
        and(
          eq(schema.accountingCycles.tenantId, tenantId),
          eq(schema.accountingCycles.id, id),
        ),
      )
      .returning();

    await this.auditHelper.logUpdate(
      tenantId,
      'accountingCycles',
      current,
      closed,
      {
        targetId: id,
        description: `Ciclo contable cerrado: ${id}`,
      },
    );
    return closed;
  }
}
