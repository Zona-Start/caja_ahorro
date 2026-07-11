import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  accountsPayable,
  purchaseOrderItems,
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
import { CurrencyCodeEnum, priceTypeEnum } from '@/types/enum';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { differenceInDays } from 'date-fns';
import { and, eq, ilike, inArray, ne, or, sql, SQL } from 'drizzle-orm';
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
  ) {}

  async create(userId: string, dto: any, tenantId: string) {
    const isCash = dto.paymentType === 'CASH';

    const supplier = await this.drizzle
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, dto.supplierId));

    if (supplier.length === 0) {
      throw new NotFoundException('Supplier not found');
    }

    const invoiceStatus = isCash ? 'PAID' : (dto.status ?? 'DRAFT');

    if (!isCash && invoiceStatus !== 'DRAFT' && invoiceStatus !== 'PENDING') {
      throw new BadRequestException(
        `Invalid status for creation: ${invoiceStatus}. Only 'DRAFT' or 'PENDING' are allowed.`,
      );
    }

    if (isCash && (!dto.paymentMethod || !dto.bankAccountId)) {
      throw new BadRequestException(
        'Payment method and bank account are required for cash invoices.',
      );
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
          status: invoiceStatus,
          observations: dto.observations,
          createdById: userId,
          supplierInvoiceNumber: invoiceNumber,
        })
        .returning({
          status: supplierInvoices.status,
          id: supplierInvoices.id,
        });

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

      // ── Flujo CONTADO ──
      if (isCash) {
        // Crear Cuenta por Pagar en 0
        await tx.insert(accountsPayable).values({
          tenantId,
          supplierId: dto.supplierId,
          supplierInvoiceId: invoiceId,
          accountsPayableNumber:
            await this.generateCodeService.generateNextReference(
              'CXP',
              tenantId,
              'purchasing',
              'accounts-payable',
            ),
          originalAmount: dto.totalAmount.toString(),
          paidAmount: dto.totalAmount.toString(),
          remainingAmount: '0.00',
          currencyCode: dto.currencyCode ?? 'VES',
          status: 'PAID',
          dueDate: dto.dueDate
            ? dto.dueDate instanceof Date
              ? dto.dueDate.toISOString()
              : String(dto.dueDate)
            : new Date().toISOString(),
          createdById: userId,
        });

        // Crear transacción de proveedor (PAYMENT)
        const paymentRef = await this.generateCodeService.generateNextReference(
          'PAG-P',
          tenantId,
          'purchasing',
          'payments',
        );

        const [transaction] = await tx
          .insert(supplierTransactions)
          .values({
            tenantId,
            supplierId: dto.supplierId,
            transactionNumber: paymentRef,
            transactionType: 'PAYMENT',
            transactionDate: new Date().toISOString(),
            amount: dto.totalAmount.toString(),
            currencyCode: dto.currencyCode ?? 'VES',
            status: 'APPLIED',
            paymentMethod: dto.paymentMethod,
            bankAccountId: dto.bankAccountId,
            bankReference: dto.bankReference,
            observations: `Pago de contado factura ${dto.invoiceNumber}`,
            createdById: userId,
          })
          .returning({ id: supplierTransactions.id });

        // Crear movimiento bancario
        await tx.insert(schema.bankTransactions).values({
          tenantId,
          bankAccountId: dto.bankAccountId,
          paymentMethod: dto.paymentMethod,
          transactionDate: new Date().toISOString().split('T')[0],
          description: `Pago a proveedor - Factura ${dto.invoiceNumber}`,
          category: 'SUPPLIER_PAYMENT',
          bankReference: dto.bankReference ?? paymentRef,
          debitAmount: dto.totalAmount.toString(),
          creditAmount: '0.00',
          reconciliationStatus: 'PENDING',
          createdById: userId,
        } as any);
      }

      // ── Flujo CRÉDITO ──
      if (!isCash) {
        await this.handlePaymentAndAccountsPayable(
          userId,
          tenantId,
          invoiceId,
          invoiceNumber,
          dto,
          tx,
        );
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
        message: 'Supplier invoice created successfully',
      };
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

      if (
        !currentInvoice ||
        (currentInvoice.status !== 'DRAFT' &&
          currentInvoice.status !== 'PENDING')
      ) {
        throw new BadRequestException(
          `Cannot update invoice. Current status is '${currentInvoice?.status}', only 'DRAFT' and 'PENDING' can be modified.`,
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
          status: dto.status,
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

  async accountFor(userId: string, id: string, dto: any, tenantId: string) {
    return this.drizzle.transaction(async (tx) => {
      const existingInvoice = await tx
        .select()
        .from(supplierInvoices)
        .where(
          and(
            eq(supplierInvoices.id, id),
            eq(supplierInvoices.tenantId, tenantId),
          ),
        )
        .leftJoin(
          supplierInvoiceItems,
          eq(supplierInvoices.id, supplierInvoiceItems.invoiceId),
        );

      if (existingInvoice.length === 0) {
        throw new NotFoundException('Supplier invoice not found');
      }

      const originalStatus = existingInvoice[0].supplier_invoices.status;
      const newStatus = dto.status;

      if (originalStatus === 'PENDING') {
        if (newStatus === 'ACCOUNTED_FOR') {
          return this.accountForInvoice(userId, id, dto, tenantId, tx);
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
    userId: string,
    invoiceId: string,
    dto: any,
    tenantId: string,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const supplier = await tx
      .select()
      .from(suppliers)
      .where(
        and(eq(suppliers.id, dto.supplierId), eq(suppliers.status, 'ACTIVE')),
      );

    if (supplier.length === 0) {
      throw new BadRequestException(
        'Supplier is not active or does not exist.',
      );
    }

    const existingInvoice = await tx
      .select()
      .from(supplierInvoices)
      .where(
        and(
          eq(supplierInvoices.invoiceNumber, dto.invoiceNumber),
          eq(supplierInvoices.supplierId, dto.supplierId),
          ne(supplierInvoices.id, invoiceId),
        ),
      );

    if (existingInvoice.length !== 0) {
      throw new ConflictException(
        'An invoice with this number and supplier already exists.',
      );
    }

    if (dto.totalAmount <= 0) {
      throw new BadRequestException('Total amount must be greater than 0.');
    }

    if (dto.purchaseOrderId) {
      await this.updatePurchaseOrderStatus(dto.purchaseOrderId, invoiceId, tx);
    }

    if (dto.purchaseOrderId) {
      await this.checkAndClosePurchaseOrder(dto.purchaseOrderId, tx);
    }

    const invoiceItems = await tx
      .select()
      .from(supplierInvoiceItems)
      .where(eq(supplierInvoiceItems.invoiceId, invoiceId));

    for (const item of invoiceItems) {
      const quantity = Number(item.quantity);
      const unitCost = Number(item.unitCost);

      if (item.lineType === 'SALES_INVENTORY') {
        const resultProduct = await this.productPricesService.create(
          {
            productId: item?.itemId ?? 0,
            suppliersId: dto.supplierId,
            priceType: 'SELLING' as priceTypeEnum,
            baseCost: unitCost,
            otherCosts: 0,
            isActive: true,
            supplierInvoiceId: invoiceId,
          } as any,
          userId,
          tx as any,
        );

        await (this.inventoryMovementsService as any).create(
          userId,
          {
            movementType: 'IN',
            description: `INGRESO PRODUCTO POR FACTURA DE PROVEEDOR ${dto.invoiceNumber}`,
            documentType: 'COMPRA',
            documentNumber: dto.invoiceNumber,
            supplierInvoiceId: invoiceId,
            items: [
              {
                itemId: item.itemId ?? 0,
                itemType: 'PRODUCT',
                quantity: quantity,
                unitCost: Number(resultProduct.data.totalCost),
              },
            ],
          } as any,
          tx as any,
        );
      } else if (item.lineType === 'FIXED_ASSET') {
        const resultFixedAsset = await (
          this.fixedAssetPricesService as any
        ).create(
          userId,
          {
            fixedAssetsId: item.itemId ?? 0,
            baseCost: unitCost,
            otherCosts: 0,
            purchaseTax: 0,
            startDate: dto.invoiceDate,
            supplierInvoiceId: invoiceId,
            isActive: true,
          } as any,
          tx as any,
        );

        await (this.inventoryMovementsService as any).create(
          userId,
          {
            movementType: 'IN',
            description: `INGRESO ACTIVO POR FACTURA PROVEEDOR ${dto.invoiceNumber}`,
            documentType: 'COMPRA',
            documentNumber: dto.invoiceNumber,
            supplierInvoiceId: invoiceId,
            items: [
              {
                itemId: item.itemId ?? 0,
                itemType: 'FIXED_ASSET',
                quantity: quantity,
                unitCost: Number(resultFixedAsset.data.totalCost),
              },
            ],
          } as any,
          tx as any,
        );
      } else if (item.lineType === 'SERVICE') {
        await (this.servicePricesService as any).create(
          userId,
          {
            serviceId: item.itemId ?? 0,
            baseCost: unitCost,
            otherCosts: 0,
            purchaseTax: 0,
            startDate: dto.invoiceDate,
            isActive: true,
            supplierInvoiceId: invoiceId,
          } as any,
          tx as any,
        );
      }
    }

    const finalStatus = 'ACCOUNTED_FOR';

    await tx
      .update(supplierInvoices)
      .set({ status: finalStatus, updatedById: userId })
      .where(eq(supplierInvoices.id, invoiceId));

    const finalInvoice = await tx
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
        supplierInvoiceNumber: supplierInvoices.supplierInvoiceNumber,
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

    await this.handlePaymentAndAccountsPayable(
      userId,
      tenantId,
      invoiceId,
      finalInvoice[0].supplierInvoiceNumber,
      dto,
      tx,
    );

    try {
      await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'purchasing',
          submodule: 'supplier-invoices',
          category: 'PURCHASING',
          operationType: 'INVOICE_ACCOUNTED',
          description: `Factura de compra ${dto.invoiceNumber} - ${supplier[0].name}`,
          entryDate: new Date(
            dto.invoiceDate instanceof Date
              ? dto.invoiceDate
              : new Date(dto.invoiceDate),
          ),
          currencyCode: CurrencyCodeEnum.VES,
          originReferenceId: invoiceId,
          originType: 'SUPPLIER_INVOICE',
          items: [
            {
              supplierId: dto.supplierId,
              amounts: {
                SUBTOTAL: Number(dto.subtotal),
                TAX: Number(dto.taxAmount || 0),
                TOTAL_AMOUNT: Number(dto.totalAmount),
              },
              description: `Factura ${dto.invoiceNumber}`,
            },
          ],
        },
        tx,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        error.message.includes('No existe una regla contable')
      ) {
        // Silently skip if no accounting rules configured
      } else {
        throw error;
      }
    }

    return { ...finalInvoice[0], items };
  }

  private async updatePurchaseOrderStatus(
    purchaseOrderId: string,
    invoiceId: string,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const poItems = await tx
      .select({
        id: purchaseOrderItems.id,
        itemId: purchaseOrderItems.itemId,
        quantity: purchaseOrderItems.quantity,
        lineType: purchaseOrderItems.lineType,
        description: purchaseOrderItems.description,
      })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));

    if (poItems.length === 0) {
      throw new NotFoundException('Purchase Order not found or has no items.');
    }

    const invoicedItems = await tx
      .select({
        id: supplierInvoiceItems.id,
        itemId: supplierInvoiceItems.itemId,
        quantity: supplierInvoiceItems.quantity,
        lineType: supplierInvoiceItems.lineType,
        description: supplierInvoiceItems.description,
      })
      .from(supplierInvoiceItems)
      .leftJoin(
        supplierInvoices,
        eq(supplierInvoiceItems.invoiceId, supplierInvoices.id),
      )
      .where(
        and(
          eq(supplierInvoices.purchaseOrderId, purchaseOrderId),
          ne(supplierInvoices.status, 'CANCELLED'),
          ne(supplierInvoices.id, invoiceId),
        ),
      );

    const currentInvoiceItems = await tx
      .select({
        id: supplierInvoiceItems.id,
        itemId: supplierInvoiceItems.itemId,
        quantity: supplierInvoiceItems.quantity,
        lineType: supplierInvoiceItems.lineType,
        description: supplierInvoiceItems.description,
      })
      .from(supplierInvoiceItems)
      .where(eq(supplierInvoiceItems.invoiceId, invoiceId));

    const totalInvoicedPerItem = new Map<string, number>();

    const getUniqueKey = (item: {
      itemId: string | null;
      lineType: string;
      description: string | null;
    }): string => {
      if (item.lineType === 'EXPENSE') {
        if (!item.description) {
          throw new BadRequestException(
            'Expense item is missing a description.',
          );
        }
        return `${item.lineType}-${item.description.trim()}`;
      }

      if (item.itemId === null || item.itemId === undefined) {
        throw new BadRequestException(
          `Item with lineType '${item.lineType}' is missing a valid itemId.`,
        );
      }

      return `${item.lineType}-${item.itemId}`;
    };

    for (const item of invoicedItems) {
      const key = getUniqueKey(item);
      const currentQty = totalInvoicedPerItem.get(key) || 0;
      totalInvoicedPerItem.set(key, currentQty + item.quantity);
    }

    for (const item of currentInvoiceItems) {
      const key = getUniqueKey(item);
      const currentQty = totalInvoicedPerItem.get(key) || 0;
      totalInvoicedPerItem.set(key, currentQty + item.quantity);
    }

    let isFullyInvoiced = true;
    for (const poItem of poItems) {
      const key = getUniqueKey({
        itemId: poItem.itemId,
        lineType: poItem.lineType,
        description: poItem.description,
      });

      const invoicedQty = totalInvoicedPerItem.get(key) || 0;

      if (invoicedQty > poItem.quantity) {
        throw new BadRequestException(`Item is being over-invoiced.`);
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

  private async applyCreditNote(
    cxpId: string,
    amountToApply: number,
    userId: string,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const [creditNoteCxp] = await tx
      .select()
      .from(accountsPayable)
      .where(eq(accountsPayable.id, cxpId));

    if (!creditNoteCxp) {
      throw new NotFoundException(
        `Credit note with CXP ID ${cxpId} not found.`,
      );
    }

    if (Number(creditNoteCxp.remainingAmount) >= 0) {
      throw new BadRequestException(
        `CXP ID ${cxpId} is not a valid, open credit note.`,
      );
    }

    const availableCredit = Math.abs(Number(creditNoteCxp.remainingAmount));

    if (amountToApply > availableCredit) {
      throw new BadRequestException(
        `Amount to apply (${amountToApply}) exceeds the available credit (${availableCredit}) for CXP ID ${cxpId}.`,
      );
    }

    const newRemainingAmount =
      Number(creditNoteCxp.remainingAmount) + amountToApply;
    const newPaidAmount = creditNoteCxp.paidAmount;
    const newStatus = newRemainingAmount >= 0 ? 'PAID' : 'PENDING';

    await tx
      .update(accountsPayable)
      .set({
        remainingAmount: newRemainingAmount.toString(),
        paidAmount: newPaidAmount.toString(),
        status: newStatus,
        updatedById: userId,
      })
      .where(eq(accountsPayable.id, cxpId));
  }

  private isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    const date = new Date(dueDate);
    const now = new Date();
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return differenceInDays(date, now) < 0;
  }

  private async handlePaymentAndAccountsPayable(
    userId: string,
    tenantId: string,
    invoiceId: string,
    invoiceReference: string,
    dto: any,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const remainingAmount = dto.totalAmount;
    const paidAmount = 0;

    const invoiceAP = await this.accountsPayableService.create(
      userId,
      {
        tenantId,
        supplierId: dto.supplierId,
        supplierInvoiceId: invoiceId,
        originalAmount: remainingAmount,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        currencyCode: 'VES',
        status: remainingAmount <= 0 ? 'PAID' : 'PENDING',
        dueDate: dto.dueDate || new Date(),
        priority: this.isOverdue(
          dto.dueDate
            ? dto.dueDate instanceof Date
              ? dto.dueDate.toISOString()
              : String(dto.dueDate)
            : null,
        )
          ? 'HIGH'
          : 'NORMAL',
        observations: `CUENTA POR PAGAR POR FACTURA N° ${invoiceReference}`,
      },
      tx,
    );

    return invoiceAP;
  }

  private async checkAndClosePurchaseOrder(
    purchaseOrderId: string,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const po = await tx.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, purchaseOrderId),
    });

    if (po?.status !== 'INVOICED') {
      return;
    }

    const relatedInvoices = await tx
      .select()
      .from(supplierInvoices)
      .where(eq(supplierInvoices.purchaseOrderId, purchaseOrderId));

    const allPaid = relatedInvoices.every(
      (invoice) => invoice.status === 'PAID',
    );

    if (allPaid) {
      await tx
        .update(purchaseOrders)
        .set({ status: 'CLOSED' })
        .where(eq(purchaseOrders.id, purchaseOrderId));
    }
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
      if (invoice.status === 'CANCELLED' || invoice.status === 'PAID') {
        throw new BadRequestException(
          'Cannot cancel an invoice that has been accounted for.',
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

      if (invoice.purchaseOrderId) {
        await this.drizzle
          .update(purchaseOrders)
          .set({ status: 'PENDING' })
          .where(eq(purchaseOrders.id, invoice.purchaseOrderId));
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
          observations:
            dto.observations ??
            `Nota de crédito ${dto.creditNoteNumber}: ${dto.reason}`,
          createdById: userId,
        })
        .returning();

      await tx.insert(supplierCreditNotes).values({
        tenantId,
        transactionId: newTransaction.id,
        supplierId: dto.supplierId,
        accountsPayableId: dto.accountsPayableId || null,
        creditNoteNumber: dto.creditNoteNumber,
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
          observations:
            dto.observations ??
            `Nota de débito ${dto.debitNoteNumber}: ${dto.reason}`,
          createdById: userId,
        })
        .returning();

      await tx.insert(supplierDebitNotes).values({
        tenantId,
        transactionId: newTransaction.id,
        supplierId: dto.supplierId,
        accountsPayableId: dto.accountsPayableId || null,
        debitNoteNumber: dto.debitNoteNumber,
        reason: dto.reason,
        amount: dto.amount.toString(),
        createdById: userId,
      });

      if (dto.accountsPayableId) {
        await tx.insert(supplierTransactionApplications).values({
          tenantId,
          transactionId: newTransaction.id,
          accountsPayableId: dto.accountsPayableId,
          appliedAmount: dto.amount.toString(),
          applicationDate: new Date().toISOString(),
          createdById: userId,
        });

        const [cxp] = await tx
          .select()
          .from(accountsPayable)
          .where(eq(accountsPayable.id, dto.accountsPayableId));

        if (cxp) {
          const newRemaining =
            Number(cxp.remainingAmount) + Number(dto.amount);
          const newPaid =
            Number(cxp.paidAmount) - Number(dto.amount);

          await tx
            .update(accountsPayable)
            .set({
              remainingAmount: newRemaining.toString(),
              paidAmount: Math.max(newPaid, 0).toString(),
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

      if (invoice.status !== 'ACCOUNTED_FOR') {
        throw new BadRequestException(
          `Cannot void invoice with status '${invoice.status}'. Only ACCOUNTED_FOR invoices can be voided.`,
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
        await this.updatePurchaseOrderStatusOnCancel(
          invoice.purchaseOrderId,
          invoiceId,
          tx,
        );
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
      DRAFT: ['PENDING', 'CANCELLED'],
      PENDING: ['ACCOUNTED_FOR', 'CANCELLED'],
      ACCOUNTED_FOR: ['PAID', 'CANCELLED'],
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

  async findDraftPending(tenantId: string) {
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
          or(
            eq(supplierInvoices.status, 'DRAFT'),
            eq(supplierInvoices.status, 'PENDING'),
          ),
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

  async updateStatusToPaid(id: string, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.drizzle;
    const supplierInvoice = await db
      .select()
      .from(supplierInvoices)
      .where(eq(supplierInvoices.id, id));

    if (supplierInvoice.length === 0) {
      throw new NotFoundException(`Supplier Invoice with ID ${id} not found`);
    }

    if (supplierInvoice[0].status !== 'ACCOUNTED_FOR') {
      throw new BadRequestException(
        `Supplier Invoice ${id} cannot be paid from its current status: ${supplierInvoice[0].status}`,
      );
    }

    const [updatedSupplierinvoice] = await db
      .update(supplierInvoices)
      .set({ status: 'PAID' })
      .where(eq(supplierInvoices.id, id))
      .returning();
    if (supplierInvoice[0].purchaseOrderId) {
      await this.checkAndClosePurchaseOrder(
        supplierInvoice[0].purchaseOrderId,
        db,
      );
    }

    return updatedSupplierinvoice;
  }

  async updatePurchaseOrderStatusOnCancel(
    purchaseOrderId: string,
    cancelledInvoiceId: string,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const poItems = await tx
      .select({
        id: purchaseOrderItems.id,
        itemId: purchaseOrderItems.itemId,
        quantity: purchaseOrderItems.quantity,
        lineType: purchaseOrderItems.lineType,
        description: purchaseOrderItems.description,
      })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));

    if (poItems.length === 0) {
      return;
    }

    const otherInvoices = await tx
      .select({
        id: supplierInvoices.id,
        status: supplierInvoices.status,
      })
      .from(supplierInvoices)
      .where(
        and(
          eq(supplierInvoices.purchaseOrderId, purchaseOrderId),
          ne(supplierInvoices.id, cancelledInvoiceId),
          ne(supplierInvoices.status, 'CANCELLED'),
        ),
      );

    const otherInvoiceIds = otherInvoices.map((inv) => inv.id);

    const totalInvoicedPerItem = new Map<string, number>();

    const getUniqueKey = (item: {
      itemId: string | null;
      lineType: string;
      description: string | null;
    }): string => {
      if (item.lineType === 'EXPENSE') {
        if (!item.description) {
          throw new BadRequestException(
            'Expense item is missing a description.',
          );
        }
        return `${item.lineType}-${item.description.trim()}`;
      }

      if (item.itemId === null || item.itemId === undefined) {
        throw new BadRequestException(
          `Item with lineType '${item.lineType}' is missing a valid itemId.`,
        );
      }

      return `${item.lineType}-${item.itemId}`;
    };

    if (otherInvoiceIds.length > 0) {
      const itemsFromOtherInvoices = await tx
        .select({
          itemId: supplierInvoiceItems.itemId,
          quantity: supplierInvoiceItems.quantity,
          lineType: supplierInvoiceItems.lineType,
          description: supplierInvoiceItems.description,
        })
        .from(supplierInvoiceItems)
        .where(inArray(supplierInvoiceItems.invoiceId, otherInvoiceIds));

      for (const item of itemsFromOtherInvoices) {
        const key = getUniqueKey(item);
        const currentQty = totalInvoicedPerItem.get(key) || 0;
        totalInvoicedPerItem.set(key, currentQty + item.quantity);
      }
    }

    let isFullyCoveredByOtherInvoices = true;
    for (const poItem of poItems) {
      const key = getUniqueKey({
        itemId: poItem.itemId,
        lineType: poItem.lineType,
        description: poItem.description,
      });

      const invoicedQty = totalInvoicedPerItem.get(key) || 0;

      if (invoicedQty < poItem.quantity) {
        isFullyCoveredByOtherInvoices = false;
        break;
      }
    }

    const newPoStatus = isFullyCoveredByOtherInvoices ? 'RECEIVED' : 'PENDING';

    await tx
      .update(purchaseOrders)
      .set({ status: newPoStatus })
      .where(eq(purchaseOrders.id, purchaseOrderId));
  }
}
