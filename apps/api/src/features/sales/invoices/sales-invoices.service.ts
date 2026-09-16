import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  currencies,
  customers,
  products,
  salesInvoiceItems,
  salesInvoices,
} from '@/database/schema/tables';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { InventoryMovementsService } from '@/features/inventory/inventory-movements/inventory-movements.service';
import type { CreateInventoryMovementDto } from '@/features/inventory/inventory-movements/dto/inventory-movements.schema';
import { CurrencyCodeEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DeliveryNotesService } from '../delivery-notes/delivery-notes.service';
import { CustomerPaymentsService } from '../payments/customer-payments.service';
import {
  CreateSaleDto,
  FilterSaleDto,
} from './dto/sales-invoices.schema';

const round2 = (value: number): number => Number(value.toFixed(2));

@Injectable()
export class SalesInvoicesService {
  private readonly logger = new Logger(SalesInvoicesService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
    private readonly inventoryMovementsService: InventoryMovementsService,
    private readonly customerPaymentsService: CustomerPaymentsService,
    private readonly deliveryNotesService: DeliveryNotesService,
    private readonly accountingEntriesService: AccountingEntriesService,
  ) {}

  private async resolveBaseCurrency() {
    const [base] = await this.db
      .select()
      .from(currencies)
      .where(eq(currencies.isBase, true))
      .limit(1);
    if (base) return base;

    const [ves] = await this.db
      .select()
      .from(currencies)
      .where(eq(currencies.code, 'VES'))
      .limit(1);
    if (ves) return ves;

    throw new BadRequestException(
      'No hay una moneda base configurada en el sistema',
    );
  }

  async create(tenantId: string, userId: string, dto: CreateSaleDto) {
    const [customer] = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(eq(customers.id, dto.customerId), eq(customers.tenantId, tenantId)),
      )
      .limit(1);

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const currency = await this.resolveBaseCurrency();
    const issueDate = dto.issueDate ? new Date(dto.issueDate) : new Date();
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : issueDate;
    const isCredit = dto.saleType === 'CREDIT';

    let subtotal = 0;
    let taxAmount = 0;
    let totalAmount = 0;

    const lines = dto.items.map((item) => {
      const taxRate = item.taxRate ?? 0;
      const lineGross = round2(item.unitPrice * item.quantity);
      const lineNet = round2(lineGross / (1 + taxRate / 100));
      const lineTax = round2(lineGross - lineNet);
      subtotal += lineNet;
      taxAmount += lineTax;
      totalAmount += lineGross;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost ?? 0,
        taxRate,
        lineGross,
      };
    });

    subtotal = round2(subtotal);
    taxAmount = round2(taxAmount);
    totalAmount = round2(totalAmount);

    const invoiceNumber = await this.generateCodeService.generateGlobalCode(
      'FAC',
      tenantId,
      'sales',
      'invoices',
    );

    const invoice = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(salesInvoices)
        .values({
          tenantId,
          customerId: dto.customerId,
          invoiceNumber,
          status: 'ISSUED',
          issueDate,
          dueDate,
          currencyId: currency.id,
          exchangeRate: '1.000000',
          subtotal: subtotal.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          amountBase: totalAmount.toFixed(4),
          amountForeign: totalAmount.toFixed(4),
          paidAmount: '0.00',
          notes: dto.notes ?? null,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      await tx.insert(salesInvoiceItems).values(
        lines.map((line) => ({
          invoiceId: created.id,
          productId: line.productId,
          quantity: String(line.quantity),
          unitPrice: line.unitPrice.toFixed(2),
          unitCost: line.unitCost.toFixed(2),
          taxRate: line.taxRate.toFixed(2),
          totalPrice: line.lineGross.toFixed(2),
        })),
      );

      return created;
    });

    // Optional delivery note.
    if (dto.createDeliveryNote) {
      try {
        await this.deliveryNotesService.createFromInvoice(
          invoice.id,
          tenantId,
          userId,
        );
      } catch (error) {
        this.logger.warn(
          `No se pudo generar la nota de entrega para ${invoiceNumber}: ${(error as Error).message}`,
        );
      }
    }

    // Stock outflow (best effort: never blocks the sale).
    const movementItems = lines
      .filter((line) => Math.round(line.quantity) >= 1)
      .map((line) => ({
        productId: line.productId,
        quantity: Math.round(line.quantity),
        unitCost: line.unitCost,
      }));

    if (movementItems.length > 0) {
      try {
        const movementDto: CreateInventoryMovementDto = {
          movementType: 'STOCK_DELIVERY',
          movementDate: issueDate.toISOString(),
          description: `Venta ${invoiceNumber}`,
          items: movementItems,
        };
        await this.inventoryMovementsService.create(
          movementDto,
          tenantId,
          userId,
        );
      } catch (error) {
        this.logger.warn(
          `No se pudo descontar el stock de la venta ${invoiceNumber}: ${(error as Error).message}`,
        );
      }
    }

    // Cash sale: register payment (and cash movement when paid in cash).
    if (!isCredit) {
      try {
        await this.customerPaymentsService.create(tenantId, userId, {
          customerId: dto.customerId,
          invoiceId: invoice.id,
          amount: totalAmount,
          paymentMethod: dto.paymentMethod ?? 'CASH',
          cashRegisterSessionId: dto.cashRegisterSessionId,
          referenceNumber: dto.paymentReference,
          paymentDate: issueDate.toISOString(),
          notes: `Pago de venta ${invoiceNumber}`,
        });
      } catch (error) {
        this.logger.warn(
          `No se pudo registrar el cobro de la venta ${invoiceNumber}: ${(error as Error).message}`,
        );
      }
    }

    // Accounting delegation (best effort, governed by tenant rules/gates).
    try {
      await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'sales',
          submodule: 'invoices',
          category: 'INVENTORY',
          operationType: 'SALE_OUTPUT',
          description: `Venta ${invoiceNumber}`,
          entryDate: issueDate,
          currencyCode: currency.code as CurrencyCodeEnum,
          exchangeRate: 1,
          originReferenceId: invoice.id,
          originType: 'SALE',
          autoPostKey: 'AUTO_POST_ENTRY_SALES',
          globalDescriptions: { SALE_REFERENCE: invoiceNumber },
          roleAliases: { SALE_REFERENCE: 'TOTAL' },
          items: [
            {
              amounts: {
                SALE_AMOUNT: subtotal,
                SALE_TAX: taxAmount,
                TOTAL_AMOUNT: totalAmount,
              },
            },
          ],
        },
      );
    } catch (error) {
      this.logger.warn(
        `Asiento contable omitido para la venta ${invoiceNumber}: ${(error as Error).message}`,
      );
    }

    return this.findOne(invoice.id, tenantId);
  }

  async findAllByPagination(tenantId: string, dto: FilterSaleDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      customerId,
      startDate,
      endDate,
    } = dto;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [eq(salesInvoices.tenantId, tenantId)];

    if (status) conditions.push(eq(salesInvoices.status, status));
    if (customerId) conditions.push(eq(salesInvoices.customerId, customerId));
    if (startDate)
      conditions.push(sql`${salesInvoices.issueDate} >= ${startDate}`);
    if (endDate) conditions.push(sql`${salesInvoices.issueDate} <= ${endDate}`);
    if (search) {
      conditions.push(
        sql`(${ilike(salesInvoices.invoiceNumber, `%${search}%`)} OR ${ilike(customers.name, `%${search}%`)})`,
      );
    }

    const whereClause = and(...conditions);

    const [total] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(salesInvoices)
      .leftJoin(customers, eq(salesInvoices.customerId, customers.id))
      .where(whereClause);

    const data = await this.db
      .select({
        id: salesInvoices.id,
        invoiceNumber: salesInvoices.invoiceNumber,
        status: salesInvoices.status,
        issueDate: salesInvoices.issueDate,
        dueDate: salesInvoices.dueDate,
        subtotal: salesInvoices.subtotal,
        taxAmount: salesInvoices.taxAmount,
        totalAmount: salesInvoices.totalAmount,
        paidAmount: salesInvoices.paidAmount,
        customerId: salesInvoices.customerId,
        customerName: customers.name,
        createdAt: salesInvoices.createdAt,
      })
      .from(salesInvoices)
      .leftJoin(customers, eq(salesInvoices.customerId, customers.id))
      .where(whereClause)
      .orderBy(desc(salesInvoices.createdAt))
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

  async findOne(id: string, tenantId: string) {
    const [invoice] = await this.db
      .select({
        id: salesInvoices.id,
        tenantId: salesInvoices.tenantId,
        invoiceNumber: salesInvoices.invoiceNumber,
        status: salesInvoices.status,
        issueDate: salesInvoices.issueDate,
        dueDate: salesInvoices.dueDate,
        subtotal: salesInvoices.subtotal,
        taxAmount: salesInvoices.taxAmount,
        totalAmount: salesInvoices.totalAmount,
        paidAmount: salesInvoices.paidAmount,
        notes: salesInvoices.notes,
        deliveryNoteId: salesInvoices.deliveryNoteId,
        customerId: salesInvoices.customerId,
        customerName: customers.name,
        customerTaxId: customers.taxId,
        customerPhone: customers.phone,
        customerAddress: customers.address,
        createdAt: salesInvoices.createdAt,
      })
      .from(salesInvoices)
      .leftJoin(customers, eq(salesInvoices.customerId, customers.id))
      .where(
        and(
          eq(salesInvoices.id, id),
          eq(salesInvoices.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!invoice) {
      throw new NotFoundException('Factura de venta no encontrada');
    }

    const items = await this.db
      .select({
        id: salesInvoiceItems.id,
        productId: salesInvoiceItems.productId,
        productName: products.name,
        quantity: salesInvoiceItems.quantity,
        unitPrice: salesInvoiceItems.unitPrice,
        unitCost: salesInvoiceItems.unitCost,
        taxRate: salesInvoiceItems.taxRate,
        totalPrice: salesInvoiceItems.totalPrice,
      })
      .from(salesInvoiceItems)
      .leftJoin(products, eq(salesInvoiceItems.productId, products.id))
      .where(eq(salesInvoiceItems.invoiceId, id));

    return {
      ...invoice,
      balance: round2(
        Number(invoice.totalAmount) - Number(invoice.paidAmount),
      ),
      items: items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        unitCost: Number(item.unitCost),
        taxRate: Number(item.taxRate),
        totalPrice: Number(item.totalPrice),
      })),
    };
  }

  async cancel(id: string, tenantId: string, userId: string) {
    const [invoice] = await this.db
      .select()
      .from(salesInvoices)
      .where(
        and(eq(salesInvoices.id, id), eq(salesInvoices.tenantId, tenantId)),
      )
      .limit(1);

    if (!invoice) {
      throw new NotFoundException('Factura de venta no encontrada');
    }
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('La factura ya está anulada');
    }

    const [updated] = await this.db
      .update(salesInvoices)
      .set({
        status: 'CANCELLED',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(salesInvoices.id, id))
      .returning();

    return { message: 'Factura anulada correctamente', data: updated };
  }

  async generateDeliveryNote(invoiceId: string, tenantId: string, userId: string) {
    const note = await this.deliveryNotesService.createFromInvoice(
      invoiceId,
      tenantId,
      userId,
    );
    return {
      message: 'Nota de entrega generada correctamente',
      data: note,
    };
  }
}
