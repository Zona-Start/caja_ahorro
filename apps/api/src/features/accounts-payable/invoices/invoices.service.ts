import { accountsPayable } from '@/database/schema/accounts-payable';
import { CurrencyCodeEnum, invoiceSuppliersStatusEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, ilike, lte, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { accountsPayableSummaryView } from 'src/database/index';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice } from './entities/invoice.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(
    userId: number,
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<{ message: string; data: Invoice }> {
    const existingInvoice = await this.drizzle.query.accountsPayable.findFirst({
      where: and(
        eq(accountsPayable.supplierId, createInvoiceDto.supplierId),
        eq(accountsPayable.invoiceNumber, createInvoiceDto.invoiceNumber),
      ),
    });

    if (existingInvoice) {
      throw new BadRequestException(
        `Invoice with number '${createInvoiceDto.invoiceNumber}' for supplier ID '${createInvoiceDto.supplierId}' already exists.`,
      );
    }

    // Calculate remainingAmount if not provided, assuming it's initially totalAmount
    const remainingAmount = createInvoiceDto.totalAmount;

    const [newInvoice] = await this.drizzle
      .insert(accountsPayable)
      .values({
        ...createInvoiceDto,
        currencyCode: 'VES' as CurrencyCodeEnum,
        invoiceDate: createInvoiceDto.invoiceDate.toISOString().split('T')[0],
        dueDate: createInvoiceDto.dueDate.toISOString().split('T')[0],
        remainingAmount: remainingAmount.toString(),
        totalAmount: createInvoiceDto.totalAmount.toString(),
        status: createInvoiceDto.status ?? invoiceSuppliersStatusEnum.PENDING,
        createdById: userId,
      })
      .returning({
        id: accountsPayable.id,
        supplierId: accountsPayable.supplierId,
        invoiceNumber: accountsPayable.invoiceNumber,
        invoiceDate: accountsPayable.invoiceDate,
        dueDate: accountsPayable.dueDate,
        totalAmount: accountsPayable.totalAmount,
        paidAmount: accountsPayable.paidAmount,
        remainingAmount: accountsPayable.remainingAmount,
        concept: accountsPayable.concept,
        status: accountsPayable.status,
        observations: accountsPayable.observations,
      });

    if (!newInvoice) {
      throw new BadRequestException(`Error creating account payable`);
    }

    const dataMappers = {
      ...newInvoice,
      invoiceDate: new Date(newInvoice.invoiceDate),
      dueDate: new Date(newInvoice.dueDate),
      totalAmount: Number(newInvoice.totalAmount),
      paidAmount: Number(newInvoice.paidAmount),
      remainingAmount: Number(newInvoice.remainingAmount),
    } as Invoice;

    return {
      message: 'Account payable created successfully',
      data: dataMappers,
    };
  }

  async findAll(
    filterDto: FilterInvoiceDto,
  ): Promise<{ data: Invoice[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      supplierId,
      invoiceNumber,
      invoiceDateStart,
      invoiceDateEnd,
      dueDateStart,
      dueDateEnd,
      status,
    } = filterDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(
        ilike(accountsPayable.invoiceNumber, `%${search}%`),
      );
      //searchConditions.push(ilike(accountsPayable.concept, `%${search}%`));
    }
    if (supplierId) {
      searchConditions.push(eq(accountsPayable.supplierId, supplierId));
    }
    if (invoiceNumber) {
      searchConditions.push(
        ilike(accountsPayable.invoiceNumber, `%${invoiceNumber}%`),
      );
    }
    if (invoiceDateStart) {
      searchConditions.push(
        gte(
          accountsPayable.invoiceDate,
          invoiceDateStart.toISOString().split('T')[0],
        ),
      );
    }
    if (invoiceDateEnd) {
      searchConditions.push(
        lte(
          accountsPayable.invoiceDate,
          invoiceDateEnd.toISOString().split('T')[0],
        ),
      );
    }
    if (dueDateStart) {
      searchConditions.push(
        gte(accountsPayable.dueDate, dueDateStart.toISOString().split('T')[0]),
      );
    }
    if (dueDateEnd) {
      searchConditions.push(
        lte(accountsPayable.dueDate, dueDateEnd.toISOString().split('T')[0]),
      );
    }
    if (status) {
      searchConditions.push(eq(accountsPayable.status, status));
    }

    const finalCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${accountsPayable[sortBy as keyof typeof accountsPayable]} asc`
        : sql`${accountsPayable[sortBy as keyof typeof accountsPayable]} desc`;

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(accountsPayable)
      .where(finalCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.drizzle.query.accountsPayable.findMany({
      where: finalCondition,
      limit: limit,
      offset: offset,
      orderBy: orderBy,
    });

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
      data: data.map((invoice) => ({
        ...invoice,
        invoiceDate: new Date(invoice.invoiceDate),
        dueDate: new Date(invoice.dueDate),
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        remainingAmount: Number(invoice.remainingAmount),
      })) as Invoice[],
      meta,
    };
  }

  async findBySupplierByStatus(supplierId: number) {
    const data = await this.drizzle
      .select({
        id: accountsPayable.id,
        invoiceNumber: accountsPayable.invoiceNumber,
        concept: accountsPayable.concept,
        totalAmount: accountsPayable.totalAmount,
      })
      .from(accountsPayable)
      .where(
        and(
          eq(accountsPayable.supplierId, supplierId),
          eq(accountsPayable.status, 'PENDING'),
        ),
      );

    return {
      data,
    };
  }

  async findOne(id: number): Promise<Invoice> {
    const invoice = await this.drizzle.query.accountsPayable.findFirst({
      where: eq(accountsPayable.id, id),
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID '${id}' not found.`);
    }

    return {
      ...invoice,
      invoiceDate: new Date(invoice.invoiceDate),
      dueDate: new Date(invoice.dueDate),
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      remainingAmount: Number(invoice.remainingAmount),
    } as Invoice;
  }

  async update(
    userId: number,
    id: number,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<{ message: string; data: Invoice }> {
    const existingInvoice = await this.findOne(id);

    if (
      updateInvoiceDto.invoiceNumber &&
      updateInvoiceDto.invoiceNumber !== existingInvoice.invoiceNumber
    ) {
      const invoiceWithSameNumber =
        await this.drizzle.query.accountsPayable.findFirst({
          where: and(
            eq(
              accountsPayable.supplierId,
              updateInvoiceDto.supplierId ?? existingInvoice.supplierId,
            ),
            eq(accountsPayable.invoiceNumber, updateInvoiceDto.invoiceNumber),
            // Exclude current invoice from check
            // ne(accountsPayable.id, id) // Drizzle doesn't have ne directly, use not(eq())
          ),
        });
      if (invoiceWithSameNumber && invoiceWithSameNumber.id !== id) {
        throw new BadRequestException(
          `Invoice with number '${updateInvoiceDto.invoiceNumber}' for supplier ID '${updateInvoiceDto.supplierId ?? existingInvoice.supplierId}' already exists.`,
        );
      }
    }

    if (
      existingInvoice.status === invoiceSuppliersStatusEnum.PAID ||
      existingInvoice.status === invoiceSuppliersStatusEnum.CANCELLED
    ) {
      throw new BadRequestException(`Error: cannot edit account payable.`);
    }

    const [updatedInvoice] = await this.drizzle
      .update(accountsPayable)
      .set({
        ...updateInvoiceDto,
        currencyCode: 'VES' as CurrencyCodeEnum,
        totalAmount: updateInvoiceDto.totalAmount
          ? updateInvoiceDto.totalAmount.toString()
          : undefined,
        status: updateInvoiceDto.status ?? invoiceSuppliersStatusEnum.PENDING,
        invoiceDate: updateInvoiceDto.invoiceDate
          ? updateInvoiceDto.invoiceDate.toISOString().split('T')[0]
          : undefined,
        dueDate: updateInvoiceDto.dueDate
          ? updateInvoiceDto.dueDate.toISOString().split('T')[0]
          : undefined,
        remainingAmount: updateInvoiceDto.totalAmount?.toString(),
        updatedById: userId,
      })
      .where(eq(accountsPayable.id, id))
      .returning({
        id: accountsPayable.id,
        supplierId: accountsPayable.supplierId,
        invoiceNumber: accountsPayable.invoiceNumber,
        invoiceDate: accountsPayable.invoiceDate,
        dueDate: accountsPayable.dueDate,
        totalAmount: accountsPayable.totalAmount,
        paidAmount: accountsPayable.paidAmount,
        remainingAmount: accountsPayable.remainingAmount,
        concept: accountsPayable.concept,
        status: accountsPayable.status,
        observations: accountsPayable.observations,
      });

    if (!updatedInvoice) {
      throw new NotFoundException(
        `Invoice with ID '${id}' not found after update attempt.`,
      );
    }

    const dataMappers = {
      ...updatedInvoice,
      invoiceDate: new Date(updatedInvoice.invoiceDate),
      dueDate: new Date(updatedInvoice.dueDate),
      totalAmount: Number(updatedInvoice.totalAmount),
      paidAmount: Number(updatedInvoice.paidAmount),
      remainingAmount: Number(updatedInvoice.remainingAmount),
    } as Invoice;

    return {
      message: 'Account payable update successfully',
      data: dataMappers,
    };
  }

  async remove(id: number): Promise<{ message: string }> {
    const existingInvoice = await this.findOne(id);

    if (!existingInvoice) {
      throw new BadRequestException(
        `Cannot delete account payable does not exist.`,
      );
    }

    // Check if there are any payments associated with this invoice
    const payments = await this.drizzle.query.apPayments.findFirst({
      where: eq(schema.apPayments.payableId, id),
    });

    if (payments) {
      throw new BadRequestException(
        `Cannot delete invoice with ID '${id}' because it has associated payments.`,
      );
    }

    await this.drizzle
      .delete(accountsPayable)
      .where(eq(accountsPayable.id, id));

    return { message: `Invoice with ID '${id}' deleted successfully.` };
  }

  async getInvoicePayableStatus(): Promise<{
    message: string;
    data: {
      totalAmount: string | null;
      pendingAmount: string | null;
      paidAmount: string | null;
      overdueAmount: string | null;
    };
  }> {
    const sumary = await this.drizzle.select().from(accountsPayableSummaryView);

    return {
      message: 'fetched invoice payable summary successfully',
      data: {
        totalAmount: Number(sumary[0].totalAmount).toFixed(2),
        pendingAmount: Number(sumary[0].pendingAmount).toFixed(2),
        paidAmount: Number(sumary[0].paidAmount).toFixed(2),
        overdueAmount: Number(sumary[0].overdueAmount).toFixed(2),
      },
    };
  }
}
