import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { suppliers } from '@/database/schema/tables';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { CreateSupplierDto, FilterSupplierDto, UpdateSupplierDto } from './dto/suppliers.schema';

@Injectable()
export class SuppliersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
  ) { }

  async create(tenantId: string, userId: string, dto: CreateSupplierDto) {
    const [existing] = await this.drizzle
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.taxId, dto.taxId), eq(suppliers.tenantId, tenantId)));

    if (existing) {
      throw new BadRequestException(`Supplier with tax ID '${dto.taxId}' already exists.`);
    }

    const [newSupplier] = await this.drizzle
      .insert(suppliers)
      .values({
        tenantId,
        name: dto.name,
        taxId: dto.taxId,
        phone: dto.phone,
        email: dto.email,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        state: dto.state,
        address: dto.address,
        category: dto.category as any,
        internalCode: await this.generateCodeService.generateNextReference('PROV', tenantId, 'purchasing', 'suppliers'),
        createdById: userId,
        status: 'ACTIVE',
      })
      .returning();

    return newSupplier;
  }

  async findAll(paginationDto: FilterSupplierDto, currentTenantId: string) {
    const { page = 1, limit = 10, search = '', tenantId } = paginationDto;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    const effectiveTenantId = currentTenantId || tenantId;

    if (effectiveTenantId)
      conditions.push(eq(suppliers.tenantId, effectiveTenantId));

    if (search) {
      conditions.push(ilike(suppliers.name, `%${search}%`));
    }

    if (paginationDto.category) {
      conditions.push(eq(suppliers.category, paginationDto.category));
    }

    if (paginationDto.state) {
      conditions.push(eq(suppliers.state, paginationDto.state));
    }

    const whereCondition = and(...conditions);

    const [total] = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(whereCondition);

    const data = await this.drizzle
      .select()
      .from(suppliers)
      .where(whereCondition)
      .limit(limit)
      .offset(offset);


    return {
      data,
      meta: {
        totalItems: Number(total.count),
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(Number(total.count) / limit),
        currentPage: page,
      },
    };
  }

  async findAllSuppliers(tenantId: string) {
    return this.drizzle
      .select()
      .from(suppliers)
      .where(eq(suppliers.tenantId, tenantId));
  }

  async findOne(id: string, tenantId: string) {
    const [supplier] = await this.drizzle
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));

    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(tenantId: string, userId: string, id: string, dto: UpdateSupplierDto) {
    await this.findOne(id, tenantId);

    const [updated] = await this.drizzle
      .update(suppliers)
      .set({ ...dto, updatedById: userId, updatedAt: new Date() } as any)
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)))
      .returning();

    return updated;
  }

  async toggleStatus(id: string, tenantId: string | null, userId: string) {
    const conditions: SQL<unknown>[] = [eq(suppliers.id, id)];
    if (tenantId) conditions.push(eq(suppliers.tenantId, tenantId));

    const [supplier] = await this.drizzle
      .select()
      .from(suppliers)
      .where(and(...conditions));

    if (!supplier) throw new NotFoundException('Supplier not found');

    const newStatus = supplier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const [updated] = await this.drizzle
      .update(suppliers)
      .set({ status: newStatus, updatedById: userId, updatedAt: new Date() } as any)
      .where(and(...conditions))
      .returning();
    return updated;
  }

  async remove(id: string, tenantId: string | null) {
    const conditions: SQL<unknown>[] = [eq(suppliers.id, id)];
    if (tenantId) conditions.push(eq(suppliers.tenantId, tenantId));

    const [supplier] = await this.drizzle
      .select()
      .from(suppliers)
      .where(and(...conditions));

    if (!supplier) throw new NotFoundException('Supplier not found');

    await this.drizzle
      .delete(suppliers)
      .where(and(...conditions));
    return { message: 'Supplier deleted' };
  }

  async getSupplierStatus(tenantId: string) {
    const totalActive = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(and(eq(suppliers.status, 'ACTIVE'), eq(suppliers.tenantId, tenantId)));

    return { totalActive: totalActive[0].count };
  }
}
