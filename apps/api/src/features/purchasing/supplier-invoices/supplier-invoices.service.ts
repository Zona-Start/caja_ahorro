import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  accountsPayable,
  purchaseOrders,
  supplierCreditNotes,
  supplierDebitNotes,
  supplierInvoiceItems,
  supplierInvoices,
  supplierPaymentLines,
  supplierPayments,
  suppliers,
  supplierTransactionApplications,
  supplierTransactions,
} from '@/database/schema';
import { CurrencyCodeEnum, paymentAccountsPayableEnum, priceTypeEnum } from '@/types/enum';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { updatePurchaseOrderStatus } from '@/features/purchasing/shared/update-purchase-order-status';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { differenceInDays } from 'date-fns';
import { and, eq, ilike, inArray, ne, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { FixedAssetPricesService } from '../../inventory/fixed-asset-prices/fixed-asset-prices.service';
import { InventoryMovementsService } from '../../inventory/inventory-movements/inventory-movements.service';
import { ProductPricesService } from '../../inventory/product-prices/product-prices.service';
import { ServicePricesService } from '../../inventory/services-prices/services-prices.service';
import { AccountsPayableService } from '../accounts-payable/accounts-payable.service';

@Injectable()
export class SupplierInvoicesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private accountsPayableService: AccountsPayableService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly productPricesService: ProductPricesService,
    private readonly inventoryMovementsService: InventoryMovementsService,
    private readonly fixedAssetPricesService: FixedAssetPricesService,
    private readonly servicePricesService: ServicePricesService,
    private readonly accountingEntriesService: AccountingEntriesService,
  ) { }

  async create(userId: string, dto: any, tenantId: string) {
    const supplier = await this.drizzle
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, dto.supplierId));

    if (supplier.length === 0) {
      throw new NotFoundException('Supplier not found');
    }

    return this.drizzle.transaction(async (tx) => {
      const invoiceNumber = await this.generateCodeService.generateNextReference(
        'FAC-P',
        tenantId,
        'purchasing',
        'invoices',
      );

      const newInvoice = await tx
        .insert(supplierInvoices)
        .values({
          tenantId,
          supplierId: dto.supplierId,
          purchaseOrderId: dto.purchaseOrderId ?? null,
          inventoryMovementId: dto.inventoryMovementId ?? null,
          invoiceNumber: dto.invoiceNumber,
          controlNumber: dto.controlNumber,
          invoiceDate:
            dto.invoiceDate instanceof Date
              ? dto.invoiceDate.toISOString()
              : dto.invoiceDate,
          dueDate: dto.dueDate
            ? dto.dueDate instanceof Date
              ? dto.dueDate.toISOString()
              : dto.dueDate
            : null,
          subtotal: dto.subtotal.toString(),
          taxAmount: dto.taxAmount?.toString() ?? '0.00',
          totalAmount: dto.totalAmount.toString(),
          currencyCode: dto.currencyCode ?? 'VES',
          paymentType: dto.paymentType ?? 'CREDIT',
          paymentMethod: dto.paymentMethod ?? null,
          bankAccountId: dto.bankAccountId ?? null,
          bankReference: dto.bankReference ?? null,
          status: 'DRAFT',
          observations: dto.observations,
          createdById: userId,
          supplierInvoiceNumber: invoiceNumber,
        })
        .returning({ id: supplierInvoices.id, status: supplierInvoices.status });

      const invoiceId = newInvoice[0].id;

      if (dto.items && dto.items.length > 0) {
        const itemsToInsert = dto.items.map((item: any) => ({
          ...item,
          invoiceId,
          unitCost: item.unitCost.toString(),
          totalLine: item.totalLine.toString(),
          createdById: userId,
        }));
        await tx.insert(supplierInvoiceItems).values(itemsToInsert as any);
      }

      const [completeInvoice] = await tx
        .select({
          id: supplierInvoices.id,
          supplierId: supplierInvoices.supplierId,
          purchaseOrderId: supplierInvoices.purchaseOrderId,
          inventoryMovementId: supplierInvoices.inventoryMovementId,
          invoiceNumber: supplierInvoices.invoiceNumber,
          controlNumber: supplierInvoices.controlNumber,
          invoiceDate: supplierInvoices.invoiceDate,
          dueDate: supplierInvoices.dueDate,
          subtotal: supplierInvoices.subtotal,
          taxAmount: supplierInvoices.taxAmount,
          totalAmount: supplierInvoices.totalAmount,
          paymentType: supplierInvoices.paymentType,
          status: supplierInvoices.status,
          observations: supplierInvoices.observations,
        })
        .from(supplierInvoices)
        .where(eq(supplierInvoices.id, invoiceId));

      const items = await tx
        .select({
          id: supplierInvoiceItems.id,
          lineType: supplierInvoiceItems.lineType,
          description: supplierInvoiceItems.description,
          quantity: supplierInvoiceItems.quantity,
          unitCost: supplierInvoiceItems.unitCost,
          totalLine: supplierInvoiceItems.totalLine,
          itemId: supplierInvoiceItems.itemId,
          expenseAccountId: supplierInvoiceItems.expenseAccountId,
        })
        .from(supplierInvoiceItems)
        .where(eq(supplierInvoiceItems.invoiceId, invoiceId));

      return { ...completeInvoice, items };
    });
  }

  async approve(userId: string, invoiceId: string, tenantId: string) {
    return this.drizzle.transaction(async (tx) => {
      const invoice = await tx.query.supplierInvoices.findFirst({
        where: and(
          eq(supplierInvoices.id, invoiceId),
          eq(supplierInvoices.tenantId, tenantId),
        ),
        with: { items: true },
      });

      if (!invoice) {
        throw new NotFoundException('Supplier invoice not found');
      }

      if (invoice.status !== 'DRAFT') {
        throw new BadRequestException(
          `Cannot approve invoice with status '${invoice.status}'. Only DRAFT invoices can be approved.`,
        );
      }

      const supplier = await tx
        .select()
        .from(suppliers)
        .where(
          and(eq(suppliers.id, invoice.supplierId), eq(suppliers.status, 'ACTIVE')),
        );

      if (supplier.length === 0) {
        throw new BadRequestException('Supplier is not active or does not exist.');
      }

      const existing = await tx
        .select()
        .from(supplierInvoices)
        .where(
          and(
            eq(supplierInvoices.invoiceNumber, invoice.invoiceNumber),
            eq(supplierInvoices.supplierId, invoice.supplierId),
            ne(supplierInvoices.id, invoiceId),
          ),
        );

      if (existing.length !== 0) {
        throw new ConflictException(
          'An invoice with this number and supplier already exists.',
        );
      }

      const totalAmount = Number(invoice.totalAmount);
      if (totalAmount <= 0) {
        throw new BadRequestException('Total amount must be greater than 0.');
      }

      const isCash = invoice.paymentType === 'CASH';
      const subtotal = Number(invoice.subtotal);
      const taxAmount = Number(invoice.taxAmount);

      // ── Crear precios y movimientos de inventario ──
      // for (const item of invoice.items) {
      //   const quantity = item.quantity;
      //   const unitCost = Number(item.unitCost);

      //   if (item.lineType === 'SALES_INVENTORY') {
      //     const resultProduct = await this.productPricesService.create(
      //       {
      //         productId: item?.itemId ?? 0,
      //         suppliersId: invoice.supplierId,
      //         priceType: 'SELLING' as priceTypeEnum,
      //         baseCost: unitCost,
      //         otherCosts: 0,
      //         isActive: true,
      //         supplierInvoiceId: invoiceId,
      //       } as any,
      //       userId,
      //       tx as any,
      //     );

      //     await (this.inventoryMovementsService as any).create(
      //       userId,
      //       {
      //         movementType: 'IN',
      //         description: `INGRESO PRODUCTO POR FACTURA DE PROVEEDOR ${invoice.invoiceNumber}`,
      //         documentType: 'COMPRA',
      //         documentNumber: invoice.invoiceNumber,
      //         supplierInvoiceId: invoiceId,
      //         items: [
      //           {
      //             itemId: item.itemId ?? 0,
      //             itemType: 'PRODUCT',
      //             quantity: quantity,
      //             unitCost: Number(resultProduct.data.totalCost),
      //           },
      //         ],
      //       } as any,
      //       tx as any,
      //     );
      //   } else if (item.lineType === 'FIXED_ASSET') {
      //     const resultFixedAsset = await (
      //       this.fixedAssetPricesService as any
      //     ).create(
      //       userId,
      //       {
      //         fixedAssetsId: item.itemId ?? 0,
      //         baseCost: unitCost,
      //         otherCosts: 0,
      //         purchaseTax: 0,
      //         startDate: invoice.invoiceDate,
      //         supplierInvoiceId: invoiceId,
      //         isActive: true,
      //       } as any,
      //       tx as any,
      //     );

      //     await (this.inventoryMovementsService as any).create(
      //       userId,
      //       {
      //         movementType: 'IN',
      //         description: `INGRESO ACTIVO POR FACTURA PROVEEDOR ${invoice.invoiceNumber}`,
      //         documentType: 'COMPRA',
      //         documentNumber: invoice.invoiceNumber,
      //         supplierInvoiceId: invoiceId,
      //         items: [
      //           {
      //             itemId: item.itemId ?? 0,
      //             itemType: 'FIXED_ASSET',
      //             quantity: quantity,
      //             unitCost: Number(resultFixedAsset.data.totalCost),
      //           },
      //         ],
      //       } as any,
      //       tx as any,
      //     );
      //   } else if (item.lineType === 'SERVICE') {
      //     await (this.servicePricesService as any).create(
      //       userId,
      //       {
      //         serviceId: item.itemId ?? 0,
      //         baseCost: unitCost,
      //         otherCosts: 0,
      //         purchaseTax: 0,
      //         startDate: invoice.invoiceDate,
      //         isActive: true,
      //         supplierInvoiceId: invoiceId,
      //       } as any,
      //       tx as any,
      //     );
      //   }
      // }

      // ── Crear Cuenta por Pagar ──
      const cxpStatus = isCash ? 'PAID' : 'PENDING';
      const rr = await this.accountsPayableService.create(
        userId,
        {
          tenantId,
          supplierId: invoice.supplierId,
          supplierInvoiceId: invoiceId,
          originalAmount: totalAmount,
          paidAmount: isCash ? totalAmount : 0,
          remainingAmount: isCash ? 0 : totalAmount,
          currencyCode: invoice.currencyCode ?? 'VES',
          status: cxpStatus,
          dueDate: invoice.dueDate || new Date(),
          priority: this.isOverdue(invoice.dueDate) ? 'ALTA' : 'NORMAL',
          observations: `CUENTA POR PAGAR POR FACTURA N° ${invoice.supplierInvoiceNumber}`,
        },
        tx,
      );


      // ── Flujo CONTADO: crear transacción bancaria ──
      if (isCash) {
        if (!invoice.paymentMethod || !invoice.bankAccountId) {
          throw new BadRequestException(
            'Payment method and bank account are required for cash invoices.',
          );
        }

        const paymentRef = await this.generateCodeService.generateNextReference(
          'CXP-PAG',
          tenantId,
          'purchasing',
          'accounts_payables',
        );

        await tx.insert(supplierTransactions).values({
          tenantId,
          supplierId: invoice.supplierId,
          transactionNumber: paymentRef,
          transactionType: 'PAYMENT',
          transactionDate: new Date().toISOString(),
          amount: totalAmount.toString(),
          currencyCode: invoice.currencyCode ?? 'VES',
          status: 'APPLIED',
          paymentMethod: invoice.paymentMethod,
          bankAccountId: invoice.bankAccountId,
          bankReference: invoice.bankReference,
          observations: `Pago de contado factura ${invoice.invoiceNumber}`,
          createdById: userId,
        });

        await tx.insert(schema.bankTransactions).values({
          tenantId,
          bankAccountId: invoice.bankAccountId,
          paymentMethod: invoice.paymentMethod,
          transactionDate: new Date().toISOString().split('T')[0],
          description: `Pago a proveedor - Factura ${invoice.invoiceNumber}`,
          category: 'SUPPLIER_PAYMENT',
          bankReference: invoice.bankReference ?? paymentRef,
          debitAmount: totalAmount.toString(),
          creditAmount: '0.00',
          reconciliationStatus: 'PENDING',
          createdById: userId,
        } as any);
      }

      // ── Actualizar estado de la OC si está vinculada ──
      if (invoice.purchaseOrderId) {
        await updatePurchaseOrderStatus(invoice.purchaseOrderId, tx);
      }

      // ── Asiento contable ──
      // try {
      //   await this.accountingEntriesService.createAutomaticEntry(
      //     tenantId,
      //     userId,
      //     {
      //       module: 'purchasing',
      //       submodule: 'supplier-invoices',
      //       category: 'PURCHASING',
      //       operationType: 'INVOICE_APPROVED',
      //       description: `Factura de compra ${invoice.invoiceNumber} - ${supplier[0].name}`,
      //       entryDate: new Date(invoice.invoiceDate),
      //       currencyCode: CurrencyCodeEnum.VES,
      //       originReferenceId: invoiceId,
      //       originType: 'SUPPLIER_INVOICE',
      //       items: [
      //         {
      //           supplierId: invoice.supplierId,
      //           amounts: {
      //             SUBTOTAL: subtotal,
      //             TAX: taxAmount,
      //             TOTAL_AMOUNT: totalAmount,
      //           },
      //           description: `Factura ${invoice.invoiceNumber}`,
      //         },
      //       ],
      //     },
      //     tx,
      //   );
      // } catch (error: any) {
      //   if (
      //     error instanceof BadRequestException &&
      //     error.message.includes('No existe una regla contable')
      //   ) {
      //     // Silently skip if no accounting rules configured
      //   } else {
      //     throw error;
      //   }
      // }

      // ── Marcar como APROBADA ──
      await tx
        .update(supplierInvoices)
        .set({ status: cxpStatus === 'PAID' ? 'PAID' : 'APPROVED', updatedById: userId })
        .where(eq(supplierInvoices.id, invoiceId));

      return { message: 'Supplier invoice approved successfully' };
    });
  }

  async update(invoiceId: string, userId: string, dto: any, tenantId: string) {
    return this.drizzle.transaction(async (tx) => {
      const [currentInvoice] = await tx
        .select({ status: supplierInvoices.status })
        .from(supplierInvoices)
        .where(
          and(
            eq(supplierInvoices.id, invoiceId),
            eq(supplierInvoices.tenantId, tenantId),
          ),
        );

      if (!currentInvoice || currentInvoice.status !== 'DRAFT') {
        throw new BadRequestException(
          `Cannot update invoice. Current status is '${currentInvoice?.status}', only DRAFT can be modified.`,
        );
      }

      await tx
        .update(supplierInvoices)
        .set({
          supplierId: dto.supplierId,
          purchaseOrderId: dto.purchaseOrderId ?? null,
          invoiceNumber: dto.invoiceNumber,
          controlNumber: dto.controlNumber,
          invoiceDate:
            dto.invoiceDate instanceof Date
              ? dto.invoiceDate.toISOString()
              : dto.invoiceDate,
          dueDate: dto.dueDate
            ? dto.dueDate instanceof Date
              ? dto.dueDate.toISOString()
              : dto.dueDate
            : null,
          subtotal: dto.subtotal?.toString(),
          taxAmount: dto.taxAmount?.toString(),
          totalAmount: dto.totalAmount?.toString(),
          paymentType: dto.paymentType ?? 'CREDIT',
          paymentMethod: dto.paymentMethod ?? null,
          bankAccountId: dto.bankAccountId ?? null,
          bankReference: dto.bankReference ?? null,
          observations: dto.observations,
          updatedById: userId,
        })
        .where(eq(supplierInvoices.id, invoiceId));

      await tx
        .delete(supplierInvoiceItems)
        .where(eq(supplierInvoiceItems.invoiceId, invoiceId));

      if (dto.items && dto.items.length > 0) {
        const itemsToInsert = dto.items.map((item: any) => ({
          ...item,
          invoiceId: invoiceId,
          unitCost: item.unitCost?.toString(),
          totalLine: item.totalLine?.toString(),
          createdById: userId,
        }));
        await tx.insert(supplierInvoiceItems).values(itemsToInsert as any);
      }

      const [completeInvoice] = await tx
        .select({
          id: supplierInvoices.id,
          supplierId: supplierInvoices.supplierId,
          purchaseOrderId: supplierInvoices.purchaseOrderId,
          invoiceNumber: supplierInvoices.invoiceNumber,
          controlNumber: supplierInvoices.controlNumber,
          invoiceDate: supplierInvoices.invoiceDate,
          dueDate: supplierInvoices.dueDate,
          subtotal: supplierInvoices.subtotal,
          taxAmount: supplierInvoices.taxAmount,
          totalAmount: supplierInvoices.totalAmount,
          paymentType: supplierInvoices.paymentType,
          status: supplierInvoices.status,
          observations: supplierInvoices.observations,
        })
        .from(supplierInvoices)
        .where(eq(supplierInvoices.id, invoiceId));

      const items = await tx
        .select({
          id: supplierInvoiceItems.id,
          lineType: supplierInvoiceItems.lineType,
          description: supplierInvoiceItems.description,
          quantity: supplierInvoiceItems.quantity,
          unitCost: supplierInvoiceItems.unitCost,
          totalLine: supplierInvoiceItems.totalLine,
          itemId: supplierInvoiceItems.itemId,
          expenseAccountId: supplierInvoiceItems.expenseAccountId,
        })
        .from(supplierInvoiceItems)
        .where(eq(supplierInvoiceItems.invoiceId, invoiceId));

      return {
        data: { ...completeInvoice, items },
        message: 'Supplier invoice updated successfully',
      };
    });
  }



  private isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    const date = new Date(dueDate);
    const now = new Date();
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return differenceInDays(date, now) < 0;
  }

  async findAll(paginationDto: any, tenantId: string) {
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

    const searchConditions: SQL<unknown>[] = [];
    if (tenantId) {
      searchConditions.push(eq(supplierInvoices.tenantId, tenantId));
    }
    if (search) {
      searchConditions.push(
        ilike(supplierInvoices.supplierInvoiceNumber, `%${search}%`),
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
        sql`${supplierInvoices.invoiceDate} >= ${startDate instanceof Date ? startDate.toISOString() : startDate}`,
      );
    }
    if (endDate) {
      searchConditions.push(
        sql`${supplierInvoices.invoiceDate} <= ${endDate instanceof Date ? endDate.toISOString() : endDate}`,
      );
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

    const invoices = await this.drizzle
      .select({
        invoice: supplierInvoices,
        supplierName: suppliers.name,
        purchaseOrdersNumber: purchaseOrders.orderNumber,
      })
      .from(supplierInvoices)
      .leftJoin(suppliers, eq(supplierInvoices.supplierId, suppliers.id))
      .leftJoin(
        purchaseOrders,
        eq(supplierInvoices.purchaseOrderId, purchaseOrders.id),
      )
      .limit(limit)
      .offset(offset)
      .where(searchCondition)
      .orderBy(orderBy);

    const invoiceIds = invoices.map((row) => row.invoice.id);

    if (invoiceIds.length === 0) {
      return {
        data: [],
        meta: {
          page: Number(page),
          limit: Number(limit),
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
      };
    }

    const allItems = await this.drizzle
      .select()
      .from(supplierInvoiceItems)
      .where(inArray(supplierInvoiceItems.invoiceId, invoiceIds));

    const data = invoices.map((invoiceRow) => {
      const invoice = {
        id: invoiceRow.invoice.id,
        supplierInvoiceNumber: invoiceRow.invoice.supplierInvoiceNumber,
        supplierId: invoiceRow.invoice.supplierId,
        supplierName: invoiceRow.supplierName,
        purchaseOrderId: invoiceRow.invoice.purchaseOrderId,
        purchaseOrdersNumber: invoiceRow.purchaseOrdersNumber,
        invoiceNumber: invoiceRow.invoice.invoiceNumber,
        controlNumber: invoiceRow.invoice.controlNumber,
        invoiceDate: invoiceRow.invoice.invoiceDate,
        dueDate: invoiceRow.invoice.dueDate,
        subtotal: Number(invoiceRow.invoice.subtotal),
        taxAmount: Number(invoiceRow.invoice.taxAmount),
        totalAmount: Number(invoiceRow.invoice.totalAmount),
        paymentType: invoiceRow.invoice.paymentType,
        paymentMethod: invoiceRow.invoice.paymentMethod,
        bankAccountId: invoiceRow.invoice.bankAccountId,
        bankReference: invoiceRow.invoice.bankReference,
        currencyCode: invoiceRow.invoice.currencyCode,
        inventoryMovementId: invoiceRow.invoice.inventoryMovementId,
        status: invoiceRow.invoice.status,
        observations: invoiceRow.invoice.observations,
        items: [] as any[],
      };

      const invoiceItems = allItems.filter(
        (item) => item.invoiceId === invoice.id,
      );

      invoice.items = invoiceItems.map((item) => ({
        id: item.id,
        lineType: item.lineType,
        description: item.description,
        itemId: item.itemId,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        totalLine: Number(item.totalLine),
        expenseAccountId: item.expenseAccountId,
      }));

      return invoice;
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

    return { data, meta };
  }

  async findOne(id: string, tenantId: string) {
    const data = await this.drizzle.query.supplierInvoices.findFirst({
      where: and(
        eq(supplierInvoices.id, id),
        eq(supplierInvoices.tenantId, tenantId),
      ),
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

  async remove(id: string, tenantId: string) {
    return this.drizzle.transaction(async (tx) => {
      const invoice = await tx.query.supplierInvoices.findFirst({
        where: and(
          eq(supplierInvoices.id, id),
          eq(supplierInvoices.tenantId, tenantId),
        ),
      });
      if (!invoice) {
        throw new NotFoundException('Supplier invoice not found');
      }
      if (invoice.status !== 'DRAFT') {
        throw new BadRequestException(
          'Only DRAFT invoices can be cancelled.',
        );
      }

      const accountsPayableRecord = await tx
        .select()
        .from(accountsPayable)
        .where(eq(accountsPayable.supplierInvoiceId, id));

      const accountsPayableId = accountsPayableRecord.length
        ? accountsPayableRecord[0].id
        : null;

      const associatedPayments = await tx
        .select()
        .from(supplierPayments)
        .leftJoin(
          supplierPaymentLines,
          eq(supplierPayments.id, supplierPaymentLines.supplierPaymentId),
        )
        .leftJoin(
          accountsPayable,
          eq(supplierPaymentLines.accountsPayableId, accountsPayable.id),
        )
        .where(
          and(
            eq(accountsPayable.supplierInvoiceId, id),
            ne(supplierPayments.status, 'CANCELLED'),
          ),
        );

      if (associatedPayments.length > 0) {
        throw new BadRequestException(
          'Cannot cancel invoice: associated payments exist.',
        );
      }

      if (accountsPayableId) {
        const appliedCreditNotes = await tx
          .select()
          .from(supplierTransactionApplications)
          .leftJoin(
            supplierTransactions,
            eq(
              supplierTransactions.id,
              supplierTransactionApplications.transactionId,
            ),
          )
          .where(
            and(
              eq(
                supplierTransactionApplications.accountsPayableId,
                accountsPayableId,
              ),
              eq(supplierTransactions.transactionType, 'CREDIT_NOTE'),
              eq(supplierTransactions.status, 'ACTIVE'),
            ),
          );

        if (appliedCreditNotes.length > 0) {
          throw new BadRequestException(
            'Cannot cancel invoice: associated credit notes exist.',
          );
        }
      }

      await tx
        .update(supplierInvoices)
        .set({ status: 'CANCELLED' })
        .where(eq(supplierInvoices.id, id));

      const [accountsPayableToUpdate] = await tx
        .select()
        .from(accountsPayable)
        .where(eq(accountsPayable.supplierInvoiceId, id));

      if (accountsPayableToUpdate) {
        await tx
          .update(accountsPayable)
          .set({ status: 'CANCELLED', remainingAmount: '0.00' })
          .where(eq(accountsPayable.id, accountsPayableToUpdate.id));
      }

      return { message: 'Supplier invoice cancelled successfully' };
    });
  }

  async createCreditNote(
    userId: string,
    dto: any,
    tenantId: string,
  ) {
    const supplier = await this.drizzle
      .select()
      .from(suppliers)
      .where(
        and(eq(suppliers.id, dto.supplierId), eq(suppliers.status, 'ACTIVE')),
      );

    if (supplier.length === 0) {
      throw new NotFoundException('Supplier not found or inactive');
    }

    return this.drizzle.transaction(async (tx) => {
      const referenceNumber =
        await this.generateCodeService.generateNextReference(
          'NC-P',
          tenantId,
          'purchasing',
          'transactions',
          tx,
        );

      const creditNoteNumber = dto.creditNoteNumber || referenceNumber;

      const [newTransaction] = await tx
        .insert(supplierTransactions)
        .values({
          tenantId,
          supplierId: dto.supplierId,
          transactionNumber: referenceNumber,
          transactionType: 'CREDIT_NOTE',
          transactionDate:
            dto.notesDate instanceof Date
              ? dto.notesDate.toISOString()
              : dto.notesDate,
          amount: dto.amount.toString(),
          currencyCode: 'VES',
          status: 'ACTIVE',
          observations: dto.observations ??
            `Nota de crédito ${creditNoteNumber}: ${dto.reason}`,
          createdById: userId,
        })
        .returning();

      await tx.insert(supplierCreditNotes).values({
        tenantId,
        transactionId: newTransaction.id,
        supplierId: dto.supplierId,
        accountsPayableId: dto.accountsPayableId || null,
        creditNoteNumber,
        reason: dto.reason,
        amount: dto.amount.toString(),
        availableAmount: dto.amount.toString(),
        createdById: userId,
      });

      if (dto.returnItems && dto.returnItems.length > 0) {
        for (const item of dto.returnItems) {
          await (this.inventoryMovementsService as any).create(
            userId,
            {
              movementType: 'OUT',
              description: `DEVOLUCIÓN POR NC ${dto.creditNoteNumber}: ${dto.reason}`,
              documentType: 'NC_COMPRA',
              documentNumber: dto.creditNoteNumber,
              items: [
                {
                  itemId: item.itemId,
                  itemType: item.itemType,
                  quantity: item.quantity,
                  unitCost: item.unitCost,
                },
              ],
            } as any,
            tx as any,
          );
        }
      }

      if (dto.accountsPayableId) {
        const [cxp] = await tx
          .select()
          .from(accountsPayable)
          .where(eq(accountsPayable.id, dto.accountsPayableId));

        if (cxp && cxp.status !== 'PAID' && cxp.status !== 'CANCELLED') {
          const ncAmount = Number(dto.amount);
          const newRemaining = Number(cxp.remainingAmount) - ncAmount;
          const newPaid = Number(cxp.paidAmount) + ncAmount;
          const newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIALLY_PAID';

          await tx
            .update(accountsPayable)
            .set({
              remainingAmount: String(Math.max(0, newRemaining)),
              paidAmount: String(newPaid),
              status: newStatus as paymentAccountsPayableEnum,
              updatedById: userId,
            })
            .where(eq(accountsPayable.id, dto.accountsPayableId));

          await tx.insert(supplierTransactionApplications).values({
            tenantId,
            transactionId: newTransaction.id,
            accountsPayableId: dto.accountsPayableId,
            appliedAmount: dto.amount.toString(),
            applicationDate: new Date().toISOString(),
            createdById: userId,
          });

          await tx
            .update(supplierCreditNotes)
            .set({ availableAmount: '0.00' })
            .where(eq(supplierCreditNotes.transactionId, newTransaction.id));

          await tx
            .update(supplierTransactions)
            .set({ status: 'APPLIED' })
            .where(eq(supplierTransactions.id, newTransaction.id));
        }
      }

      return {
        data: {
          id: newTransaction.id,
          transactionNumber: newTransaction.transactionNumber,
          transactionType: newTransaction.transactionType,
          amount: newTransaction.amount,
          status: newTransaction.status,
          observations: newTransaction.observations,
        },
        message: 'Credit note created successfully',
      };
    });
  }

  async createDebitNote(
    userId: string,
    dto: any,
    tenantId: string,
  ) {
    const supplier = await this.drizzle
      .select()
      .from(suppliers)
      .where(
        and(eq(suppliers.id, dto.supplierId), eq(suppliers.status, 'ACTIVE')),
      );

    if (supplier.length === 0) {
      throw new NotFoundException('Supplier not found or inactive');
    }

    return this.drizzle.transaction(async (tx) => {
      const referenceNumber =
        await this.generateCodeService.generateNextReference(
          'ND-P',
          tenantId,
          'purchasing',
          'transactions',
          tx,
        );

      const debitNoteNumber = dto.debitNoteNumber || referenceNumber;

      const [newTransaction] = await tx
        .insert(supplierTransactions)
        .values({
          tenantId,
          supplierId: dto.supplierId,
          transactionNumber: referenceNumber,
          transactionType: 'DEBIT_NOTE',
          transactionDate:
            dto.notesDate instanceof Date
              ? dto.notesDate.toISOString()
              : dto.notesDate,
          amount: dto.amount.toString(),
          currencyCode: 'VES',
          status: 'APPLIED',
          observations: dto.observations ??
            `Nota de débito ${debitNoteNumber}: ${dto.reason}`,
          createdById: userId,
        })
        .returning();

      await tx.insert(supplierDebitNotes).values({
        tenantId,
        transactionId: newTransaction.id,
        supplierId: dto.supplierId,
        accountsPayableId: dto.accountsPayableId || null,
        debitNoteNumber,
        reason: dto.reason,
        amount: dto.amount.toString(),
        createdById: userId,
      });

      if (dto.accountsPayableId) {
        const [cxp] = await tx
          .select()
          .from(accountsPayable)
          .where(eq(accountsPayable.id, dto.accountsPayableId));

        if (cxp && cxp.status === 'PAID') {
          const cxpNumber = await this.generateCodeService.generateNextReference(
            'CXP',
            tenantId,
            'purchasing',
            'payables',
            tx,
          );

          await tx.insert(accountsPayable).values({
            tenantId,
            supplierId: dto.supplierId,
            supplierInvoiceId: cxp.supplierInvoiceId || null,
            accountsPayableNumber: cxpNumber,
            originalAmount: dto.amount.toString(),
            paidAmount: '0.00',
            remainingAmount: dto.amount.toString(),
            dueDate: new Date().toISOString(),
            currencyCode: 'VES',
            status: 'PENDING',
            observations: `Generada por ND ${dto.debitNoteNumber}: ${dto.reason}`,
            createdById: userId,
          });
        } else if (cxp) {
          await tx.insert(supplierTransactionApplications).values({
            tenantId,
            transactionId: newTransaction.id,
            accountsPayableId: dto.accountsPayableId,
            appliedAmount: dto.amount.toString(),
            applicationDate: new Date().toISOString(),
            createdById: userId,
          });

          const newRemaining =
            Number(cxp.remainingAmount) + Number(dto.amount);
          const newPaid = Number(cxp.paidAmount) - Number(dto.amount);

          await tx
            .update(accountsPayable)
            .set({
              remainingAmount: newRemaining.toString(),
              paidAmount: Math.max(newPaid, 0).toString(),
              status: 'APPROVED' as paymentAccountsPayableEnum,
              updatedById: userId,
            })
            .where(eq(accountsPayable.id, dto.accountsPayableId));
        }
      }

      return {
        data: {
          id: newTransaction.id,
          transactionNumber: newTransaction.transactionNumber,
          transactionType: newTransaction.transactionType,
          amount: newTransaction.amount,
          status: newTransaction.status,
          observations: newTransaction.observations,
        },
        message: 'Debit note created successfully',
      };
    });
  }

  async voidInvoice(
    userId: string,
    invoiceId: string,
    dto: any,
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [invoice] = await tx
        .select()
        .from(supplierInvoices)
        .where(
          and(
            eq(supplierInvoices.id, invoiceId),
            eq(supplierInvoices.tenantId, tenantId),
          ),
        );

      if (!invoice) {
        throw new NotFoundException('Supplier invoice not found');
      }

      if (!['APPROVED', 'PARTIALLY_PAID', 'PAID'].includes(invoice.status)) {
        throw new BadRequestException(
          `Cannot void invoice with status '${invoice.status}'. Only APPROVED, PARTIALLY_PAID, or PAID invoices can be voided.`,
        );
      }

      const [cxp] = await tx
        .select()
        .from(accountsPayable)
        .where(eq(accountsPayable.supplierInvoiceId, invoiceId));

      if (cxp) {
        const appliedTransactions = await tx
          .select()
          .from(supplierTransactionApplications)
          .where(
            eq(supplierTransactionApplications.accountsPayableId, cxp.id),
          );

        if (appliedTransactions.length > 0) {
          throw new BadRequestException(
            'Cannot void invoice: there are applied transactions (payments, NC, ND). Revert them first.',
          );
        }

        await tx
          .update(accountsPayable)
          .set({ status: 'CANCELLED', remainingAmount: '0.00', updatedById: userId })
          .where(eq(accountsPayable.id, cxp.id));
      }

      const invoiceItems = await tx
        .select()
        .from(supplierInvoiceItems)
        .where(eq(supplierInvoiceItems.invoiceId, invoiceId));

      for (const item of invoiceItems) {
        if (
          item.lineType === 'SALES_INVENTORY' ||
          item.lineType === 'FIXED_ASSET'
        ) {
          await (this.inventoryMovementsService as any).create(
            userId,
            {
              movementType: 'OUT',
              description: `ANULACIÓN FACTURA ${invoice.invoiceNumber}: ${dto.reason}`,
              documentType: 'ANULACION_COMPRA',
              documentNumber: invoice.invoiceNumber,
              items: [
                {
                  itemId: item.itemId ?? 0,
                  itemType:
                    item.lineType === 'FIXED_ASSET' ? 'FIXED_ASSET' : 'PRODUCT',
                  quantity: Number(item.quantity),
                  unitCost: Number(item.unitCost),
                },
              ],
            } as any,
            tx as any,
          );
        }
      }

      await tx
        .update(supplierInvoices)
        .set({
          status: 'CANCELLED',
          observations: `ANULADO: ${dto.reason}`,
          updatedById: userId,
        })
        .where(eq(supplierInvoices.id, invoiceId));

      if (invoice.purchaseOrderId) {
        await updatePurchaseOrderStatus(invoice.purchaseOrderId, tx);
      }

      return { message: 'Invoice voided successfully' };
    });
  }

  async updateInvoiceStatus(
    userId: string,
    invoiceId: string,
    dto: { status: string },
    tenantId: string,
  ) {
    const [invoice] = await this.drizzle
      .select()
      .from(supplierInvoices)
      .where(
        and(
          eq(supplierInvoices.id, invoiceId),
          eq(supplierInvoices.tenantId, tenantId),
        ),
      );

    if (!invoice) {
      throw new NotFoundException('Supplier invoice not found');
    }

    const validTransitions: Record<string, string[]> = {
      DRAFT: ['CANCELLED'],
      APPROVED: ['PARTIALLY_PAID', 'PAID', 'CANCELLED'],
      PARTIALLY_PAID: ['PAID', 'CANCELLED'],
      PAID: ['CANCELLED'],
    };

    const allowed = validTransitions[invoice.status];
    if (!allowed || !allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status transition from '${invoice.status}' to '${dto.status}'`,
      );
    }

    await this.drizzle
      .update(supplierInvoices)
      .set({ status: dto.status as any, updatedById: userId })
      .where(eq(supplierInvoices.id, invoiceId));

    return { message: `Invoice status updated to ${dto.status}` };
  }

  async findDraft(tenantId: string) {
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
      .where(
        and(
          eq(supplierInvoices.tenantId, tenantId),
          inArray(supplierInvoices.status, ['APPROVED', 'PARTIALLY_PAID', 'PAID'])
        ),
      );
    const groupedData = new Map<string, any>();

    rawData.forEach((row) => {
      if (!groupedData.has(row.invoice.id)) {
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

    return data;
  }

}
