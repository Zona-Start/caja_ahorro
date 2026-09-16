import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { customers } from '@/database/schema/tables';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, ilike, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  CreateCustomerDto,
  FilterCustomerDto,
  UpdateCustomerDto,
} from './dto/customers.schema';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateCustomerDto) {
    const [existing] = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(eq(customers.tenantId, tenantId), eq(customers.taxId, dto.taxId)),
      )
      .limit(1);

    if (existing) {
      throw new BadRequestException(
        `Ya existe un cliente con la cédula/RIF '${dto.taxId}'.`,
      );
    }

    const [customer] = await this.db
      .insert(customers)
      .values({
        tenantId,
        name: dto.name,
        taxId: dto.taxId,
        email: dto.email ? dto.email : null,
        phone: dto.phone ?? null,
        address: dto.address ?? null,
        creditDays: dto.creditDays ?? 0,
        creditLimit: String(dto.creditLimit ?? 0),
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return { message: 'Cliente registrado correctamente', data: customer };
  }

  async findAllByPagination(tenantId: string, dto: FilterCustomerDto) {
    const { page = 1, limit = 10, search = '', isActive } = dto;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [eq(customers.tenantId, tenantId)];

    if (isActive !== undefined) {
      conditions.push(eq(customers.isActive, isActive));
    }

    if (search) {
      conditions.push(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.taxId, `%${search}%`),
        ) as SQL<unknown>,
      );
    }

    const whereClause = and(...conditions);

    const [total] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(whereClause);

    const data = await this.db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(asc(customers.name))
      .limit(limit)
      .offset(offset);

    const totalCount = Number(total.count);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      data,
      meta: {
        totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findAllActive(tenantId: string) {
    return this.db
      .select()
      .from(customers)
      .where(and(eq(customers.tenantId, tenantId), eq(customers.isActive, true)))
      .orderBy(asc(customers.name));
  }

  async findOne(id: string, tenantId: string) {
    const [customer] = await this.db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return customer;
  }

  async update(
    id: string,
    tenantId: string,
    userId: string,
    dto: UpdateCustomerDto,
  ) {
    await this.findOne(id, tenantId);

    if (dto.taxId) {
      const [duplicate] = await this.db
        .select({ id: customers.id })
        .from(customers)
        .where(
          and(eq(customers.tenantId, tenantId), eq(customers.taxId, dto.taxId)),
        )
        .limit(1);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException(
          `Ya existe un cliente con la cédula/RIF '${dto.taxId}'.`,
        );
      }
    }

    const [updated] = await this.db
      .update(customers)
      .set({
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.taxId !== undefined ? { taxId: dto.taxId } : {}),
        ...(dto.email !== undefined ? { email: dto.email || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone ?? null } : {}),
        ...(dto.address !== undefined ? { address: dto.address ?? null } : {}),
        ...(dto.creditDays !== undefined
          ? { creditDays: dto.creditDays }
          : {}),
        ...(dto.creditLimit !== undefined
          ? { creditLimit: String(dto.creditLimit) }
          : {}),
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .returning();

    return { message: 'Cliente actualizado correctamente', data: updated };
  }

  async toggleStatus(id: string, tenantId: string, userId: string) {
    const customer = await this.findOne(id, tenantId);
    const [updated] = await this.db
      .update(customers)
      .set({
        isActive: !customer.isActive,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .returning();

    return { message: 'Estado del cliente actualizado', data: updated };
  }
}
