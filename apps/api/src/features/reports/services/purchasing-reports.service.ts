import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { buildAgingTableContent } from '../templates/pdf/aging.template';
import { buildTaxBookTableContent } from '../templates/pdf/tax-book.template';
import { buildCashFlowTableContent } from '../templates/pdf/cash-flow.template';

@Injectable()
export class PurchasingReportsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async generateAgingPdf(tenantId: string) {
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
        bucket0: Number(r.bucket0), bucket1to30: Number(r.bucket1to30),
        bucket31to60: Number(r.bucket31to60), bucket61to90: Number(r.bucket61to90),
        bucket90plus: Number(r.bucket90plus),
      });
    }

    const data = rows.map((r) => ({
      supplierName: r.supplierName || '',
      totalDue: Number(r.totalDue),
      ...(agingMap.get(r.supplierId as string) || { bucket0: 0, bucket1to30: 0, bucket31to60: 0, bucket61to90: 0, bucket90plus: 0 }),
    }));

    const content = buildAgingTableContent(data);
    return this.pdfService.generateReport('ANTIGÜEDAD DE DEUDA', content, { orientation: 'landscape' });
  }

  async generateTaxBookPdf(tenantId: string, startDate: string, endDate: string) {
    const data = await this.drizzle
      .select({
        date: schema.supplierInvoices.invoiceDate,
        supplierTaxId: schema.suppliers.taxId,
        supplierName: schema.suppliers.name,
        invoiceNumber: schema.supplierInvoices.invoiceNumber,
        controlNumber: schema.supplierInvoices.controlNumber,
        subtotal: schema.supplierInvoices.subtotal,
        taxAmount: schema.supplierInvoices.taxAmount,
        totalAmount: schema.supplierInvoices.totalAmount,
      })
      .from(schema.supplierInvoices)
      .leftJoin(schema.suppliers, eq(schema.supplierInvoices.supplierId, schema.suppliers.id))
      .where(and(
        eq(schema.supplierInvoices.tenantId, tenantId),
        gte(schema.supplierInvoices.invoiceDate, startDate),
        lte(schema.supplierInvoices.invoiceDate, endDate),
      ))
      .orderBy(asc(schema.supplierInvoices.invoiceDate));

    const content = buildTaxBookTableContent(data as any);
    return this.pdfService.generateReport('LIBRO DE COMPRAS FISCAL', content, { orientation: 'landscape' });
  }

  async generateCashFlowPdf(tenantId: string, groupBy: 'week' | 'month') {
    const trunc = groupBy === 'week'
      ? sql<string>`DATE_TRUNC('week', ${schema.accountsPayable.dueDate})`
      : sql<string>`DATE_TRUNC('month', ${schema.accountsPayable.dueDate})`;

    const data = await this.drizzle
      .select({ period: trunc, totalAmount: sql<number>`COALESCE(SUM(${schema.accountsPayable.remainingAmount}), 0)`, count: sql<number>`COUNT(*)` })
      .from(schema.accountsPayable)
      .where(and(
        eq(schema.accountsPayable.tenantId, tenantId),
        sql`${schema.accountsPayable.status}::text = ANY(ARRAY['APPROVED','PARTIALLY_PAID']::text[])`,
      ))
      .groupBy(trunc)
      .orderBy(asc(trunc));

    const content = buildCashFlowTableContent(data as any, groupBy);
    return this.pdfService.generateReport('FLUJO DE CAJA SALIENTE', content, { orientation: 'portrait' });
  }
}
