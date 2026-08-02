import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gte, lte, ne, sql, isNull, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import {
  buildReconciliationActTable,
  buildPendingItemsTable,
  buildConsolidatedPositionTable,
  buildAuxiliaryBookTable,
} from './templates/pdf/banking-report.template';

@Injectable()
export class BankingReportsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  // ── 1. Acta de Conciliación Bancaria ──
  async reconciliationAct(reconciliationId: string, tenantId: string) {
    const [recon] = await this.drizzle
      .select()
      .from(schema.bankReconciliations)
      .where(and(eq(schema.bankReconciliations.id, reconciliationId), eq(schema.bankReconciliations.tenantId, tenantId)));

    if (!recon) throw new NotFoundException('Conciliación no encontrada');

    const [bankAccount] = await this.drizzle
      .select()
      .from(schema.bankAccounts)
      .where(and(eq(schema.bankAccounts.id, recon.bankAccountId), eq(schema.bankAccounts.tenantId, tenantId)));

    const statementLines = await this.drizzle
      .select()
      .from(schema.bankStatementLines)
      .where(and(eq(schema.bankStatementLines.bankReconciliationId, reconciliationId), eq(schema.bankStatementLines.tenantId, tenantId)));

    const details = await this.drizzle
      .select()
      .from(schema.bankReconciliationDetails)
      .where(eq(schema.bankReconciliationDetails.bankReconciliationId, reconciliationId));

    const matchedTxns = await this.drizzle
      .select()
      .from(schema.bankTransactions)
      .where(and(eq(schema.bankTransactions.bankReconciliationId, reconciliationId), eq(schema.bankTransactions.tenantId, tenantId)));

    return {
      reconciliation: recon,
      bankAccount,
      statementLines,
      matchedTransactions: matchedTxns,
      totalLines: statementLines.length,
      totalReconciled: matchedTxns.length,
    };
  }

  async reconciliationActExcel(reconciliationId: string, tenantId: string) {
    const data = await this.reconciliationAct(reconciliationId, tenantId);
    const recon: any = data.reconciliation;

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Acta Conciliación');

    ws.columns = [
      { header: 'Concepto', key: 'concept', width: 35 },
      { header: 'Valor', key: 'value', width: 20 },
    ];

    ws.addRow({ concept: 'ACTA DE CONCILIACIÓN BANCARIA', value: '' }).font = { bold: true, size: 14 };
    ws.addRow({ concept: `Cuenta: ${data.bankAccount?.accountName || ''} - ${data.bankAccount?.accountNumber || ''}`, value: '' });
    ws.addRow({ concept: `Fecha Corte: ${recon.statementDate}`, value: '' });
    ws.addRow({ concept: `Estado: ${recon.status}`, value: '' });
    ws.addRow({ concept: '', value: '' });
    ws.addRow({ concept: 'Saldo según Extracto Bancario', value: Number(recon.statementEndingBalance) || 0 });
    ws.addRow({ concept: 'Saldo según Libros (Antes)', value: Number(recon.bookBalanceBefore) || 0 });
    ws.addRow({ concept: 'Saldo según Libros (Después)', value: Number(recon.bookBalanceAfter) || 0 });
    ws.addRow({ concept: 'Diferencia', value: Number(recon.difference) || 0 });
    ws.addRow({ concept: '', value: '' });
    ws.addRow({ concept: 'LÍNEAS DEL EXTRACTO', value: '' }).font = { bold: true };

    const linesWs = workbook.addWorksheet('Líneas Extracto');
    linesWs.columns = [
      { header: 'Fecha', key: 'date', width: 14 },
      { header: 'Descripción', key: 'desc', width: 40 },
      { header: 'Referencia', key: 'ref', width: 20 },
      { header: 'Débito', key: 'debit', width: 16 },
      { header: 'Crédito', key: 'credit', width: 16 },
      { header: 'Estado', key: 'status', width: 14 },
    ];
    for (const l of data.statementLines as any[]) {
      linesWs.addRow({
        date: l.transactionDate,
        desc: l.description,
        ref: l.bankReference || '',
        debit: Number(l.debitAmount) || 0,
        credit: Number(l.creditAmount) || 0,
        status: l.status,
      });
    }

    return workbook;
  }

  // ── 2. Partidas Pendientes de Conciliar ──
  async pendingItems(tenantId: string, bankAccountId?: string, daysOld = 30) {
    const conditions: any[] = [
      eq(schema.bankTransactions.tenantId, tenantId),
      eq(schema.bankTransactions.reconciliationStatus, 'PENDING'),
    ];
    if (bankAccountId) conditions.push(eq(schema.bankTransactions.bankAccountId, bankAccountId));

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const oldTransactions = await this.drizzle
      .select()
      .from(schema.bankTransactions)
      .where(and(...conditions, lte(schema.bankTransactions.transactionDate, cutoff.toISOString().split('T')[0])))
      .orderBy(sql`${schema.bankTransactions.transactionDate} asc`);

    return { items: oldTransactions, count: oldTransactions.length, daysThreshold: daysOld };
  }

  async pendingItemsExcel(tenantId: string, bankAccountId?: string, daysOld = 30) {
    const data = await this.pendingItems(tenantId, bankAccountId, daysOld);
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Partidas Pendientes');

    ws.columns = [
      { header: 'Código', key: 'code', width: 16 },
      { header: 'Fecha', key: 'date', width: 14 },
      { header: 'Descripción', key: 'desc', width: 40 },
      { header: 'Referencia', key: 'ref', width: 20 },
      { header: 'Débito', key: 'debit', width: 16 },
      { header: 'Crédito', key: 'credit', width: 16 },
      { header: 'Días pendiente', key: 'days', width: 16 },
    ];

    for (const t of data.items as any[]) {
      const age = Math.floor((Date.now() - new Date(t.transactionDate).getTime()) / 86400000);
      ws.addRow({
        code: t.internalCode,
        date: t.transactionDate,
        desc: t.description,
        ref: t.bankReference || '',
        debit: Number(t.debitAmount) || 0,
        credit: Number(t.creditAmount) || 0,
        days: age,
      });
    }

    return workbook;
  }

  // ── 3. Posición Consolidada de Bancos ──
  async consolidatedPosition(tenantId: string) {
    const accounts = await this.drizzle
      .select()
      .from(schema.bankAccounts)
      .where(and(eq(schema.bankAccounts.tenantId, tenantId), eq(schema.bankAccounts.isActive, true)));

    const result: any[] = [];
    for (const acc of accounts) {
      const [txnCount] = await this.drizzle
        .select({ count: sql<number>`count(*)` })
        .from(schema.bankTransactions)
        .where(and(eq(schema.bankTransactions.bankAccountId, acc.id), eq(schema.bankTransactions.tenantId, tenantId)));

      const [recCount] = await this.drizzle
        .select({ count: sql<number>`count(*)` })
        .from(schema.bankTransactions)
        .where(and(
          eq(schema.bankTransactions.bankAccountId, acc.id),
          eq(schema.bankTransactions.tenantId, tenantId),
          eq(schema.bankTransactions.reconciliationStatus, 'PENDING'),
        ));

      result.push({
        id: acc.id,
        accountName: acc.accountName,
        accountNumber: acc.accountNumber,
        currencyCode: acc.currencyCode,
        bookBalance: Number(acc.currentBalance) || 0,
        lastStatementBalance: Number(acc.lastStatementBalance) || 0,
        lastStatementDate: acc.lastStatementDate,
        totalTransactions: Number(txnCount?.count || 0),
        pendingReconciliation: Number(recCount?.count || 0),
      });
    }

    return { accounts: result, total: result.length };
  }

  async consolidatedPositionExcel(tenantId: string) {
    const data = await this.consolidatedPosition(tenantId);
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Posición Consolidada');

    ws.columns = [
      { header: 'Cuenta', key: 'name', width: 30 },
      { header: 'Número', key: 'number', width: 22 },
      { header: 'Moneda', key: 'currency', width: 10 },
      { header: 'Saldo Libros', key: 'book', width: 18 },
      { header: 'Último Extracto', key: 'stmt', width: 18 },
      { header: 'Fecha Extracto', key: 'stmtDate', width: 16 },
      { header: 'Total Movs.', key: 'txn', width: 14 },
      { header: 'Pendientes', key: 'pending', width: 12 },
    ];

    for (const a of data.accounts as any[]) {
      ws.addRow({
        name: a.accountName || '',
        number: a.accountNumber,
        currency: a.currencyCode,
        book: a.bookBalance,
        stmt: a.lastStatementBalance,
        stmtDate: a.lastStatementDate || '-',
        txn: a.totalTransactions,
        pending: a.pendingReconciliation,
      });
    }

    return workbook;
  }

  // ── 4. Libro Auxiliar de Bancos ──
  async auxiliaryBook(tenantId: string, bankAccountId: string, dateFrom?: string, dateTo?: string) {
    const conditions: any[] = [
      eq(schema.bankTransactions.tenantId, tenantId),
    ];
    if (bankAccountId) conditions.push(eq(schema.bankTransactions.bankAccountId, bankAccountId));
    if (dateFrom) conditions.push(gte(schema.bankTransactions.transactionDate, dateFrom));
    if (dateTo) conditions.push(lte(schema.bankTransactions.transactionDate, dateTo));

    const transactions = await this.drizzle
      .select()
      .from(schema.bankTransactions)
      .where(and(...conditions))
      .orderBy(sql`${schema.bankTransactions.transactionDate} asc`);

    const [bankAccount] = await this.drizzle
      .select()
      .from(schema.bankAccounts)
      .where(and(eq(schema.bankAccounts.id, bankAccountId), eq(schema.bankAccounts.tenantId, tenantId)));

    return {
      bankAccount: bankAccount || null,
      transactions,
      total: transactions.length,
    };
  }

  async auxiliaryBookExcel(tenantId: string, bankAccountId: string, dateFrom?: string, dateTo?: string) {
    const data = await this.auxiliaryBook(tenantId, bankAccountId, dateFrom, dateTo);
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Auxiliar Bancos');

    ws.columns = [
      { header: 'Código', key: 'code', width: 16 },
      { header: 'Fecha', key: 'date', width: 14 },
      { header: 'Descripción', key: 'desc', width: 45 },
      { header: 'Referencia', key: 'ref', width: 20 },
      { header: 'Débito', key: 'debit', width: 16 },
      { header: 'Crédito', key: 'credit', width: 16 },
      { header: 'Estado Conc.', key: 'recon', width: 14 },
    ];

    for (const t of data.transactions as any[]) {
      ws.addRow({
        code: t.internalCode,
        date: t.transactionDate,
        desc: t.description,
        ref: t.bankReference || '',
        debit: Number(t.debitAmount) || 0,
        credit: Number(t.creditAmount) || 0,
        recon: t.reconciliationStatus,
      });
    }

    return workbook;
  }

  // ── PDF methods ──

  async reconciliationActPdf(id: string, tenantId: string) {
    const data = await this.reconciliationAct(id, tenantId);
    const content = buildReconciliationActTable(data);
    return this.pdfService.generateReport('ACTA DE CONCILIACIÓN BANCARIA', content, { orientation: 'landscape', pageSize: 'LETTER' });
  }

  async pendingItemsPdf(tenantId: string, bankAccountId?: string, daysOld = 30) {
    const data = await this.pendingItems(tenantId, bankAccountId, daysOld);
    const content = buildPendingItemsTable(data);
    return this.pdfService.generateReport('PARTIDAS PENDIENTES DE CONCILIAR', content, { orientation: 'landscape', pageSize: 'LETTER' });
  }

  async consolidatedPositionPdf(tenantId: string) {
    const data = await this.consolidatedPosition(tenantId);
    const content = buildConsolidatedPositionTable(data);
    return this.pdfService.generateReport('POSICIÓN CONSOLIDADA DE BANCOS', content, { orientation: 'landscape', pageSize: 'LETTER' });
  }

  async auxiliaryBookPdf(tenantId: string, bankAccountId: string, dateFrom?: string, dateTo?: string) {
    const data = await this.auxiliaryBook(tenantId, bankAccountId, dateFrom, dateTo);
    const content = buildAuxiliaryBookTable(data);
    return this.pdfService.generateReport('LIBRO AUXILIAR DE BANCOS', content, { orientation: 'landscape', pageSize: 'LETTER' });
  }
}
