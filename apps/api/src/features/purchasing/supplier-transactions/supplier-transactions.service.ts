import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class SupplierTransactionsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async getSupplierTransactionAdvance(tenantId: string) {
    return this.drizzle
      .select({
        id: schema.supplierTransactions.id,
        transactionNumber: schema.supplierTransactions.transactionNumber,
        supplier: {
          id: schema.suppliers.id,
          name: schema.suppliers.name,
        },
        amount: schema.supplierTransactions.amount,
        availableAmount: schema.supplierAdvances.availableAmount,
        status: schema.supplierTransactions.status,
        statusPayment: schema.supplierAdvances.statusPayment,
        isAuthorizePayment: schema.supplierAdvances.isAuthorizePayment,
      })
      .from(schema.supplierTransactions)
      .leftJoin(
        schema.supplierAdvances,
        and(
          eq(
            schema.supplierAdvances.transactionId,
            schema.supplierTransactions.id,
          ),
          eq(schema.supplierAdvances.tenantId, tenantId),
        ),
      )
      .leftJoin(
        schema.suppliers,
        and(
          eq(schema.suppliers.id, schema.supplierTransactions.supplierId),
          eq(schema.suppliers.tenantId, tenantId),
        ),
      )
      .where(
        and(
          eq(schema.supplierTransactions.transactionType, 'ADVANCE'),
          eq(schema.supplierTransactions.tenantId, tenantId),
        ),
      );
  }

  async getSupplierTransactionNoteCredit(tenantId: string) {
    return this.drizzle
      .select({
        id: schema.supplierTransactions.id,
        transactionNumber: schema.supplierTransactions.transactionNumber,
        supplier: {
          id: schema.suppliers.id,
          name: schema.suppliers.name,
        },
        amount: schema.supplierTransactions.amount,
        reason: schema.supplierCreditNotes.reason,
        availableAmount: schema.supplierCreditNotes.availableAmount,
        status: schema.supplierTransactions.status,
        accountsPayable: {
          accountsPayableNumber: schema.accountsPayable.accountsPayableNumber,
        },
      })
      .from(schema.supplierTransactions)
      .leftJoin(
        schema.supplierCreditNotes,
        and(
          eq(
            schema.supplierCreditNotes.transactionId,
            schema.supplierTransactions.id,
          ),
          eq(schema.supplierCreditNotes.tenantId, tenantId),
        ),
      )
      .leftJoin(
        schema.suppliers,
        and(
          eq(schema.suppliers.id, schema.supplierTransactions.supplierId),
          eq(schema.suppliers.tenantId, tenantId),
        ),
      )
      .leftJoin(
        schema.accountsPayable,
        and(
          eq(
            schema.accountsPayable.id,
            schema.supplierCreditNotes.accountsPayableId,
          ),
          eq(schema.accountsPayable.tenantId, tenantId),
        ),
      )
      .where(
        and(
          eq(schema.supplierTransactions.transactionType, 'CREDIT_NOTE'),
          eq(schema.supplierTransactions.tenantId, tenantId),
        ),
      );
  }

  async getSupplierTransactionNoteDebit(tenantId: string) {
    return this.drizzle
      .select({
        id: schema.supplierTransactions.id,
        transactionNumber: schema.supplierTransactions.transactionNumber,
        supplier: {
          id: schema.suppliers.id,
          name: schema.suppliers.name,
        },
        amount: schema.supplierDebitNotes.amount,
        status: schema.supplierTransactions.status,
        reason: schema.supplierDebitNotes.reason,
        accountsPayable: {
          accountsPayableNumber: schema.accountsPayable.accountsPayableNumber,
        },
      })
      .from(schema.supplierTransactions)
      .leftJoin(
        schema.supplierDebitNotes,
        and(
          eq(
            schema.supplierDebitNotes.transactionId,
            schema.supplierTransactions.id,
          ),
          eq(schema.supplierDebitNotes.tenantId, tenantId),
        ),
      )
      .leftJoin(
        schema.suppliers,
        and(
          eq(schema.suppliers.id, schema.supplierTransactions.supplierId),
          eq(schema.suppliers.tenantId, tenantId),
        ),
      )
      .leftJoin(
        schema.accountsPayable,
        and(
          eq(
            schema.accountsPayable.id,
            schema.supplierDebitNotes.accountsPayableId,
          ),
          eq(schema.accountsPayable.tenantId, tenantId),
        ),
      )
      .where(
        and(
          eq(schema.supplierTransactions.transactionType, 'DEBIT_NOTE'),
          eq(schema.supplierTransactions.tenantId, tenantId),
        ),
      );
  }

  async autorizeAdvancePayment(tenantId: string, userId: string, id: string) {
    const [exist] = await this.drizzle
      .select()
      .from(schema.supplierTransactions)
      .where(
        and(
          eq(schema.supplierTransactions.id, id),
          eq(schema.supplierTransactions.tenantId, tenantId),
        ),
      );

    if (!exist) {
      throw new NotFoundException('Supplier Transaction Advance not found');
    }

    const [advanceExist] = await this.drizzle
      .select()
      .from(schema.supplierAdvances)
      .where(
        and(
          eq(schema.supplierAdvances.transactionId, id),
          eq(schema.supplierAdvances.tenantId, tenantId),
        ),
      );

    if (
      advanceExist.isAuthorizePayment === true &&
      advanceExist.statusPayment === 'PAID'
    ) {
      throw new BadRequestException(
        'The advance payment is already authorized for payment',
      );
    }
    await this.drizzle
      .update(schema.supplierAdvances)
      .set({
        isAuthorizePayment: true,
        updatedById: userId,
      })
      .where(
        and(
          eq(schema.supplierAdvances.transactionId, id),
          eq(schema.supplierAdvances.tenantId, tenantId),
        ),
      );

    return { message: 'Authorized successfully' };
  }

  async getAccountStatement(
    dto: { supplierId?: string; startDate: string; endDate: string },
    tenantId: string,
  ) {
    const { supplierId, startDate, endDate } = dto;

    const mkSupplierFilter = (col: any) =>
      supplierId ? [eq(col, supplierId)] : [];

    // ── 1. Facturas ──
    const invoices = this.drizzle
      .select({
        date: sql<string>`${schema.supplierInvoices.invoiceDate}`.as('date'),
        reference: sql<string>`${schema.supplierInvoices.supplierInvoiceNumber}`.as('reference'),
        description: sql<string>`'Factura ' || ${schema.supplierInvoices.invoiceNumber}`.as('description'),
        documentType: sql<string>`'INVOICE'`.as('document_type'),
        debit: sql<string>`${schema.supplierInvoices.totalAmount}`.as('debit'),
        credit: sql<string>`'0.00'`.as('credit'),
        supplierId: sql<string>`${schema.supplierInvoices.supplierId}`.as('supplier_id'),
        supplierName: sql<string>`COALESCE(${schema.suppliers.name}, '')`.as('supplier_name'),
      })
      .from(schema.supplierInvoices)
      .leftJoin(schema.suppliers, eq(schema.supplierInvoices.supplierId, schema.suppliers.id))
      .where(and(
        eq(schema.supplierInvoices.tenantId, tenantId),
        ...mkSupplierFilter(schema.supplierInvoices.supplierId),
        gte(schema.supplierInvoices.invoiceDate, startDate),
        lte(schema.supplierInvoices.invoiceDate, endDate),
      ));

    // ── 2. Pagos ──
    const payments = this.drizzle
      .select({
        date: sql<string>`${schema.supplierTransactions.transactionDate}`.as('date'),
        reference: sql<string>`${schema.supplierTransactions.transactionNumber}`.as('reference'),
        description: sql<string>`'Pago ' || COALESCE(${schema.supplierTransactions.observations}, '')`.as('description'),
        documentType: sql<string>`'PAYMENT'`.as('document_type'),
        debit: sql<string>`'0.00'`.as('debit'),
        credit: sql<string>`${schema.supplierTransactions.amount}`.as('credit'),
        supplierId: sql<string>`${schema.supplierTransactions.supplierId}`.as('supplier_id'),
        supplierName: sql<string>`COALESCE(${schema.suppliers.name}, '')`.as('supplier_name'),
      })
      .from(schema.supplierTransactions)
      .leftJoin(schema.suppliers, eq(schema.supplierTransactions.supplierId, schema.suppliers.id))
      .where(and(
        eq(schema.supplierTransactions.tenantId, tenantId),
        eq(schema.supplierTransactions.transactionType, 'PAYMENT'),
        eq(schema.supplierTransactions.status, 'APPLIED'),
        ...mkSupplierFilter(schema.supplierTransactions.supplierId),
        gte(schema.supplierTransactions.transactionDate, startDate),
        lte(schema.supplierTransactions.transactionDate, endDate),
      ));

    // ── 3. Notas de Crédito ──
    const creditNotes = this.drizzle
      .select({
        date: sql<string>`${schema.supplierTransactions.transactionDate}`.as('date'),
        reference: sql<string>`${schema.supplierCreditNotes.creditNoteNumber}`.as('reference'),
        description: sql<string>`'N.Crédito ' || COALESCE(${schema.supplierCreditNotes.reason}, '')`.as('description'),
        documentType: sql<string>`'CREDIT_NOTE'`.as('document_type'),
        debit: sql<string>`'0.00'`.as('debit'),
        credit: sql<string>`${schema.supplierCreditNotes.amount}`.as('credit'),
        supplierId: sql<string>`${schema.supplierTransactions.supplierId}`.as('supplier_id'),
        supplierName: sql<string>`COALESCE(${schema.suppliers.name}, '')`.as('supplier_name'),
      })
      .from(schema.supplierTransactions)
      .leftJoin(schema.supplierCreditNotes, eq(schema.supplierCreditNotes.transactionId, schema.supplierTransactions.id))
      .leftJoin(schema.suppliers, eq(schema.supplierTransactions.supplierId, schema.suppliers.id))
      .where(and(
        eq(schema.supplierTransactions.tenantId, tenantId),
        eq(schema.supplierTransactions.transactionType, 'CREDIT_NOTE'),
        ...mkSupplierFilter(schema.supplierTransactions.supplierId),
        gte(schema.supplierTransactions.transactionDate, startDate),
        lte(schema.supplierTransactions.transactionDate, endDate),
      ));

    // ── 4. Notas de Débito ──
    const debitNotes = this.drizzle
      .select({
        date: sql<string>`${schema.supplierTransactions.transactionDate}`.as('date'),
        reference: sql<string>`${schema.supplierDebitNotes.debitNoteNumber}`.as('reference'),
        description: sql<string>`'N.Débito ' || COALESCE(${schema.supplierDebitNotes.reason}, '')`.as('description'),
        documentType: sql<string>`'DEBIT_NOTE'`.as('document_type'),
        debit: sql<string>`${schema.supplierDebitNotes.amount}`.as('debit'),
        credit: sql<string>`'0.00'`.as('credit'),
        supplierId: sql<string>`${schema.supplierTransactions.supplierId}`.as('supplier_id'),
        supplierName: sql<string>`COALESCE(${schema.suppliers.name}, '')`.as('supplier_name'),
      })
      .from(schema.supplierTransactions)
      .leftJoin(schema.supplierDebitNotes, eq(schema.supplierDebitNotes.transactionId, schema.supplierTransactions.id))
      .leftJoin(schema.suppliers, eq(schema.supplierTransactions.supplierId, schema.suppliers.id))
      .where(and(
        eq(schema.supplierTransactions.tenantId, tenantId),
        eq(schema.supplierTransactions.transactionType, 'DEBIT_NOTE'),
        ...mkSupplierFilter(schema.supplierTransactions.supplierId),
        gte(schema.supplierTransactions.transactionDate, startDate),
        lte(schema.supplierTransactions.transactionDate, endDate),
      ));

    // ── 5. Anticipos ──
    const advances = this.drizzle
      .select({
        date: sql<string>`${schema.supplierTransactions.transactionDate}`.as('date'),
        reference: sql<string>`${schema.supplierAdvances.supplierAdvanceNumber}`.as('reference'),
        description: sql<string>`'Anticipo ' || COALESCE(${schema.supplierAdvances.supplierAdvanceNumber}, '')`.as('description'),
        documentType: sql<string>`'ADVANCE'`.as('document_type'),
        debit: sql<string>`'0.00'`.as('debit'),
        credit: sql<string>`${schema.supplierTransactions.amount}`.as('credit'),
        supplierId: sql<string>`${schema.supplierTransactions.supplierId}`.as('supplier_id'),
        supplierName: sql<string>`COALESCE(${schema.suppliers.name}, '')`.as('supplier_name'),
      })
      .from(schema.supplierTransactions)
      .leftJoin(schema.supplierAdvances, eq(schema.supplierAdvances.transactionId, schema.supplierTransactions.id))
      .leftJoin(schema.suppliers, eq(schema.supplierTransactions.supplierId, schema.suppliers.id))
      .where(and(
        eq(schema.supplierTransactions.tenantId, tenantId),
        eq(schema.supplierTransactions.transactionType, 'ADVANCE'),
        ...mkSupplierFilter(schema.supplierTransactions.supplierId),
        gte(schema.supplierTransactions.transactionDate, startDate),
        lte(schema.supplierTransactions.transactionDate, endDate),
      ));

    const combined = invoices
      .unionAll(payments)
      .unionAll(creditNotes)
      .unionAll(debitNotes)
      .unionAll(advances);

    const combinedCTE = this.drizzle.$with('combined').as(combined);

    const rows = await this.drizzle
      .with(combinedCTE)
      .select()
      .from(combinedCTE)
      .orderBy(asc(combinedCTE.date));

    let balance = 0;

    const beforeRows = await this.drizzle
      .with(combinedCTE)
      .select({
        totalDebit: sql<number>`COALESCE(SUM(${combinedCTE.debit}), 0)`,
        totalCredit: sql<number>`COALESCE(SUM(${combinedCTE.credit}), 0)`,
      })
      .from(combinedCTE)
      .where(sql`${combinedCTE.date} < ${startDate}`);

    let openingBalance = 0;
    if (beforeRows.length > 0) {
      openingBalance = Number(beforeRows[0].totalDebit || 0) - Number(beforeRows[0].totalCredit || 0);
    }
    balance = openingBalance;

    const items = rows.map((r: any) => {
      const d = Number(r.debit || 0);
      const c = Number(r.credit || 0);
      balance = balance + d - c;
      return {
        date: r.date || '',
        reference: r.reference || '',
        description: r.description || '',
        documentType: r.document_type || '',
        supplierId: r.supplier_id || null,
        supplierName: r.supplier_name || '',
        debit: d,
        credit: c,
        balance,
      };
    });

    // ── KPIs ──
    const kpiBase = [
      eq(schema.accountsPayable.tenantId, tenantId),
      ...(supplierId ? [eq(schema.accountsPayable.supplierId, supplierId)] : []),
    ];

    const [overdue] = await this.drizzle
      .select({ total: sql<number>`COALESCE(SUM(${schema.accountsPayable.remainingAmount}), 0)` })
      .from(schema.accountsPayable)
      .where(and(...kpiBase, sql`${schema.accountsPayable.dueDate} < CURRENT_DATE`, sql`${schema.accountsPayable.status}::text = ANY(ARRAY['APPROVED','PARTIALLY_PAID']::text[])`));

    const [upcoming] = await this.drizzle
      .select({ total: sql<number>`COALESCE(SUM(${schema.accountsPayable.remainingAmount}), 0)` })
      .from(schema.accountsPayable)
      .where(and(...kpiBase, sql`${schema.accountsPayable.dueDate} >= CURRENT_DATE`, sql`${schema.accountsPayable.status}::text = ANY(ARRAY['APPROVED','PARTIALLY_PAID']::text[])`));

    const advanceBase = [
      eq(schema.supplierAdvances.tenantId, tenantId),
      ...(supplierId ? [eq(schema.supplierAdvances.supplierId, supplierId)] : []),
    ];
    const [credits] = await this.drizzle
      .select({ total: sql<number>`COALESCE(SUM(${schema.supplierAdvances.availableAmount}), 0)` })
      .from(schema.supplierAdvances)
      .where(and(...advanceBase));

    const overdueAmount = Number(overdue?.total || 0);
    const upcomingAmount = Number(upcoming?.total || 0);
    const availableCredits = Number(credits?.total || 0);

    return {
      supplierId: supplierId || null,
      supplierName: '',
      startDate,
      endDate,
      openingBalance,
      items,
      closingBalance: balance,
      kpis: {
        totalDebt: overdueAmount + upcomingAmount,
        availableCredits,
        overdueAmount,
        upcomingAmount,
      },
    };
  }

  async getAgingReport(tenantId: string) {
    const rows = await this.drizzle
      .select({
        supplierId: schema.suppliers.id,
        supplierName: schema.suppliers.name,
        totalDue: sql<number>`COALESCE(SUM(${schema.accountsPayable.remainingAmount}), 0)`,
      })
      .from(schema.accountsPayable)
      .leftJoin(schema.suppliers, eq(schema.accountsPayable.supplierId, schema.suppliers.id))
      .where(and(
        eq(schema.accountsPayable.tenantId, tenantId),
        sql`${schema.accountsPayable.status}::text = ANY(ARRAY['APPROVED','PARTIALLY_PAID']::text[])`,
      ))
      .groupBy(schema.suppliers.id, schema.suppliers.name);

    const agingRows = await this.drizzle
      .select({
        supplierId: schema.suppliers.id,
        bucket0: sql<number>`COALESCE(SUM(CASE WHEN ${schema.accountsPayable.dueDate} >= CURRENT_DATE THEN ${schema.accountsPayable.remainingAmount} ELSE 0 END), 0)`,
        bucket1to30: sql<number>`COALESCE(SUM(CASE WHEN ${schema.accountsPayable.dueDate} < CURRENT_DATE AND ${schema.accountsPayable.dueDate} >= CURRENT_DATE - INTERVAL '30 days' THEN ${schema.accountsPayable.remainingAmount} ELSE 0 END), 0)`,
        bucket31to60: sql<number>`COALESCE(SUM(CASE WHEN ${schema.accountsPayable.dueDate} < CURRENT_DATE - INTERVAL '30 days' AND ${schema.accountsPayable.dueDate} >= CURRENT_DATE - INTERVAL '60 days' THEN ${schema.accountsPayable.remainingAmount} ELSE 0 END), 0)`,
        bucket61to90: sql<number>`COALESCE(SUM(CASE WHEN ${schema.accountsPayable.dueDate} < CURRENT_DATE - INTERVAL '60 days' AND ${schema.accountsPayable.dueDate} >= CURRENT_DATE - INTERVAL '90 days' THEN ${schema.accountsPayable.remainingAmount} ELSE 0 END), 0)`,
        bucket90plus: sql<number>`COALESCE(SUM(CASE WHEN ${schema.accountsPayable.dueDate} < CURRENT_DATE - INTERVAL '90 days' THEN ${schema.accountsPayable.remainingAmount} ELSE 0 END), 0)`,
      })
      .from(schema.accountsPayable)
      .leftJoin(schema.suppliers, eq(schema.accountsPayable.supplierId, schema.suppliers.id))
      .where(and(
        eq(schema.accountsPayable.tenantId, tenantId),
        sql`${schema.accountsPayable.status}::text = ANY(ARRAY['APPROVED','PARTIALLY_PAID']::text[])`,
      ))
      .groupBy(schema.suppliers.id);

    const agingMap = new Map<string, any>();
    for (const r of agingRows) {
      agingMap.set(r.supplierId as string, {
        bucket0: Number(r.bucket0),
        bucket1to30: Number(r.bucket1to30),
        bucket31to60: Number(r.bucket31to60),
        bucket61to90: Number(r.bucket61to90),
        bucket90plus: Number(r.bucket90plus),
      });
    }

    return rows.map((r) => ({
      supplierId: r.supplierId,
      supplierName: r.supplierName,
      totalDue: Number(r.totalDue),
      ...(agingMap.get(r.supplierId as string) || { bucket0: 0, bucket1to30: 0, bucket31to60: 0, bucket61to90: 0, bucket90plus: 0 }),
    }));
  }

  async getTaxBookReport(dto: { startDate: string; endDate: string }, tenantId: string) {
    const { startDate, endDate } = dto;
    return this.drizzle
      .select({
        date: schema.supplierInvoices.invoiceDate,
        supplierTaxId: schema.suppliers.taxId,
        supplierName: schema.suppliers.name,
        invoiceNumber: schema.supplierInvoices.invoiceNumber,
        controlNumber: schema.supplierInvoices.controlNumber,
        totalAmount: schema.supplierInvoices.totalAmount,
        taxAmount: schema.supplierInvoices.taxAmount,
        subtotal: schema.supplierInvoices.subtotal,
        currencyCode: schema.supplierInvoices.currencyCode,
        status: schema.supplierInvoices.status,
      })
      .from(schema.supplierInvoices)
      .leftJoin(schema.suppliers, eq(schema.supplierInvoices.supplierId, schema.suppliers.id))
      .where(and(
        eq(schema.supplierInvoices.tenantId, tenantId),
        gte(schema.supplierInvoices.invoiceDate, startDate),
        lte(schema.supplierInvoices.invoiceDate, endDate),
      ))
      .orderBy(asc(schema.supplierInvoices.invoiceDate));
  }

  async getCashFlowReport(dto: { groupBy: 'week' | 'month' }, tenantId: string) {
    const trunc = dto.groupBy === 'week'
      ? sql<string>`DATE_TRUNC('week', ${schema.accountsPayable.dueDate})`
      : sql<string>`DATE_TRUNC('month', ${schema.accountsPayable.dueDate})`;

    return this.drizzle
      .select({
        period: trunc,
        totalAmount: sql<number>`COALESCE(SUM(${schema.accountsPayable.remainingAmount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(schema.accountsPayable)
      .where(and(
        eq(schema.accountsPayable.tenantId, tenantId),
        sql`${schema.accountsPayable.status}::text = ANY(ARRAY['APPROVED','PARTIALLY_PAID']::text[])`,
      ))
      .groupBy(trunc)
      .orderBy(asc(trunc));
  }
}
