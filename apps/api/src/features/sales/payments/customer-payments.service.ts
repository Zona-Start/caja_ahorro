import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  customerPaymentApplications,
  customerPayments,
  customers,
  salesInvoices,
} from '@/database/schema/tables';
import { CashMovementsService } from '@/features/expenses/cash-movements/cash-movements.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  CreateCustomerPaymentInput,
  FilterCustomerPaymentDto,
  FilterReceivableDto,
} from './dto/customer-payments.schema';

const round2 = (value: number): number => Number(value.toFixed(2));

type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';

@Injectable()
export class CustomerPaymentsService {
  private readonly logger = new Logger(CustomerPaymentsService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
    private readonly cashMovementsService: CashMovementsService,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    input: CreateCustomerPaymentInput,
  ) {
    const [invoice] = await this.db
      .select()
      .from(salesInvoices)
      .where(
        and(
          eq(salesInvoices.id, input.invoiceId),
          eq(salesInvoices.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!invoice) {
      throw new NotFoundException('Factura de venta no encontrada');
    }
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('No se puede cobrar una factura anulada');
    }

    const total = Number(invoice.totalAmount);
    const paid = Number(invoice.paidAmount);
    const outstanding = round2(total - paid);

    if (outstanding <= 0) {
      throw new BadRequestException('La factura ya está pagada en su totalidad');
    }
    if (input.amount > outstanding) {
      throw new BadRequestException(
        `El monto excede el saldo pendiente (${outstanding.toFixed(2)})`,
      );
    }

    const paymentNumber = await this.generateCodeService.generateGlobalCode(
      'COB',
      tenantId,
      'sales',
      'payments',
    );
    const paymentDate = input.paymentDate
      ? new Date(input.paymentDate)
      : new Date();
    const newPaid = round2(paid + input.amount);
    const newStatus: InvoiceStatus =
      newPaid >= total ? 'PAID' : newPaid > 0 ? 'PARTIALLY_PAID' : 'ISSUED';

    const payment = await this.db.transaction(async (tx) => {
      const [createdPayment] = await tx
        .insert(customerPayments)
        .values({
          tenantId,
          customerId: input.customerId,
          paymentNumber,
          paymentDate,
          amount: input.amount.toFixed(2),
          currencyId: invoice.currencyId,
          exchangeRate: invoice.exchangeRate,
          amountBase: input.amount.toFixed(4),
          amountForeign: input.amount.toFixed(4),
          paymentMethod: input.paymentMethod,
          referenceNumber: input.referenceNumber ?? null,
          notes: input.notes ?? null,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      await tx.insert(customerPaymentApplications).values({
        paymentId: createdPayment.id,
        invoiceId: invoice.id,
        amountApplied: input.amount.toFixed(2),
      });

      await tx
        .update(salesInvoices)
        .set({
          paidAmount: newPaid.toFixed(2),
          status: newStatus,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(salesInvoices.id, invoice.id));

      return createdPayment;
    });

    if (
      input.paymentMethod === 'CASH' &&
      input.cashRegisterSessionId
    ) {
      try {
        await this.cashMovementsService.create(userId, tenantId, {
          sessionId: input.cashRegisterSessionId,
          type: 'INFLOW',
          amount: input.amount,
          concept: `Cobro venta ${invoice.invoiceNumber}`,
          referenceType: 'SALE',
        });
      } catch (error) {
        this.logger.warn(
          `No se pudo registrar el movimiento de caja para el cobro ${paymentNumber}: ${(error as Error).message}`,
        );
      }
    }

    return {
      message: 'Cobro registrado correctamente',
      data: { payment, invoiceStatus: newStatus, paidAmount: newPaid },
    };
  }

  async findAllByPagination(
    tenantId: string,
    dto: FilterCustomerPaymentDto,
  ) {
    const { page = 1, limit = 10, customerId, startDate, endDate } = dto;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [eq(customerPayments.tenantId, tenantId)];

    if (customerId) {
      conditions.push(eq(customerPayments.customerId, customerId));
    }
    if (startDate) {
      conditions.push(sql`${customerPayments.paymentDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${customerPayments.paymentDate} <= ${endDate}`);
    }

    const whereClause = and(...conditions);

    const [total] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(customerPayments)
      .where(whereClause);

    const data = await this.db
      .select({
        id: customerPayments.id,
        paymentNumber: customerPayments.paymentNumber,
        paymentDate: customerPayments.paymentDate,
        amount: customerPayments.amount,
        paymentMethod: customerPayments.paymentMethod,
        referenceNumber: customerPayments.referenceNumber,
        customerId: customerPayments.customerId,
        customerName: customers.name,
        createdAt: customerPayments.createdAt,
      })
      .from(customerPayments)
      .leftJoin(customers, eq(customerPayments.customerId, customers.id))
      .where(whereClause)
      .orderBy(desc(customerPayments.paymentDate))
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

  async findReceivables(tenantId: string, dto: FilterReceivableDto) {
    const { page = 1, limit = 10, search = '', customerId } = dto;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [
      eq(salesInvoices.tenantId, tenantId),
      sql`${salesInvoices.status} IN ('ISSUED','PARTIALLY_PAID')`,
      sql`${salesInvoices.totalAmount} - ${salesInvoices.paidAmount} > 0`,
    ];

    if (customerId) {
      conditions.push(eq(salesInvoices.customerId, customerId));
    }
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

    const rows = await this.db
      .select({
        id: salesInvoices.id,
        invoiceNumber: salesInvoices.invoiceNumber,
        issueDate: salesInvoices.issueDate,
        dueDate: salesInvoices.dueDate,
        totalAmount: salesInvoices.totalAmount,
        paidAmount: salesInvoices.paidAmount,
        status: salesInvoices.status,
        customerId: salesInvoices.customerId,
        customerName: customers.name,
        customerTaxId: customers.taxId,
      })
      .from(salesInvoices)
      .leftJoin(customers, eq(salesInvoices.customerId, customers.id))
      .where(whereClause)
      .orderBy(salesInvoices.dueDate)
      .limit(limit)
      .offset(offset);

    const data = rows.map((row) => ({
      ...row,
      balance: round2(Number(row.totalAmount) - Number(row.paidAmount)),
    }));

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
}
