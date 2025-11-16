import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  ne,
  or,
  sql,
  SQL,
} from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { CreateAccountingCycleDto } from './dto/create-accounting-cycle.dto';
import { FilterAccountingCycleDto } from './dto/filter-accounting-cycle.dto';
import { UpdateAccountingCycleDto } from './dto/update-accounting-cycle.dto';
import { AccountingCycle } from './entities/accounting-cycle.entity';

@Injectable()
export class AccountingCyclesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  private async getAccountingCycleForDate(startDate: Date, endDate: Date) {
    const existingCycle = await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(
        and(
          eq(
            schema.accountingCycles.startDate,
            startDate.toISOString().split('T')[0],
          ),
          eq(
            schema.accountingCycles.endDate,
            endDate.toISOString().split('T')[0],
          ),
        ),
      );

    return existingCycle;
  }

  // async create(
  //   userdId: number,
  //   createAccountingCycleDto: CreateAccountingCycleDto,
  // ): Promise<AccountingCycle> {
  //   const existingCycle = await this.getAccountingCycleForDate(
  //     createAccountingCycleDto.startDate,
  //     createAccountingCycleDto.endDate,
  //   );
  //   if (existingCycle[0]?.status === 'OPEN') {
  //     throw new NotFoundException(`There is an open accounting cycle`);
  //   }

  //   const newCycle = await this.drizzle
  //     .insert(schema.accountingCycles)
  //     .values({
  //       companyId: createAccountingCycleDto.companyId,
  //       startDate: createAccountingCycleDto.startDate
  //         .toISOString()
  //         .split('T')[0],
  //       endDate: createAccountingCycleDto.endDate.toISOString().split('T')[0],
  //       status: 'OPEN',
  //       description: createAccountingCycleDto.description,
  //       createdById: userdId,
  //     })
  //     .returning();
  //   return {
  //     ...newCycle[0],
  //     startDate: new Date(newCycle[0].startDate),
  //     endDate: new Date(newCycle[0].endDate),
  //   } as AccountingCycle;
  // }

  async create(
    userId: number,
    dto: CreateAccountingCycleDto,
    opts?: { forceStatus?: 'OPEN' | 'PENDING' },
  ): Promise<AccountingCycle> {
    /* 0. Validar solapamiento con ciclos OPEN o PENDING */
    const overlapping = await this.drizzle
      .select({ id: schema.accountingCycles.id })
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.companyId, dto.companyId),
          inArray(schema.accountingCycles.status, ['OPEN', 'PENDING']),
          or(
            /* a) empieza dentro del nuevo rango */
            and(
              gte(
                schema.accountingCycles.startDate,
                dto.startDate.toISOString().split('T')[0],
              ),
              lte(
                schema.accountingCycles.startDate,
                dto.endDate.toISOString().split('T')[0],
              ),
            ),
            /* b) termina dentro del nuevo rango */
            and(
              gte(
                schema.accountingCycles.endDate,
                dto.startDate.toISOString().split('T')[0],
              ),
              lte(
                schema.accountingCycles.endDate,
                dto.endDate.toISOString().split('T')[0],
              ),
            ),
            /* c) envuelve completamente al nuevo rango */
            and(
              lte(
                schema.accountingCycles.startDate,
                dto.startDate.toISOString().split('T')[0],
              ),
              gte(
                schema.accountingCycles.endDate,
                dto.endDate.toISOString().split('T')[0],
              ),
            ),
          ),
        ),
      )
      .limit(1);

    if (overlapping.length) {
      throw new ConflictException(
        'A cycle with OPEN or PENDING status already exists in the given date range.',
      );
    }

    /* 1. ¿Hay algún ciclo OPEN ahora? */
    const openNow = await this.drizzle
      .select({ id: schema.accountingCycles.id })
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.companyId, dto.companyId),
          eq(schema.accountingCycles.status, 'OPEN'),
        ),
      )
      .limit(1);

    /* 2. Determinar status */
    const requested = opts?.forceStatus;
    const status: 'OPEN' | 'PENDING' =
      requested ?? (openNow.length ? 'PENDING' : 'OPEN');

    if (status === 'OPEN' && openNow.length) {
      throw new ConflictException('An OPEN cycle already exists.');
    }

    /* 3. Crear el ciclo */
    const [raw] = await this.drizzle
      .insert(schema.accountingCycles)
      .values({
        companyId: dto.companyId,
        startDate: dto.startDate.toISOString().split('T')[0],
        endDate: dto.endDate.toISOString().split('T')[0],
        status,
        description: dto.description,
        createdById: userId,
      })
      .returning();

    return {
      ...raw,
      startDate: new Date(raw.startDate),
      endDate: new Date(raw.endDate),
    } as AccountingCycle;
  }

  async findAll() {
    return await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(eq(schema.accountingCycles.status, 'OPEN'));
  }

  async findAllPaginated(
    paginationDto?: FilterAccountingCycleDto,
  ): Promise<{ data: AccountingCycle[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      startDate = '',
      endDate = '',
      status = '',
    } = paginationDto || {};
    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(
        ilike(schema.accountingCycles.description, `%${search}%`),
      );
    }

    if (startDate) {
      searchConditions.push(
        eq(
          schema.accountingCycles.startDate,
          startDate.toISOString().split('T')[0],
        ),
      );
    }

    if (endDate) {
      searchConditions.push(
        eq(
          schema.accountingCycles.endDate,
          endDate.toISOString().split('T')[0],
        ),
      );
    }

    if (status) {
      searchConditions.push(eq(schema.accountingCycles.status, status));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.accountingCycles[sortBy as keyof typeof schema.accountingCycles]} asc`
        : sql`${schema.accountingCycles[sortBy as keyof typeof schema.accountingCycles]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.accountingCycles)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.drizzle
      .select({
        id: schema.accountingCycles.id,
        companyId: schema.accountingCycles.companyId,
        startDate: schema.accountingCycles.startDate,
        endDate: schema.accountingCycles.endDate,
        status: schema.accountingCycles.status,
        description: schema.accountingCycles.description,
        closedAt: schema.accountingCycles.closedAt,
      })
      .from(schema.accountingCycles)
      .where(searchCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Build pagination metadata
    const meta = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return {
      data: data.map((cycle) => ({
        ...cycle,
        startDate: new Date(cycle.startDate),
        endDate: new Date(cycle.endDate),
      })) as AccountingCycle[],
      meta,
    };
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(eq(schema.accountingCycles.id, id));

    if (!result.length) {
      throw new NotFoundException(`Accounting Cycle with ID ${id} not found`);
    }

    return result[0];
  }

  async update(userId: number, id: number, dto: UpdateAccountingCycleDto) {
    /* 0. Asegurar que existe */
    const current = await this.findOne(id);
    if (!current) {
      throw new NotFoundException(`Accounting cycle with ID ${id} not found`);
    }

    const toISO = (d?: Date) => d?.toISOString().split('T')[0];

    const startStr = toISO(dto.startDate) ?? current.startDate;
    const endStr = toISO(dto.endDate) ?? current.endDate;

    /* 1. Solapamiento con otros ciclos (OPEN o PENDING) */
    const overlap = await this.drizzle
      .select({ id: schema.accountingCycles.id })
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.companyId, current.companyId),
          inArray(schema.accountingCycles.status, ['OPEN', 'PENDING']),
          ne(schema.accountingCycles.id, id), // excepto él mismo
          or(
            and(
              gte(schema.accountingCycles.startDate, startStr),
              lte(schema.accountingCycles.startDate, endStr),
            ),
            and(
              gte(schema.accountingCycles.endDate, startStr),
              lte(schema.accountingCycles.endDate, endStr),
            ),
            and(
              lte(schema.accountingCycles.startDate, startStr),
              gte(schema.accountingCycles.endDate, endStr),
            ),
          ),
        ),
      )
      .limit(1);

    if (overlap.length) {
      throw new ConflictException(
        'Another cycle (OPEN or PENDING) already overlaps the requested date range.',
      );
    }

    /* 2. Un solo OPEN */
    const targetStatus = dto.status ?? current.status;
    if (targetStatus === 'OPEN') {
      const otherOpen = await this.drizzle
        .select({ id: schema.accountingCycles.id })
        .from(schema.accountingCycles)
        .where(
          and(
            eq(schema.accountingCycles.companyId, current.companyId),
            eq(schema.accountingCycles.status, 'OPEN'),
            ne(schema.accountingCycles.id, id),
          ),
        )
        .limit(1);

      if (otherOpen.length) {
        throw new ConflictException('An OPEN cycle already exists.');
      }
    }

    /* 3. Actualizar */
    const [updated] = await this.drizzle
      .update(schema.accountingCycles)
      .set({
        companyId: dto.companyId ?? current.companyId,
        startDate: startStr,
        endDate: endStr,
        status: targetStatus,
        description: dto.description ?? current.description,
        updatedById: userId,
      })
      .where(eq(schema.accountingCycles.id, id))
      .returning();

    return updated;
  }

  async close(userId: number, id: number) {
    const existingAccountPlan = await this.findOne(id);

    if (!existingAccountPlan) {
      throw new NotFoundException(
        `Update Account Plan with ID ${id} not found`,
      );
    }

    const result = await this.drizzle
      .update(schema.accountingCycles)
      .set({
        closedByUser_id: userId,
        updatedById: userId,
        closedAt: new Date(),
        status: 'CLOSED',
      })
      .where(eq(schema.accountingCycles.id, id))
      .returning();
    return result[0];
  }
}
