import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, ilike, inArray, lte, ne, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  ChangeStatusDto,
  CreateAccountingCycleDto,
  FilterAccountingCycleDto,
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
    await this.validateOverlap(tenantId, dto.startDate, dto.endDate);

    const alreadyHasOpen = await this.hasOpenCycle(tenantId);
    const status = alreadyHasOpen ? 'PENDING' : 'OPEN';

    const [raw] = await this.drizzle
      .insert(schema.accountingCycles)
      .values({
        tenantId: tenantId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status,
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

  async findAllPaginated(tenantId: string, dto: FilterAccountingCycleDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      startDate,
      endDate,
    } = dto;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [
      eq(schema.accountingCycles.tenantId, tenantId),
    ];

    if (search) {
      conditions.push(
        ilike(schema.accountingCycles.description, `%${search}%`),
      );
    }

    if (status) {
      conditions.push(
        eq(
          schema.accountingCycles.status,
          status as 'OPEN' | 'CLOSED' | 'CLOSING' | 'PENDING',
        ),
      );
    }

    if (startDate) {
      conditions.push(gte(schema.accountingCycles.endDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(schema.accountingCycles.startDate, endDate));
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
      .offset(offset)
      .orderBy(sql`${schema.accountingCycles.startDate} DESC`);

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

    if (dto.startDate || dto.endDate) {
      const startDate = dto.startDate || current.startDate;
      const endDate = dto.endDate || current.endDate;
      await this.validateOverlap(tenantId, startDate, endDate, id);
    }

    if (dto.status === 'OPEN') {
      await this.validateSingleOpen(tenantId, id);
    }

    const [updated] = await this.drizzle
      .update(schema.accountingCycles)
      .set({
        ...dto,
        updatedById: userId,
        updatedAt: new Date(),
      })
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

  async changeStatus(
    tenantId: string,
    userId: string,
    id: string,
    dto: ChangeStatusDto,
  ) {
    const current = await this.findOne(tenantId, id);
    const newStatus = dto.status;

    if (current.status === newStatus) {
      throw new ConflictException(
        `El ciclo ya se encuentra en estado ${newStatus === 'OPEN' ? 'Abierto' : 'Pendiente'}`,
      );
    }

    if (newStatus === 'OPEN') {
      await this.validateSingleOpen(tenantId, id);
    }

    if (newStatus === 'PENDING') {
      const hasEntries = await this.cycleHasEntries(tenantId, id);
      if (hasEntries) {
        throw new ConflictException(
          'No se puede cambiar a Pendiente porque existen asientos contables registrados en este ciclo.',
        );
      }
    }

    const [updated] = await this.drizzle
      .update(schema.accountingCycles)
      .set({
        status: newStatus,
        updatedById: userId,
        updatedAt: new Date(),
      })
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
        description: `Estado del ciclo cambiado a ${newStatus === 'OPEN' ? 'Abierto' : 'Pendiente'}: ${id}`,
      },
    );

    return updated;
  }

  async delete(tenantId: string, userId: string, id: string) {
    const current = await this.findOne(tenantId, id);

    if (current.status === 'OPEN') {
      throw new ConflictException(
        'No se puede eliminar un ciclo que se encuentra Abierto. Cambie su estado a Pendiente primero.',
      );
    }

    const hasEntries = await this.cycleHasEntries(tenantId, id);
    if (hasEntries) {
      throw new ConflictException(
        'No se puede eliminar el ciclo porque existen asientos contables registrados.',
      );
    }

    await this.drizzle
      .delete(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.tenantId, tenantId),
          eq(schema.accountingCycles.id, id),
        ),
      );

    await this.auditHelper.logUpdate(
      tenantId,
      'accountingCycles',
      current,
      { ...current, deleted: true },
      {
        targetId: id,
        description: `Ciclo contable eliminado: ${id}`,
      },
    );

    return { message: 'Ciclo eliminado correctamente' };
  }

  private async validateOverlap(
    tenantId: string,
    startDate: string,
    endDate: string,
    excludeId?: string,
  ) {
    const conditions: SQL<unknown>[] = [
      eq(schema.accountingCycles.tenantId, tenantId),
      inArray(schema.accountingCycles.status, ['OPEN', 'PENDING']),
    ];

    if (excludeId) {
      conditions.push(
        ne(schema.accountingCycles.id, excludeId) as SQL<unknown>,
      );
    }

    conditions.push(
      or(
        and(
          gte(schema.accountingCycles.startDate, startDate),
          lte(schema.accountingCycles.startDate, endDate),
        ),
        and(
          gte(schema.accountingCycles.endDate, startDate),
          lte(schema.accountingCycles.endDate, endDate),
        ),
        and(
          lte(schema.accountingCycles.startDate, startDate),
          gte(schema.accountingCycles.endDate, endDate),
        ),
      ) as SQL<unknown>,
    );

    const overlapping = await this.drizzle
      .select({ id: schema.accountingCycles.id })
      .from(schema.accountingCycles)
      .where(and(...conditions))
      .limit(1);

    if (overlapping.length) {
      throw new ConflictException(
        'Ya existe un ciclo contable con estatus Abierto o Pendiente dentro del rango de fechas especificado.',
      );
    }
  }

  private async hasOpenCycle(tenantId: string): Promise<boolean> {
    const [openCycle] = await this.drizzle
      .select({ id: schema.accountingCycles.id })
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.tenantId, tenantId),
          eq(schema.accountingCycles.status, 'OPEN'),
        ),
      )
      .limit(1);

    return !!openCycle;
  }

  private async validateSingleOpen(tenantId: string, excludeId?: string) {
    const conditions: SQL<unknown>[] = [
      eq(schema.accountingCycles.tenantId, tenantId),
      eq(schema.accountingCycles.status, 'OPEN'),
    ];

    if (excludeId) {
      conditions.push(ne(schema.accountingCycles.id, excludeId));
    }

    const [openCycle] = await this.drizzle
      .select({ id: schema.accountingCycles.id })
      .from(schema.accountingCycles)
      .where(and(...conditions))
      .limit(1);

    if (openCycle) {
      throw new ConflictException(
        'Ya existe un ciclo contable Abierto. Solo puede haber un ciclo abierto a la vez.',
      );
    }
  }

  private async cycleHasEntries(
    tenantId: string,
    cycleId: string,
  ): Promise<boolean> {
    const [result] = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.accountingEntries)
      .where(
        and(
          eq(schema.accountingEntries.tenantId, tenantId),
          eq(schema.accountingEntries.accountingCycleId, cycleId),
        ),
      );

    return Number(result.count) > 0;
  }
}
