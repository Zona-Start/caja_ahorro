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
import { and, eq, isNull, sql, SQL, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import {
  AddManualMovementDto,
  AddReconciliationDetailDto,
  BulkAddMovementsDto,
  CreateBankReconciliationDto,
  FilterBankReconciliationDto,
} from './dto/bank-reconciliations.schema';

@Injectable()
export class BankReconciliationsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private generateInternalCode(tenantId: string): string {
    const prefix = 'BTX';
    const ts = Date.now().toString(36).toUpperCase().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${ts}${random}`;
  }

  async create(
    dto: CreateBankReconciliationDto,
    userId: string,
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [bankAccount] = await tx
        .select({
          id: schema.bankAccounts.id,
          currentBalance: schema.bankAccounts.currentBalance,
        })
        .from(schema.bankAccounts)
        .where(
          and(
            eq(schema.bankAccounts.id, dto.bankAccountId),
            eq(schema.bankAccounts.tenantId, tenantId),
          ),
        );

      if (!bankAccount) {
        throw new NotFoundException('Cuenta bancaria no encontrada');
      }

      const bookBalanceBefore = bankAccount.currentBalance?.toString() ?? '0';

      const [reconciliation] = await tx
        .insert(schema.bankReconciliations)
        .values({
          tenantId,
          bankAccountId: dto.bankAccountId,
          statementDate: dto.statementDate.toISOString().split('T')[0],
          statementEndingBalance: dto.statementEndingBalance.toString(),
          bookBalanceBefore,
          preparedByUserId: userId,
          status: 'IN_PROGRESS',
          notes: dto.notes ?? null,
        })
        .returning();

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'bank_reconciliations',
          recordId: reconciliation.id,
          action: 'CREATE',
          userId,
          area: 'BANKING',
          description: `Bank reconciliation created for bank account ${dto.bankAccountId}`,
          newData: reconciliation,
          tenantId,
        }),
      );

      return reconciliation;
    });
  }

  async addDetail(
    reconciliationId: string,
    dto: AddReconciliationDetailDto,
    tenantId: string,
  ) {
    const [recon] = await this.drizzle
      .select({
        id: schema.bankReconciliations.id,
        status: schema.bankReconciliations.status,
      })
      .from(schema.bankReconciliations)
      .where(
        and(
          eq(schema.bankReconciliations.id, reconciliationId),
          eq(schema.bankReconciliations.tenantId, tenantId),
        ),
      );

    if (!recon) {
      throw new NotFoundException('Conciliación no encontrada');
    }

    if (recon.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Solo se pueden agregar detalles a conciliaciones en progreso',
      );
    }

    const [insertedDetail] = await this.drizzle
      .insert(schema.bankReconciliationDetails)
      .values({
        bankReconciliationId: reconciliationId,
        bankTransactionId: dto.bankTransactionId ?? null,
        accountingEntryDetailId: dto.accountingEntryDetailId ?? null,
        adjustmentType: dto.adjustmentType ?? null,
        adjustmentAmount: dto.adjustmentAmount?.toString() ?? null,
        description: dto.description ?? null,
        isBookAdjustment: dto.isBookAdjustment ?? false,
      })
      .returning();

    return insertedDetail;
  }

  async addManualMovement(
    reconciliationId: string,
    dto: AddManualMovementDto,
    userId: string,
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [recon] = await tx
        .select()
        .from(schema.bankReconciliations)
        .where(
          and(
            eq(schema.bankReconciliations.id, reconciliationId),
            eq(schema.bankReconciliations.tenantId, tenantId),
          ),
        )
        .for('update');

      if (!recon) {
        throw new NotFoundException('Conciliación no encontrada');
      }

      if (recon.status !== 'IN_PROGRESS') {
        throw new BadRequestException(
          'Solo se pueden agregar movimientos a conciliaciones en progreso',
        );
      }

      const internalCode = this.generateInternalCode(tenantId);

      const [transaction] = await tx
        .insert(schema.bankTransactions)
        .values({
          tenantId,
          bankAccountId: dto.bankAccountId,
          transactionDate: dto.transactionDate.toISOString().split('T')[0],
          valueDate: dto.valueDate
            ? dto.valueDate.toISOString().split('T')[0]
            : null,
          description: dto.description,
          category: dto.category as any,
          bankReference: dto.bankReference ?? null,
          paymentMethod: dto.paymentMethod as any,
          debitAmount: (dto.debitAmount ?? 0).toString(),
          creditAmount: (dto.creditAmount ?? 0).toString(),
          resultingBalance: dto.resultingBalance?.toString() ?? null,
          internalCode,
          reconciliationStatus: 'RECONCILED' as any,
          bankReconciliationId: reconciliationId,
          note: dto.note ?? null,
        } as any)
        .returning();

      await tx.insert(schema.bankReconciliationDetails).values({
        bankReconciliationId: reconciliationId,
        bankTransactionId: transaction.id,
        description: `Movimiento manual: ${dto.description}`,
      });

      return transaction;
    });
  }

  async addBulkMovements(
    reconciliationId: string,
    movementIds: string[],
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [recon] = await tx
        .select()
        .from(schema.bankReconciliations)
        .where(
          and(
            eq(schema.bankReconciliations.id, reconciliationId),
            eq(schema.bankReconciliations.tenantId, tenantId),
          ),
        )
        .for('update');

      if (!recon) {
        throw new NotFoundException('Conciliación no encontrada');
      }

      if (recon.status !== 'IN_PROGRESS') {
        throw new BadRequestException(
          'Solo se pueden agregar movimientos a conciliaciones en progreso',
        );
      }

      for (const movementId of movementIds) {
        await tx
          .update(schema.bankTransactions)
          .set({
            reconciliationStatus: 'RECONCILED',
            bankReconciliationId: reconciliationId,
          })
          .where(
            and(
              eq(schema.bankTransactions.id, movementId),
              eq(schema.bankTransactions.tenantId, tenantId),
            ),
          );

        await tx.insert(schema.bankReconciliationDetails).values({
          bankReconciliationId: reconciliationId,
          bankTransactionId: movementId,
          description: `Movimiento vinculado a conciliación`,
        });
      }

      return { message: `${movementIds.length} movimientos agregados` };
    });
  }

  async uploadExcelAndCreateReconciliation(
    fileBuffer: Buffer,
    dto: { bankAccountId: string; statementDate: Date; statementEndingBalance: number; notes?: string },
    userId: string,
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [bankAccount] = await tx
        .select({
          id: schema.bankAccounts.id,
          currentBalance: schema.bankAccounts.currentBalance,
        })
        .from(schema.bankAccounts)
        .where(
          and(
            eq(schema.bankAccounts.id, dto.bankAccountId),
            eq(schema.bankAccounts.tenantId, tenantId),
          ),
        );

      if (!bankAccount) {
        throw new NotFoundException('Cuenta bancaria no encontrada');
      }

      const bookBalanceBefore = bankAccount.currentBalance?.toString() ?? '0';

      const [reconciliation] = await tx
        .insert(schema.bankReconciliations)
        .values({
          tenantId,
          bankAccountId: dto.bankAccountId,
          statementDate: dto.statementDate.toISOString().split('T')[0],
          statementEndingBalance: dto.statementEndingBalance.toString(),
          bookBalanceBefore,
          preparedByUserId: userId,
          status: 'IN_PROGRESS',
          notes: dto.notes ?? null,
        })
        .returning();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);
      const worksheet = workbook.worksheets[0];

      const uploadBatchId = crypto.randomUUID();
      const movementIds: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const vals = row.values as any[];
        const transactionDate = vals[1] ? new Date(vals[1]) : null;
        const description = vals[2]?.toString()?.trim();
        const category = vals[3]?.toString()?.trim() || 'OTHER_EXPENSE';
        const bankReference = vals[4]?.toString()?.trim() || null;
        const paymentMethod = vals[5]?.toString()?.trim() || 'BANK_TRANSFER';
        const debitAmount = vals[6] ? Number(vals[6]) : 0;
        const creditAmount = vals[7] ? Number(vals[7]) : 0;
        const valueDate = vals[8] ? new Date(vals[8]) : null;
        const note = vals[9]?.toString()?.trim() || null;

        if (!transactionDate || !description) return;

        movementIds.push({
          transactionDate,
          description,
          category,
          bankReference,
          paymentMethod,
          debitAmount,
          creditAmount,
          valueDate,
          note,
        } as any);
      });

      for (const m of movementIds) {
        const internalCode = this.generateInternalCode(tenantId);
        const [transaction] = await tx
          .insert(schema.bankTransactions)
          .values({
            tenantId,
            bankAccountId: dto.bankAccountId,
            transactionDate: (m as any).transactionDate.toISOString().split('T')[0],
            valueDate: (m as any).valueDate
              ? (m as any).valueDate.toISOString().split('T')[0]
              : null,
            description: (m as any).description,
            category: (m as any).category as any,
            bankReference: (m as any).bankReference,
            paymentMethod: (m as any).paymentMethod as any,
            debitAmount: ((m as any).debitAmount ?? 0).toString(),
            creditAmount: ((m as any).creditAmount ?? 0).toString(),
            internalCode,
            reconciliationStatus: 'RECONCILED' as any,
            bankReconciliationId: reconciliation.id,
            uploadBatchId,
            note: (m as any).note,
          } as any)
          .returning();

        await tx.insert(schema.bankReconciliationDetails).values({
          bankReconciliationId: reconciliation.id,
          bankTransactionId: transaction.id,
          description: `Importado desde Excel: ${(m as any).description}`,
        });
      }

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'bank_reconciliations',
          recordId: reconciliation.id,
          action: 'CREATE',
          userId,
          area: 'BANKING',
          description: `Bank reconciliation created from Excel upload. ${movementIds.length} movements imported.`,
          newData: reconciliation,
          tenantId,
        }),
      );

      return {
        reconciliation,
        movementsImported: movementIds.length,
      };
    });
  }

  async getAvailableTransactions(
    bankAccountId: string,
    tenantId: string,
  ) {
    return this.drizzle
      .select()
      .from(schema.bankTransactions)
      .where(
        and(
          eq(schema.bankTransactions.bankAccountId, bankAccountId),
          eq(schema.bankTransactions.tenantId, tenantId),
          or(
            eq(schema.bankTransactions.reconciliationStatus, 'PENDING'),
            eq(schema.bankTransactions.reconciliationStatus, 'MANUAL_MATCH'),
          ),
          isNull(schema.bankTransactions.bankReconciliationId),
        ),
      )
      .orderBy(sql`${schema.bankTransactions.transactionDate} desc`);
  }

  async cancelReconciliation(
    reconciliationId: string,
    userId: string,
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [recon] = await tx
        .select()
        .from(schema.bankReconciliations)
        .where(
          and(
            eq(schema.bankReconciliations.id, reconciliationId),
            eq(schema.bankReconciliations.tenantId, tenantId),
          ),
        )
        .for('update');

      if (!recon) {
        throw new NotFoundException('Conciliación no encontrada');
      }

      if (recon.status === 'COMPLETED') {
        throw new BadRequestException(
          'No se puede cancelar una conciliación completada',
        );
      }

      await tx
        .update(schema.bankTransactions)
        .set({
          reconciliationStatus: 'PENDING',
          bankReconciliationId: null,
        })
        .where(
          and(
            eq(schema.bankTransactions.bankReconciliationId, reconciliationId),
            eq(schema.bankTransactions.tenantId, tenantId),
          ),
        );

      await tx
        .delete(schema.bankReconciliationDetails)
        .where(
          eq(
            schema.bankReconciliationDetails.bankReconciliationId,
            reconciliationId,
          ),
        );

      const [cancelled] = await tx
        .update(schema.bankReconciliations)
        .set({
          status: 'REVIEWED',
          notes: sql`COALESCE(${schema.bankReconciliations.notes}, '') || ' [CANCELADA]'`,
        })
        .where(
          and(
            eq(schema.bankReconciliations.id, reconciliationId),
            eq(schema.bankReconciliations.tenantId, tenantId),
          ),
        )
        .returning();

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'bank_reconciliations',
          recordId: reconciliationId,
          action: 'UPDATE',
          userId,
          area: 'BANKING',
          description: `Bank reconciliation cancelled`,
          newData: cancelled,
          previousData: recon,
          tenantId,
        }),
      );

      return { message: 'Conciliación cancelada', reconciliation: cancelled };
    });
  }

  async processAndComplete(
    reconciliationId: string,
    userId: string,
    tenantId: string,
  ) {
    return this.drizzle.transaction(async (tx) => {
      const [recon] = await tx
        .select()
        .from(schema.bankReconciliations)
        .where(
          and(
            eq(schema.bankReconciliations.id, reconciliationId),
            eq(schema.bankReconciliations.tenantId, tenantId),
          ),
        )
        .for('update');

      if (!recon) {
        throw new NotFoundException('Conciliación no encontrada');
      }

      if (recon.status === 'COMPLETED') {
        throw new BadRequestException('La conciliación ya está completada');
      }

      const bookBalanceBefore = Number(recon.bookBalanceBefore);

      const details = await tx
        .select({
          adjustmentAmount: schema.bankReconciliationDetails.adjustmentAmount,
          isBookAdjustment: schema.bankReconciliationDetails.isBookAdjustment,
        })
        .from(schema.bankReconciliationDetails)
        .where(
          eq(
            schema.bankReconciliationDetails.bankReconciliationId,
            reconciliationId,
          ),
        );

      const adjustmentsTotal = details
        .filter((d) => d.isBookAdjustment)
        .reduce(
          (sum, d) =>
            sum + (d.adjustmentAmount ? Number(d.adjustmentAmount) : 0),
          0,
        );

      const bookBalanceAfter = (
        bookBalanceBefore + adjustmentsTotal
      ).toString();
      const statementBalance = Number(recon.statementEndingBalance);
      const difference = (
        Number(bookBalanceAfter) - statementBalance
      ).toString();
      const reconciliationDate = new Date();

      const [updated] = await tx
        .update(schema.bankReconciliations)
        .set({
          status: 'COMPLETED',
          reviewedByUserId: userId,
          reconciliationDate,
          bookBalanceAfter,
          difference,
        })
        .where(
          and(
            eq(schema.bankReconciliations.id, reconciliationId),
            eq(schema.bankReconciliations.tenantId, tenantId),
          ),
        )
        .returning();

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'bank_reconciliations',
          recordId: reconciliationId,
          action: 'UPDATE',
          userId,
          area: 'BANKING',
          description: `Bank reconciliation completed. Statement: ${statementBalance}, Book after: ${bookBalanceAfter}, Diff: ${difference}`,
          newData: updated,
          previousData: recon,
          tenantId,
        }),
      );

      return { message: 'Conciliación completada', reconciliation: updated };
    });
  }

  async findAll(bankAccountId: string | undefined, tenantId: string) {
    const conditions: SQL<unknown>[] = [
      eq(schema.bankReconciliations.tenantId, tenantId),
    ];
    if (bankAccountId) {
      conditions.push(
        eq(schema.bankReconciliations.bankAccountId, bankAccountId),
      );
    }

    return this.drizzle
      .select()
      .from(schema.bankReconciliations)
      .where(and(...conditions))
      .orderBy(sql`${schema.bankReconciliations.statementDate} desc`);
  }

  async findAllByPagination(
    dto: FilterBankReconciliationDto,
    tenantId: string,
  ) {
    const {
      page = 1,
      limit = 10,
      bankAccountId,
      status,
      sortBy = 'statementDate',
      sortOrder = 'desc',
    } = dto;

    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [
      eq(schema.bankReconciliations.tenantId, tenantId),
    ];
    if (bankAccountId) {
      conditions.push(
        eq(schema.bankReconciliations.bankAccountId, bankAccountId),
      );
    }
    if (status) {
      conditions.push(sql`${schema.bankReconciliations.status} = ${status}`);
    }

    const whereCondition = and(...conditions);

    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.bankReconciliations[sortBy as keyof typeof schema.bankReconciliations]} asc`
        : sql`${schema.bankReconciliations[sortBy as keyof typeof schema.bankReconciliations]} desc`;

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.bankReconciliations)
      .where(whereCondition);

    const totalItems = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    const data = await this.drizzle
      .select()
      .from(schema.bankReconciliations)
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const [recon] = await this.drizzle
      .select()
      .from(schema.bankReconciliations)
      .where(
        and(
          eq(schema.bankReconciliations.id, id),
          eq(schema.bankReconciliations.tenantId, tenantId),
        ),
      );

    if (!recon) {
      throw new NotFoundException('Conciliación no encontrada');
    }

    const details = await this.drizzle
      .select()
      .from(schema.bankReconciliationDetails)
      .where(eq(schema.bankReconciliationDetails.bankReconciliationId, id));

    const transactions = await this.drizzle
      .select()
      .from(schema.bankTransactions)
      .where(
        and(
          eq(schema.bankTransactions.bankReconciliationId, id),
          eq(schema.bankTransactions.tenantId, tenantId),
        ),
      );

    return { ...recon, details, transactions };
  }
}
