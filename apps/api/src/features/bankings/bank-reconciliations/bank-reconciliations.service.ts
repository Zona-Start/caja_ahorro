import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, eq, isNull, lte, gte, ne, sql, SQL, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import {
  AddStatementLineDto,
  CreateBankReconciliationDto,
  FilterBankReconciliationDto,
  GenerateBookEntryDto,
  ManualMatchDto,
} from './dto/bank-reconciliations.schema';

@Injectable()
export class BankReconciliationsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  private generateInternalCode(): string {
    const prefix = 'MB';
    const ts = Date.now().toString(36).toUpperCase().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${ts}${random}`;
  }

  async create(dto: CreateBankReconciliationDto, userId: string, tenantId: string) {
    return this.drizzle.transaction(async (tx) => {
      const [bankAccount] = await tx
        .select({ id: schema.bankAccounts.id, currentBalance: schema.bankAccounts.currentBalance })
        .from(schema.bankAccounts)
        .where(and(eq(schema.bankAccounts.id, dto.bankAccountId), eq(schema.bankAccounts.tenantId, tenantId)));

      if (!bankAccount) throw new NotFoundException('Cuenta bancaria no encontrada');

      const bookBalanceBefore = bankAccount.currentBalance?.toString() ?? '0';

      const [reconciliation] = await tx
        .insert(schema.bankReconciliations)
        .values({
          tenantId,
          bankAccountId: dto.bankAccountId,
          startDate: dto.startDate.toISOString().split('T')[0],
          statementDate: dto.statementDate.toISOString().split('T')[0],
          statementEndingBalance: dto.statementEndingBalance.toString(),
          bookBalanceBefore,
          preparedByUserId: userId,
          status: 'IN_PROGRESS',
          notes: dto.notes ?? null,
        } as any)
        .returning();

      return reconciliation;
    });
  }

  async addStatementLine(
    reconciliationId: string,
    dto: AddStatementLineDto,
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [recon] = await tx
        .select()
        .from(schema.bankReconciliations)
        .where(and(eq(schema.bankReconciliations.id, reconciliationId), eq(schema.bankReconciliations.tenantId, tenantId)))
        .for('update');

      if (!recon) throw new NotFoundException('Conciliación no encontrada');
      if (recon.status !== 'IN_PROGRESS') throw new BadRequestException('Solo se pueden agregar líneas a conciliaciones en progreso');

      const txDateStr = dto.transactionDate.toISOString().split('T')[0];
      if (txDateStr < recon.startDate || txDateStr > recon.statementDate) {
        throw new BadRequestException('La fecha del movimiento debe estar dentro del rango de fechas de la conciliación');
      }

      const [line] = await tx
        .insert(schema.bankStatementLines)
        .values({
          tenantId,
          bankReconciliationId: reconciliationId,
          bankAccountId: recon.bankAccountId,
          transactionDate: txDateStr,
          description: dto.description,
          bankReference: dto.bankReference ?? null,
          debitAmount: dto.isCredit ? '0' : dto.amount.toString(),
          creditAmount: dto.isCredit ? dto.amount.toString() : '0',
          isCredit: dto.isCredit,
          status: 'PENDING',
        } as any)
        .returning();

      return line;
    });
  }

  async getStatementLines(reconciliationId: string, tenantId: string) {
    return this.drizzle
      .select()
      .from(schema.bankStatementLines)
      .where(and(eq(schema.bankStatementLines.bankReconciliationId, reconciliationId), eq(schema.bankStatementLines.tenantId, tenantId)))
      .orderBy(sql`${schema.bankStatementLines.transactionDate} desc`);
  }

  async getBookTransactions(reconciliationId: string, tenantId: string) {
    const [recon] = await this.drizzle
      .select({ bankAccountId: schema.bankReconciliations.bankAccountId, statementDate: schema.bankReconciliations.statementDate })
      .from(schema.bankReconciliations)
      .where(and(eq(schema.bankReconciliations.id, reconciliationId), eq(schema.bankReconciliations.tenantId, tenantId)));

    if (!recon) throw new NotFoundException('Conciliación no encontrada');

    return this.drizzle
      .select()
      .from(schema.bankTransactions)
      .where(
        and(
          eq(schema.bankTransactions.bankAccountId, recon.bankAccountId),
          eq(schema.bankTransactions.tenantId, tenantId),
          ne(schema.bankTransactions.reconciliationStatus, 'RECONCILED'),
          lte(schema.bankTransactions.transactionDate, recon.statementDate),
        ),
      )
      .orderBy(sql`${schema.bankTransactions.transactionDate} desc`);
  }

  async autoMatch(reconciliationId: string, tenantId: string) {
    return this.drizzle.transaction(async (tx) => {
      const [recon] = await tx
        .select()
        .from(schema.bankReconciliations)
        .where(and(eq(schema.bankReconciliations.id, reconciliationId), eq(schema.bankReconciliations.tenantId, tenantId)))
        .for('update');

      if (!recon) throw new NotFoundException('Conciliación no encontrada');

      const pendingLines = await tx
        .select()
        .from(schema.bankStatementLines)
        .where(and(eq(schema.bankStatementLines.bankReconciliationId, reconciliationId), eq(schema.bankStatementLines.status, 'PENDING')));

      const bookTxns = await tx
        .select()
        .from(schema.bankTransactions)
        .where(
          and(
            eq(schema.bankTransactions.bankAccountId, recon.bankAccountId),
            eq(schema.bankTransactions.tenantId, tenantId),
            ne(schema.bankTransactions.reconciliationStatus, 'RECONCILED'),
            lte(schema.bankTransactions.transactionDate, recon.statementDate),
          ),
        );

      let matched = 0;

      for (const line of pendingLines) {
        const lineDebit = Number(line.debitAmount);
        const lineCredit = Number(line.creditAmount);

        const exactMatch = bookTxns.find(
          (btx) =>
            Number(btx.debitAmount) === lineDebit &&
            Number(btx.creditAmount) === lineCredit &&
            (line.bankReference ? btx.bankReference === line.bankReference : true) &&
            btx.transactionDate === line.transactionDate,
        );

        if (exactMatch) {
          // Mark statement line as MATCHED (not RECONCILED yet)
          await tx
            .update(schema.bankStatementLines)
            .set({ status: 'MATCHED', matchedTransactionId: exactMatch.id } as any)
            .where(eq(schema.bankStatementLines.id, line.id));

          // DO NOT change bank_transactions.reconciliationStatus here
          // Only create the link detail
          await tx.insert(schema.bankReconciliationDetails).values({
            bankReconciliationId: reconciliationId,
            bankTransactionId: exactMatch.id,
            statementLineId: line.id,
            description: 'Auto-conciliado por coincidencia exacta',
          } as any);

          matched++;
        }
      }

      return { matched, message: `${matched} línea(s) auto-emparejada(s)` };
    });
  }

  async manualMatch(reconciliationId: string, dto: ManualMatchDto, tenantId: string) {
    return this.drizzle.transaction(async (tx) => {
      const [recon] = await tx
        .select()
        .from(schema.bankReconciliations)
        .where(and(eq(schema.bankReconciliations.id, reconciliationId), eq(schema.bankReconciliations.tenantId, tenantId)))
        .for('update');

      if (!recon) throw new NotFoundException('Conciliación no encontrada');
      if (recon.status !== 'IN_PROGRESS') throw new BadRequestException('Conciliación no está en progreso');

      const lines = await tx
        .select()
        .from(schema.bankStatementLines)
        .where(and(eq(schema.bankStatementLines.bankReconciliationId, reconciliationId), inArray(schema.bankStatementLines.id, dto.statementLineIds)));

      const bookTxns = await tx
        .select()
        .from(schema.bankTransactions)
        .where(and(eq(schema.bankTransactions.tenantId, tenantId), inArray(schema.bankTransactions.id, dto.bankTransactionIds)));

      const linesTotal = lines.reduce((s, l) => s + Number(l.creditAmount) - Number(l.debitAmount), 0);
      const booksTotal = bookTxns.reduce((s, b) => s + Number(b.creditAmount) - Number(b.debitAmount), 0);

      if (Math.abs(linesTotal - booksTotal) > 0.001) {
        throw new BadRequestException(
          `Los montos no coinciden. Extracto: ${linesTotal}, Libros: ${booksTotal}. Diferencia: ${(linesTotal - booksTotal).toFixed(2)}`,
        );
      }

      for (const line of lines) {
        await tx
          .update(schema.bankStatementLines)
          .set({ status: 'MATCHED', matchedTransactionId: bookTxns[0]?.id } as any)
          .where(eq(schema.bankStatementLines.id, line.id));
      }

      // DO NOT change bank_transactions.reconciliationStatus — only create detail links
      for (const line of lines) {
        for (const btx of bookTxns) {
          await tx.insert(schema.bankReconciliationDetails).values({
            bankReconciliationId: reconciliationId,
            bankTransactionId: btx.id,
            statementLineId: line.id,
            description: 'Conciliación manual',
          } as any);
        }
      }

      return { message: `${lines.length} línea(s) emparejada(s) con ${bookTxns.length} movimiento(s).` };
    });
  }

  async generateBookEntry(
    reconciliationId: string,
    dto: GenerateBookEntryDto,
    userId: string,
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [recon] = await tx
        .select()
        .from(schema.bankReconciliations)
        .where(and(eq(schema.bankReconciliations.id, reconciliationId), eq(schema.bankReconciliations.tenantId, tenantId)))
        .for('update');

      if (!recon) throw new NotFoundException('Conciliación no encontrada');
      if (recon.status !== 'IN_PROGRESS') throw new BadRequestException('Conciliación no está en progreso');

      const [line] = await tx
        .select()
        .from(schema.bankStatementLines)
        .where(and(eq(schema.bankStatementLines.id, dto.statementLineId), eq(schema.bankStatementLines.bankReconciliationId, reconciliationId)));

      if (!line) throw new NotFoundException('Línea de extracto no encontrada');
      if (line.status !== 'PENDING') throw new BadRequestException('La línea ya fue conciliada');

      const internalCode = this.generateInternalCode();

      const [transaction] = await tx
        .insert(schema.bankTransactions)
        .values({
          tenantId,
          bankAccountId: line.bankAccountId,
          paymentMethod: 'BANK_TRANSFER' as any,
          transactionDate: line.transactionDate,
          description: dto.description || line.description,
          category: 'OTHER_EXPENSE' as any,
          bankReference: line.bankReference,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
          internalCode,
          reconciliationStatus: 'PENDING' as any,
          bankReconciliationId: reconciliationId,
          note: line.note,
        } as any)
        .returning();

      await tx
        .update(schema.bankStatementLines)
        .set({ status: 'MATCHED', matchedTransactionId: transaction.id } as any)
        .where(eq(schema.bankStatementLines.id, line.id));

      await tx.insert(schema.bankReconciliationDetails).values({
        bankReconciliationId: reconciliationId,
        bankTransactionId: transaction.id,
        statementLineId: line.id,
        description: `Generado desde extracto: ${line.description}`,
      } as any);

      return { message: 'Movimiento contable generado y conciliado', transaction };
    });
  }

  async cancelReconciliation(reconciliationId: string, userId: string, tenantId: string) {
    return this.drizzle.transaction(async (tx) => {
      const [recon] = await tx
        .select()
        .from(schema.bankReconciliations)
        .where(and(eq(schema.bankReconciliations.id, reconciliationId), eq(schema.bankReconciliations.tenantId, tenantId)))
        .for('update');

      if (!recon) throw new NotFoundException('Conciliación no encontrada');
      if (recon.status === 'COMPLETED') throw new BadRequestException('No se puede cancelar una conciliación completada');

      await tx
        .update(schema.bankTransactions)
        .set({ reconciliationStatus: 'PENDING', bankReconciliationId: null } as any)
        .where(and(eq(schema.bankTransactions.bankReconciliationId, reconciliationId), eq(schema.bankTransactions.tenantId, tenantId)));

      await tx.delete(schema.bankReconciliationDetails).where(eq(schema.bankReconciliationDetails.bankReconciliationId, reconciliationId));
      await tx.delete(schema.bankStatementLines).where(eq(schema.bankStatementLines.bankReconciliationId, reconciliationId));

      const [cancelled] = await tx
        .update(schema.bankReconciliations)
        .set({
          status: 'REVIEWED' as any,
          notes: sql`COALESCE(${schema.bankReconciliations.notes}, '') || ' [CANCELADA]'`,
        } as any)
        .where(eq(schema.bankReconciliations.id, reconciliationId))
        .returning();

      return { message: 'Conciliación cancelada', reconciliation: cancelled };
    });
  }

  async processAndComplete(reconciliationId: string, userId: string, tenantId: string) {
    return this.drizzle.transaction(async (tx) => {
      const [recon] = await tx
        .select()
        .from(schema.bankReconciliations)
        .where(and(eq(schema.bankReconciliations.id, reconciliationId), eq(schema.bankReconciliations.tenantId, tenantId)))
        .for('update');

      if (!recon) throw new NotFoundException('Conciliación no encontrada');
      if (recon.status === 'COMPLETED') throw new BadRequestException('La conciliación ya está completada');

      const pendingLines = await tx
        .select()
        .from(schema.bankStatementLines)
        .where(and(eq(schema.bankStatementLines.bankReconciliationId, reconciliationId), eq(schema.bankStatementLines.status, 'PENDING')));

      if (pendingLines.length > 0) {
        throw new BadRequestException(`Hay ${pendingLines.length} línea(s) del extracto sin conciliar.`);
      }

      const bookBalanceBefore = Number(recon.bookBalanceBefore);

      // Get all MATCHED detail links to find involved transactions
      const matchedDetails = await tx
        .select({ bankTransactionId: schema.bankReconciliationDetails.bankTransactionId })
        .from(schema.bankReconciliationDetails)
        .where(eq(schema.bankReconciliationDetails.bankReconciliationId, reconciliationId));

      // Finalize: update all bank_transactions that are linked via details
      const linkedTxIds = [...new Set(matchedDetails.map((d: any) => d.bankTransactionId).filter(Boolean))];
      for (const txId of linkedTxIds) {
        await tx
          .update(schema.bankTransactions)
          .set({ reconciliationStatus: 'RECONCILED' as any, bankReconciliationId: reconciliationId } as any)
          .where(eq(schema.bankTransactions.id, txId as string));
      }

      // Finalize: update all MATCHED statement lines to RECONCILED
      await tx
        .update(schema.bankStatementLines)
        .set({ status: 'RECONCILED' } as any)
        .where(eq(schema.bankStatementLines.bankReconciliationId, reconciliationId));

      // Calculate KPIs
      const reconciledTxns = await tx
        .select({ debitAmount: schema.bankTransactions.debitAmount, creditAmount: schema.bankTransactions.creditAmount })
        .from(schema.bankTransactions)
        .where(and(eq(schema.bankTransactions.bankReconciliationId, reconciliationId), eq(schema.bankTransactions.tenantId, tenantId)));

      const netReconciled = reconciledTxns.reduce((s: number, t: any) => s + Number(t.creditAmount) - Number(t.debitAmount), 0);
      const bookBalanceAfter = (bookBalanceBefore + netReconciled).toString();
      const statementBalance = Number(recon.statementEndingBalance);
      const difference = (Number(bookBalanceAfter) - statementBalance).toString();

      if (Math.abs(Number(difference)) > 0.001) {
        throw new BadRequestException(`La conciliación no cuadra. Diferencia: ${difference}`);
      }

      const [updated] = await tx
        .update(schema.bankReconciliations)
        .set({
          status: 'COMPLETED' as any,
          reviewedByUserId: userId,
          reconciliationDate: new Date(),
          bookBalanceAfter,
          difference,
        } as any)
        .where(eq(schema.bankReconciliations.id, reconciliationId))
        .returning();

      return { message: 'Conciliación completada', reconciliation: updated };
    });
  }

  async findAll(bankAccountId: string | undefined, tenantId: string) {
    const conditions: SQL<unknown>[] = [eq(schema.bankReconciliations.tenantId, tenantId)];
    if (bankAccountId) conditions.push(eq(schema.bankReconciliations.bankAccountId, bankAccountId));
    return this.drizzle
      .select()
      .from(schema.bankReconciliations)
      .where(and(...conditions))
      .orderBy(sql`${schema.bankReconciliations.statementDate} desc`);
  }

  async findOne(id: string, tenantId: string) {
    const [recon] = await this.drizzle
      .select()
      .from(schema.bankReconciliations)
      .where(and(eq(schema.bankReconciliations.id, id), eq(schema.bankReconciliations.tenantId, tenantId)));

    if (!recon) throw new NotFoundException('Conciliación no encontrada');

    const [bankAccount] = await this.drizzle
      .select({
        id: schema.bankAccounts.id,
        accountNumber: schema.bankAccounts.accountNumber,
        accountName: schema.bankAccounts.accountName,
        currencyCode: schema.bankAccounts.currencyCode,
      })
      .from(schema.bankAccounts)
      .where(and(eq(schema.bankAccounts.id, recon.bankAccountId), eq(schema.bankAccounts.tenantId, tenantId)));

    const details = await this.drizzle
      .select()
      .from(schema.bankReconciliationDetails)
      .where(eq(schema.bankReconciliationDetails.bankReconciliationId, id));

    const statementLines = await this.drizzle
      .select()
      .from(schema.bankStatementLines)
      .where(and(eq(schema.bankStatementLines.bankReconciliationId, id), eq(schema.bankStatementLines.tenantId, tenantId)))
      .orderBy(sql`${schema.bankStatementLines.transactionDate} desc`);

    return { ...recon, bankAccount: bankAccount || null, details, statementLines };
  }

  async findAllByPagination(dto: FilterBankReconciliationDto, tenantId: string) {
    const { page = 1, limit = 10, bankAccountId, status, sortBy = 'statementDate', sortOrder = 'desc' } = dto;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [eq(schema.bankReconciliations.tenantId, tenantId)];
    if (bankAccountId) conditions.push(eq(schema.bankReconciliations.bankAccountId, bankAccountId));
    if (status) conditions.push(sql`${schema.bankReconciliations.status} = ${status}`);

    const whereCondition = and(...conditions);
    const orderBy = sortOrder === 'asc'
      ? sql`${schema.bankReconciliations[sortBy as keyof typeof schema.bankReconciliations]} asc`
      : sql`${schema.bankReconciliations[sortBy as keyof typeof schema.bankReconciliations]} desc`;

    const totalCountResult = await this.drizzle.select({ count: sql<number>`count(*)` }).from(schema.bankReconciliations).where(whereCondition);
    const totalItems = Number(totalCountResult[0].count);

    const data = await this.drizzle.select().from(schema.bankReconciliations).where(whereCondition).orderBy(orderBy).limit(limit).offset(offset);

    return {
      data,
      meta: { totalItems, itemCount: data.length, itemsPerPage: limit, totalPages: Math.ceil(totalItems / limit), currentPage: page },
    };
  }

  async uploadExcelAndCreateReconciliation(
    fileBuffer: Buffer,
    dto: { bankAccountId: string; startDate: Date; statementDate: Date; statementEndingBalance: number; notes?: string },
    userId: string,
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [bankAccount] = await tx
        .select({ id: schema.bankAccounts.id, currentBalance: schema.bankAccounts.currentBalance })
        .from(schema.bankAccounts)
        .where(and(eq(schema.bankAccounts.id, dto.bankAccountId), eq(schema.bankAccounts.tenantId, tenantId)));

      if (!bankAccount) throw new NotFoundException('Cuenta bancaria no encontrada');

      const bookBalanceBefore = bankAccount.currentBalance?.toString() ?? '0';

      const [reconciliation] = await tx
        .insert(schema.bankReconciliations)
        .values({
          tenantId,
          bankAccountId: dto.bankAccountId,
          startDate: dto.startDate.toISOString().split('T')[0],
          statementDate: dto.statementDate.toISOString().split('T')[0],
          statementEndingBalance: dto.statementEndingBalance.toString(),
          bookBalanceBefore,
          preparedByUserId: userId,
          status: 'IN_PROGRESS',
          notes: dto.notes ?? null,
        } as any)
        .returning();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer as any);
      const worksheet = workbook.worksheets[0];

      const lines: any[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const vals = row.values as any[];
        const transactionDate = vals[1] ? new Date(vals[1]) : null;
        const description = vals[2]?.toString()?.trim();
        const bankReference = vals[3]?.toString()?.trim() || null;
        const debitAmount = vals[4] ? Number(vals[4]) : 0;
        const creditAmount = vals[5] ? Number(vals[5]) : 0;

        if (!transactionDate || !description) return;

        lines.push({ transactionDate, description, bankReference, debitAmount, creditAmount, isCredit: creditAmount > 0 });
      });

      for (const l of lines) {
        await tx.insert(schema.bankStatementLines).values({
          tenantId,
          bankReconciliationId: reconciliation.id,
          bankAccountId: dto.bankAccountId,
          transactionDate: l.transactionDate.toISOString().split('T')[0],
          description: l.description,
          bankReference: l.bankReference,
          debitAmount: l.debitAmount.toString(),
          creditAmount: l.creditAmount.toString(),
          isCredit: l.isCredit,
          status: 'PENDING',
        } as any);
      }

      return { reconciliation, linesImported: lines.length };
    });
  }

  async unmatchStatementLine(reconciliationId: string, statementLineId: string, tenantId: string) {
    return this.drizzle.transaction(async (tx) => {
      const [recon] = await tx
        .select()
        .from(schema.bankReconciliations)
        .where(and(eq(schema.bankReconciliations.id, reconciliationId), eq(schema.bankReconciliations.tenantId, tenantId)))
        .for('update');

      if (!recon) throw new NotFoundException('Conciliación no encontrada');
      if (recon.status !== 'IN_PROGRESS') throw new BadRequestException('Conciliación no está en progreso');

      await tx
        .delete(schema.bankReconciliationDetails)
        .where(and(eq(schema.bankReconciliationDetails.bankReconciliationId, reconciliationId), eq(schema.bankReconciliationDetails.statementLineId, statementLineId)));

      await tx
        .delete(schema.bankStatementLines)
        .where(and(eq(schema.bankStatementLines.id, statementLineId), eq(schema.bankStatementLines.bankReconciliationId, reconciliationId)));

      return { message: 'Línea anulada y eliminada' };
    });
  }
}
