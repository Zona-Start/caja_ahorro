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
import { and, eq, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  AddReconciliationDetailDto,
  CreateBankReconciliationDto,
  FilterBankReconciliationDto,
} from './dto/bank-reconciliations.schema';

@Injectable()
export class BankReconciliationsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

    return { ...recon, details };
  }
}
