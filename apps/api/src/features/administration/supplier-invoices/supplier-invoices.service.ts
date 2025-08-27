import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import {
  accountsPayable,
  purchaseOrders,
  supplierInvoiceItems,
  supplierInvoices,
  supplierPaymentLines,
  supplierPayments,
  suppliers,
} from '@/database/schema/administration';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, ne, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { AccountsPayableService } from '../accounts-payable/accounts-payable.service';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { FilterSupplierInvoiceDto } from './dto/filter-supplier-invoice.dto';
import { UpdateSupplierInvoiceDto } from './dto/update-supplier-invoice.dto';

@Injectable()
export class SupplierInvoicesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly bankMovementsService: BankMovementsService,
    private readonly accountsPayableService: AccountsPayableService,
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  async create(userId: number, dto: CreateSupplierInvoiceDto) {
    const { status } = dto;

    if (status !== 'DRAFT' && status !== 'PENDING') {
      throw new BadRequestException(
        `Invalid status for creation: ${status}. Only 'DRAFT' or 'PENDING' are allowed.`,
      );
    }

    return this.drizzle.transaction(async (tx) => {
      const newInvoice = await tx
        .insert(supplierInvoices)
        .values({
          ...dto,
          status: dto.status,
          subtotal: dto.subtotal.toString(),
          taxAmount: dto.taxAmount?.toString(),
          totalAmount: dto.totalAmount.toString(),
          dueDate: dto.dueDate?.toISOString(),
          invoiceDate: dto.invoiceDate.toISOString(),
          currencyCode: 'VES',
          createdById: userId,
          supplierInvoiceNumber:
            await this.generateCodeService.generateNextReference('FAC-P'),
        })
        .returning();

      if (dto.items && dto.items.length > 0) {
        const itemsToInsert = dto.items.map((item) => ({
          ...item,
          invoiceId: newInvoice[0].id,
          unitCost: item.unitCost.toString(),
          totalLine: item.totalLine.toString(),
          createdById: userId,
        }));
        await tx.insert(supplierInvoiceItems).values(itemsToInsert as any);
      }

      //return newInvoice[0];
      return {
        message: 'Supplier invoice created successfully',
      };
    });
  }

  async update(userId: number, id: number, dto: UpdateSupplierInvoiceDto) {
    return this.drizzle.transaction(async (tx) => {
      const existingInvoice = await tx.query.supplierInvoices.findFirst({
        where: eq(supplierInvoices.id, id),
        with: { items: true },
      });

      if (!existingInvoice) {
        throw new NotFoundException('Supplier invoice not found');
      }

      const originalStatus = existingInvoice.status;
      const newStatus = dto.status;

      // --- Logic for DRAFT invoices ---
      if (originalStatus === 'DRAFT') {
        const updatedFields = { ...dto, updatedById: userId };
        await this.updateInvoiceAndItems(id, userId, updatedFields, tx);

        if (newStatus === 'PENDING') {
          await tx
            .update(supplierInvoices)
            .set({ status: 'PENDING', updatedById: userId })
            .where(eq(supplierInvoices.id, id));
        }
        return tx.query.supplierInvoices.findFirst({
          where: eq(supplierInvoices.id, id),
        });
      }

      // --- Logic for PENDING invoices ---
      if (originalStatus === 'PENDING') {
        if (newStatus === 'ACCOUNTED_FOR') {
          const fullDto = {
            ...existingInvoice,
            ...dto,
          } as CreateSupplierInvoiceDto;
          return this.accountForInvoice(userId, id, fullDto, tx);
        }
        throw new BadRequestException(
          `Cannot update PENDING invoice to status '${newStatus}'. Only 'ACCOUNTED_FOR' is allowed.`,
        );
      }

      throw new BadRequestException(
        `Cannot update invoice with status '${originalStatus}'.`,
      );
    });
  }

  private async accountForInvoice(
    userId: number,
    invoiceId: number,
    dto: CreateSupplierInvoiceDto,
    tx: NodePgDatabase<typeof schema>,
  ) {
    // 1. Validations
    const supplier = await tx.query.suppliers.findFirst({
      where: and(
        eq(suppliers.id, dto.supplierId),
        eq(suppliers.status, 'ACTIVE'),
      ),
    });
    if (!supplier) {
      throw new BadRequestException(
        'Supplier is not active or does not exist.',
      );
    }

    const existingInvoice = await tx.query.supplierInvoices.findFirst({
      where: and(
        eq(supplierInvoices.invoiceNumber, dto.invoiceNumber),
        eq(supplierInvoices.supplierId, dto.supplierId),
        ne(supplierInvoices.id, invoiceId),
      ),
    });
    if (existingInvoice) {
      throw new ConflictException(
        'An invoice with this number and supplier already exists.',
      );
    }

    if (dto.totalAmount <= 0) {
      throw new BadRequestException('Total amount must be greater than 0.');
    }

    // 2. Purchase Order Logic
    if (dto.purchaseOrderId) {
      await this.updatePurchaseOrderStatus(dto.purchaseOrderId, tx);
    }

    // 3. Payment and Accounts Payable Logic
    await this.handlePaymentAndAccountsPayable(userId, invoiceId, dto, tx);

    // 4. Check if PO can be closed after payment
    if (dto.purchaseOrderId) {
      await this.checkAndClosePurchaseOrder(dto.purchaseOrderId, tx);
    }

    // 5. Finalize invoice status
    const isPaidImmediately = dto.paymentType === 'CASH' && dto.chargePayment;
    const finalStatus = isPaidImmediately ? 'PAID' : 'ACCOUNTED_FOR';

    await tx
      .update(supplierInvoices)
      .set({ status: finalStatus, updatedById: userId })
      .where(eq(supplierInvoices.id, invoiceId));

    return tx.query.supplierInvoices.findFirst({
      where: eq(supplierInvoices.id, invoiceId),
    });
  }

  private async updatePurchaseOrderStatus(
    purchaseOrderId: number,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const po = await tx.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, purchaseOrderId),
      with: { items: true },
    });
    if (!po) throw new NotFoundException('Purchase Order not found.');

    const relatedInvoices = await tx.query.supplierInvoices.findMany({
      where: and(
        eq(supplierInvoices.purchaseOrderId, purchaseOrderId),
        ne(supplierInvoices.status, 'CANCELLED'),
      ),
      with: { items: true },
    });

    const totalInvoicedPerItem = new Map<number, number>();
    for (const inv of relatedInvoices) {
      for (const item of inv.items) {
        if (item.itemId) {
          const currentQty = totalInvoicedPerItem.get(item.itemId) || 0;
          totalInvoicedPerItem.set(item.itemId, currentQty + item.quantity);
        }
      }
    }

    let isFullyInvoiced = true;
    for (const poItem of po.items) {
      const invoicedQty = totalInvoicedPerItem.get(poItem.itemId) || 0;
      if (invoicedQty > poItem.quantity) {
        throw new BadRequestException(
          `Item ${poItem.itemName} is being over-invoiced.`,
        );
      }
      if (invoicedQty < poItem.quantity) {
        isFullyInvoiced = false;
      }
    }

    const newStatus = isFullyInvoiced ? 'INVOICED' : 'RECEIVED';
    await tx
      .update(purchaseOrders)
      .set({ status: newStatus })
      .where(eq(purchaseOrders.id, purchaseOrderId));
  }

  private async handlePaymentAndAccountsPayable(
    userId: number,
    invoiceId: number,
    dto: CreateSupplierInvoiceDto,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const isCredit = dto.paymentType === 'CREDIT';
    const isCashNoPay = dto.paymentType === 'CASH' && !dto.chargePayment;

    if (isCredit || isCashNoPay) {
      await this.accountsPayableService.create(
        userId,
        {
          supplierInvoiceId: invoiceId,
          originalAmount: dto.totalAmount,
          paidAmount: 0,
          remainingAmount: dto.totalAmount,
          currencyCode: 'VES',
          status: 'PENDING',
          dueDate: dto.dueDate || new Date(),
          observations: `ACCOUNT PAYABLE FOR INVOICE ${dto.invoiceNumber}`,
        },
        tx,
      );
    } else if (dto.paymentType === 'CASH' && dto.chargePayment) {
      if (!dto.bankAccountId) {
        throw new BadRequestException(
          'Bank account is required for immediate payment.',
        );
      }
      const ap = await this.accountsPayableService.create(
        userId,
        {
          supplierInvoiceId: invoiceId,
          originalAmount: dto.totalAmount,
          paidAmount: 0,
          remainingAmount: dto.totalAmount,
          currencyCode: 'VES',
          status: 'PENDING',
          dueDate: new Date(),
        },
        tx,
      );

      const payment = await tx
        .insert(supplierPayments)
        .values({
          supplierId: dto.supplierId,
          paymentNumber:
            this.generateCodeService.generateNextReference('PAG-P'),
          totalAmount: dto.totalAmount.toString(),
          currencyCode: 'VES',
          paymentMethod: dto.paymentMethod,
          bankAccountId: dto.bankAccountId,
          status: 'PROCESSED',
          requestedAt: new Date(),
          createdById: userId,
          observations: dto.paymentDescription,
        })
        .returning();

      await tx.insert(supplierPaymentLines).values({
        supplierPaymentId: payment[0].id,
        accountsPayableId: ap.id,
        amount: dto.totalAmount.toString(),
      });

      await tx
        .update(accountsPayable)
        .set({
          paidAmount: dto.totalAmount.toString(),
          remainingAmount: '0',
          status: 'PAID',
        })
        .where(eq(accountsPayable.id, ap.id));

      await this.bankMovementsService.create(
        {
          bankAccountId: dto.bankAccountId,
          transactionDate: (dto.transactionDate || new Date()).toISOString(),
          description:
            dto.paymentDescription ||
            `Payment for invoice ${dto.invoiceNumber}`,
          debitAmount: dto.totalAmount,
          bankReference: dto.paymentBankReference,
          transactionType: dto.paymentMethod,
        },
        tx,
      );
    }
  }

  private async checkAndClosePurchaseOrder(
    purchaseOrderId: number,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const po = await tx.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, purchaseOrderId),
    });

    if (po?.status !== 'INVOICED') {
      return;
    }

    const relatedAPs = await tx.query.accountsPayable.findMany({
      where: inArray(
        accountsPayable.supplierInvoiceId,
        sql`(SELECT id FROM ${supplierInvoices} WHERE purchase_order_id = ${purchaseOrderId})`,
      ),
    });

    const allPaid = relatedAPs.every((ap) => ap.status === 'PAID');

    if (allPaid) {
      await tx
        .update(purchaseOrders)
        .set({ status: 'CLOSED' })
        .where(eq(purchaseOrders.id, purchaseOrderId));
    }
  }

  private async updateInvoiceAndItems(
    invoiceId: number,
    userId: number,
    dto: UpdateSupplierInvoiceDto,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const { items, ...invoiceData } = dto;
    await tx
      .update(supplierInvoices)
      .set({
        ...invoiceData,
        subtotal: dto.subtotal?.toString(),
        taxAmount: dto.taxAmount?.toString(),
        totalAmount: dto.totalAmount?.toString(),
        dueDate: dto.dueDate?.toISOString(),
        invoiceDate: dto.invoiceDate?.toISOString(),
        updatedById: userId,
      })
      .where(eq(supplierInvoices.id, invoiceId));

    if (items) {
      await tx
        .delete(supplierInvoiceItems)
        .where(eq(supplierInvoiceItems.invoiceId, invoiceId));

      const itemsToInsert = items.map((item) => ({
        ...item,
        invoiceId: invoiceId,
        unitCost: item.unitCost.toString(),
        totalLine: item.totalLine.toString(),
        createdById: userId,
      }));
      await tx.insert(supplierInvoiceItems).values(itemsToInsert as any);
    }
  }

  async findAll(paginationDto: FilterSupplierInvoiceDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      supplierId,
      status,
      startDate,
      endDate,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(
        ilike(supplierInvoices.invoiceNumber, `%${search}%`),
      );
    }
    if (supplierId) {
      searchConditions.push(eq(supplierInvoices.supplierId, supplierId));
    }
    if (status) {
      searchConditions.push(eq(supplierInvoices.status, status as any));
    }
    if (startDate) {
      searchConditions.push(
        sql`${supplierInvoices.invoiceDate} >= ${startDate}`,
      );
    }
    if (endDate) {
      searchConditions.push(sql`${supplierInvoices.invoiceDate} <= ${endDate}`);
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${supplierInvoices[sortBy as keyof typeof supplierInvoices]} asc`
        : sql`${supplierInvoices[sortBy as keyof typeof supplierInvoices]} desc`;

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(supplierInvoices)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const rawData = await this.drizzle
      .select({
        invoice: supplierInvoices,
        supplierName: suppliers.name,
        items: supplierInvoiceItems,
      })
      .from(supplierInvoices)
      .leftJoin(suppliers, eq(supplierInvoices.supplierId, suppliers.id))
      .leftJoin(
        supplierInvoiceItems,
        eq(supplierInvoices.id, supplierInvoiceItems.invoiceId),
      )
      .limit(limit)
      .offset(offset)
      .where(searchCondition)
      .orderBy(orderBy);

    // 3. Agrupa los ítems por orden en el código
    const groupedData = new Map<number, any>();

    rawData.forEach((row) => {
      if (!groupedData.has(row.invoice.id)) {
        // Mapea la orden y convierte los strings a numbers según tu esquema Zod

        const invoice = {
          id: row.invoice.id,
          supplierInvoiceNumber: row.invoice.supplierInvoiceNumber,
          supplierId: row.invoice.supplierId,
          supplierName: row.supplierName,
          purchaseOrderId: row.invoice.purchaseOrderId,
          invoiceNumber: row.invoice.invoiceNumber,
          controlNumber: row.invoice.controlNumber,
          invoiceDate: row.invoice.invoiceDate,
          dueDate: row.invoice.dueDate,
          subtotal: Number(row.invoice.subtotal),
          taxAmount: Number(row.invoice.taxAmount),
          totalAmount: Number(row.invoice.totalAmount),
          paymentType: row.invoice.paymentType,
          status: row.invoice.status,
          observations: row.invoice.observations,
          items: [],
        };
        groupedData.set(row.invoice.id, invoice);
      }

      // Mapea y convierte el ítem si existe
      if (row.items) {
        const item = {
          id: row.items.id,
          lineType: row.items.lineType,
          description: row.items.description,
          itemId: row.items.itemId,
          quantity: Number(row.items.quantity),
          unitCost: Number(row.items.unitCost),
          totalLine: Number(row.items.totalLine),
          expenseAccountId: row.items.expenseAccountId,
        };
        groupedData.get(row.invoice.id).items.push(item);
      }
    });

    const data = Array.from(groupedData.values());

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

    return { data, meta };
  }

  async findOne(id: number) {
    const data = await this.drizzle.query.supplierInvoices.findFirst({
      where: eq(supplierInvoices.id, id),
      with: {
        supplier: true,
        items: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Supplier invoice not found');
    }

    return data;
  }

  async remove(id: number) {
    const invoice = await this.drizzle.query.supplierInvoices.findFirst({
      where: eq(supplierInvoices.id, id),
    });
    if (!invoice) {
      throw new NotFoundException('Supplier invoice not found');
    }
    if (invoice.status === 'ACCOUNTED_FOR') {
      throw new BadRequestException(
        'Cannot cancel an invoice that has been accounted for.',
      );
    }
    await this.drizzle
      .update(supplierInvoices)
      .set({ status: 'CANCELLED' })
      .where(eq(supplierInvoices.id, id));
    return { message: 'Supplier invoice cancelled successfully' };
  }
}
