import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { suppliers } from '@/database/schema/tables';
import { statusSuppliers } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { FilterSupplierDto } from './dto/filter-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  async create(
    userId: number,
    createSupplierDto: CreateSupplierDto,
  ): Promise<{ message: string; data: Supplier }> {
    const existingSupplierByTaxId = await this.drizzle
      .select()
      .from(suppliers)
      .where(eq(suppliers.taxId, createSupplierDto.taxId));

    if (existingSupplierByTaxId.length !== 0) {
      throw new BadRequestException(
        `Supplier with tax ID '${createSupplierDto.taxId}' already exists.`,
      );
    }

    const [newSupplier] = await this.drizzle
      .insert(suppliers)
      .values({
        ...createSupplierDto,
        code: await this.generateCodeService.generateGlobalCode('PROV'),
        createdById: userId,
        status: 'ACTIVE' as statusSuppliers,
      })
      .returning({
        id: suppliers.id,
        code: suppliers.code,
        name: suppliers.name,
        taxId: suppliers.taxId,
        contactName: suppliers.contactName,
        contactEmail: suppliers.contactEmail,
        contactPhone: suppliers.contactPhone,
        state: suppliers.state,
        address: suppliers.address,
        category: suppliers.category,
        status: suppliers.status,
      });

    return {
      message: 'Supplier created successfully',
      data: newSupplier as Supplier,
    };
  }

  async findAll(
    filterDto: FilterSupplierDto,
  ): Promise<{ message: string; data: Supplier[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      name,
      taxId,
      category,
      status,
    } = filterDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(ilike(suppliers.name, `%${search}%`));
    }
    if (name) {
      searchConditions.push(ilike(suppliers.name, `%${name}%`));
    }
    if (taxId) {
      searchConditions.push(ilike(suppliers.taxId, `%${taxId}%`));
    }
    if (category) {
      searchConditions.push(eq(suppliers.category, category));
    }
    if (status) {
      searchConditions.push(eq(suppliers.status, status as statusSuppliers));
    }

    const finalCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${suppliers[sortBy as keyof typeof suppliers]} asc`
        : sql`${suppliers[sortBy as keyof typeof suppliers]} desc`;

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(finalCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    const data = await this.drizzle
      .select({
        id: suppliers.id,
        code: suppliers.code,
        name: suppliers.name,
        taxId: suppliers.taxId,
        contactName: suppliers.contactName,
        contactEmail: suppliers.contactEmail,
        contactPhone: suppliers.contactPhone,
        state: suppliers.state,
        address: suppliers.address,
        category: suppliers.category,
        status: suppliers.status,
      })
      .from(suppliers)
      .where(finalCondition)
      .offset(offset)
      .orderBy(orderBy)
      .limit(limit);

    const meta = {
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return {
      message: 'Suppliers fetched successfully',
      data: data as Supplier[],
      meta,
    };
  }

  async findAllSuppliers() {
    return await this.drizzle
      .select({
        id: suppliers.id,
        name: suppliers.name,
        taxId: suppliers.taxId,
      })
      .from(schema.suppliers);
  }

  async findOne(id: number): Promise<{ message: string; data: Supplier }> {
    const [supplier] = await this.drizzle
      .select({
        id: suppliers.id,
        code: suppliers.code,
        name: suppliers.name,
        taxId: suppliers.taxId,
        contactName: suppliers.contactName,
        contactEmail: suppliers.contactEmail,
        contactPhone: suppliers.contactPhone,
        state: suppliers.state,
        address: suppliers.address,
        category: suppliers.category,
        status: suppliers.status,
      })
      .from(suppliers)
      .where(eq(suppliers.id, id));

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID '${id}' not found.`);
    }

    return {
      message: 'Get one supplier by Id success',
      data: supplier as Supplier,
    };
  }

  async update(
    userId: number,
    id: number,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<{ message: string; data: Supplier }> {
    const existingSupplier = await this.findOne(id);

    if (
      updateSupplierDto.code &&
      updateSupplierDto.code !== existingSupplier.data.code
    ) {
      const supplierWithSameCode = await this.drizzle
        .select()
        .from(suppliers)
        .where(eq(suppliers.code, updateSupplierDto.code));

      if (supplierWithSameCode.length !== 0) {
        throw new BadRequestException(
          `Supplier with code '${updateSupplierDto.code}' already exists.`,
        );
      }
    }

    if (
      updateSupplierDto.taxId &&
      updateSupplierDto.taxId !== existingSupplier.data.taxId
    ) {
      const supplierWithSameTaxId = await this.drizzle
        .select()
        .from(suppliers)
        .where(eq(suppliers.taxId, updateSupplierDto.taxId));

      if (supplierWithSameTaxId.length !== 0) {
        throw new BadRequestException(
          `Supplier with tax ID '${updateSupplierDto.taxId}' already exists.`,
        );
      }
    }

    const [updatedSupplier] = await this.drizzle
      .update(suppliers)
      .set({
        ...updateSupplierDto,
        updatedById: userId,
      })
      .where(eq(suppliers.id, id))
      .returning({
        id: suppliers.id,
        code: suppliers.code,
        name: suppliers.name,
        taxId: suppliers.taxId,
        contactName: suppliers.contactName,
        contactEmail: suppliers.contactEmail,
        contactPhone: suppliers.contactPhone,
        state: suppliers.state,
        address: suppliers.address,
        category: suppliers.category,
        status: suppliers.status,
      });

    if (!updatedSupplier) {
      throw new NotFoundException(
        `Supplier with ID '${id}' not found after update attempt.`,
      );
    }

    return {
      message: 'Supplier, update success',
      data: updatedSupplier as Supplier,
    };
  }

  async remove(id: number): Promise<{ message: string }> {
    const existingSupplier = await this.findOne(id);
    if (!existingSupplier.data) {
      throw new NotFoundException('Suppliers not found');
    }

    // Aquí podrías añadir lógica para verificar si el proveedor tiene cuentas por pagar o compras asociadas
    // Si las tiene, podrías lanzar un BadRequestException o cambiar su estado a INACTIVE en lugar de eliminarlo

    const invoice = await this.drizzle
      .select()
      .from(schema.accountsPayable)
      .where(eq(schema.accountsPayable.supplierInvoiceId, id));

    if (invoice.length !== 0) {
      throw new NotFoundException(
        'Cannot be deleted, has invoices in the system',
      );
    }

    const purchase = await this.drizzle
      .select()
      .from(schema.purchaseOrders)
      .where(eq(schema.purchaseOrders.supplierId, id));

    if (purchase.length !== 0) {
      throw new NotFoundException(
        'Cannot be deleted, has puschase orders in the system',
      );
    }

    await this.drizzle.delete(suppliers).where(eq(suppliers.id, id));

    return { message: `Supplier with ID '${id}' deleted successfully.` };
  }

  async getSupplierStatus(): Promise<{
    message: string;
    data: {
      totalActive: number;
      totalInactive: number;
      totalSupended: number;
    };
  }> {
    const totalActive = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(eq(suppliers.status, 'ACTIVE'));

    const totalInactive = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(eq(suppliers.status, 'INACTIVE'));

    const totalSupended = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(eq(suppliers.status, 'SUSPENDED'));

    return {
      message: 'fetched count suppliers status successfully',
      data: {
        totalActive: totalActive[0].count,
        totalInactive: totalInactive[0].count,
        totalSupended: totalSupended[0].count,
      },
    };
  }
}
