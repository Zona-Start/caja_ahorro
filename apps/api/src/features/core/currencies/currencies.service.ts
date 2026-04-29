import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { currencies } from '@/database/schema';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, ne, or, SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  CreateCurrencyDto,
  CurrencyQueryDto,
  UpdateCurrencyDto,
} from './dto/currencies.dto';

@Injectable()
export class CurrenciesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  async findAll(dto: CurrencyQueryDto) {
    const { search, isActive } = dto;

    // 1. Tipamos el array para que coincida con lo que genera Drizzle
    const conditions: SQL[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(currencies.isActive, isActive));
    }

    if (search) {
      // 2. Guardamos el resultado en una constante para verificarlo
      const searchFilter = or(
        ilike(currencies.code, `%${search}%`),
        ilike(currencies.name, `%${search}%`),
      );

      // 3. Solo hacemos push si el filtro realmente se generó (no es undefined)
      if (searchFilter) {
        conditions.push(searchFilter);
      }
    }

    // 4. Recomendación: Usar el callback en el 'where' para evitar el error de 'never'
    return this.db.query.currencies.findMany({
      where: (_, { and }) =>
        conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: (c, { asc }) => [asc(c.code)],
    });
  }

  async findOne(id: string) {
    const currency = await this.db.query.currencies.findFirst({
      where: eq(currencies.id, id),
    });

    if (!currency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }

    return currency;
  }

  async create(dto: CreateCurrencyDto, userId?: string) {
    // Check if code exists
    const existing = await this.db.query.currencies.findFirst({
      where: eq(
        currencies.code,
        dto.code.toUpperCase() as 'VES' | 'USD' | 'EUR',
      ),
    });

    if (existing) {
      throw new ConflictException(`Currency code ${dto.code} already exists`);
    }

    return await this.db.transaction(async (tx) => {
      // If this is base, unset other base currencies
      if (dto.isBase) {
        await tx.update(currencies).set({ isBase: false });
      }

      const [newCurrency] = await tx
        .insert(currencies)
        .values({
          ...dto,
          code: dto.code.toUpperCase() as 'VES' | 'USD' | 'EUR',
          createdById: userId,
          updatedById: userId,
        })
        .returning();

      await this.auditHelper.logCreate(userId, 'currency', newCurrency, {
        targetId: newCurrency.id,
        description: `Created currency ${newCurrency.code}`,
      });

      return newCurrency;
    });
  }

  async update(id: string, dto: UpdateCurrencyDto, userId?: string) {
    const previous = await this.findOne(id);

    // Check code unique if changing
    if (dto.code && dto.code.toUpperCase() !== previous.code) {
      const existing = await this.db.query.currencies.findFirst({
        where: and(
          ne(currencies.id, id),
          eq(currencies.code, dto.code.toUpperCase() as 'VES' | 'USD' | 'EUR'),
        ),
      });
      if (existing) {
        throw new ConflictException(`Currency code ${dto.code} already exists`);
      }
    }

    return await this.db.transaction(async (tx) => {
      // If setting as base, unset others
      if (dto.isBase) {
        await tx.update(currencies).set({ isBase: false });
      }

      const [updated] = await tx
        .update(currencies)
        .set({
          ...dto,
          code: dto.code
            ? (dto.code.toUpperCase() as 'VES' | 'USD' | 'EUR')
            : undefined,
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(currencies.id, id))
        .returning();

      await this.auditHelper.logUpdate(userId, 'currency', previous, updated, {
        targetId: id,
        description: `Updated currency ${previous.code}`,
      });

      return updated;
    });
  }

  async remove(id: string, userId?: string) {
    const previous = await this.findOne(id);

    if (previous.isBase) {
      throw new ConflictException('Cannot delete base currency');
    }

    await this.db.delete(currencies).where(eq(currencies.id, id));

    await this.auditHelper.logDelete(userId, 'currency', previous, {
      targetId: id,
      description: `Deleted currency ${previous.code}`,
    });

    return { message: 'Currency deleted successfully' };
  }
}
