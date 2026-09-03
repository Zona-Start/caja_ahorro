import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import { AssociateMovementTypeEnum, CurrencyCodeEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, eq, gte, ilike, lte, sql, type SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../../parnerts/associate-accounts-movements/associate-accounts-movements.service';
import { ContributionBatchesAccountingService } from './contribution-batches-accounting.service';
import { ContributionAssociateType } from '../individual-load/schemas/individual-load.types';
import {
  CreateContributionBatchDto,
  FilterContributionBatchDto,
} from './dto/contribution-batches.zod.dto';

interface AssociateEntryInput {
  associateId: string;
  amount?: number;
  contributionType?: ContributionAssociateType;
}

@Injectable()
export class ContributionBatchesService {
  private readonly logger = new Logger(ContributionBatchesService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly associateMovementsService: AssociateAccountsMovementsService,
    private readonly bankMovementsService: BankMovementsService,
    private readonly contributionAccountingService: ContributionBatchesAccountingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    tenantId: string,
    filterDto: FilterContributionBatchDto,
  ): Promise<{ data: any[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'entryDate',
      sortOrder = 'desc',
      status,
      type,
      movementType,
      startDate,
      endDate,
    } = filterDto || {};
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    conditions.push(eq(schema.contributionBatches.tenantId, tenantId));

    if (search) {
      conditions.push(
        ilike(schema.contributionBatches.description, `%${search}%`),
      );
    }
    if (status) {
      conditions.push(eq(schema.contributionBatches.status, status as any));
    }
    if (type) {
      conditions.push(eq(schema.contributionBatches.type, type as any));
    }
    if (movementType) {
      conditions.push(
        eq(schema.contributionBatches.movementType, movementType as any),
      );
    }
    if (startDate) {
      conditions.push(
        gte(schema.contributionBatches.entryDate, startDate as any),
      );
    }
    if (endDate) {
      conditions.push(
        lte(schema.contributionBatches.entryDate, endDate as any),
      );
    }

    const where = and(...conditions);

    const sortCol =
      sortBy && sortBy in schema.contributionBatches
        ? (schema.contributionBatches as any)[sortBy]
        : schema.contributionBatches.entryDate;

    const orderBy =
      sortOrder === 'asc' ? sql`${sortCol} asc` : sql`${sortCol} desc`;

    const [{ count }] = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.contributionBatches)
      .where(where);

    const data = await this.drizzle
      .select()
      .from(schema.contributionBatches)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        page,
        limit,
        totalCount: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
        hasNextPage: page < Math.ceil(Number(count) / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const [batch] = await this.drizzle
      .select()
      .from(schema.contributionBatches)
      .where(
        and(
          eq(schema.contributionBatches.id, id),
          eq(schema.contributionBatches.tenantId, tenantId),
        ),
      );

    if (!batch) {
      throw new NotFoundException('Lote de carga no encontrado');
    }

    const associatesList = await this.drizzle
      .select({
        id: schema.associates.id,
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        amount: schema.contributionBatchAssociates.amount,
        contributionType: schema.contributionBatchAssociates.contributionType,
      })
      .from(schema.contributionBatchAssociates)
      .innerJoin(
        schema.associates,
        eq(
          schema.contributionBatchAssociates.associateId,
          schema.associates.id,
        ),
      )
      .where(eq(schema.contributionBatchAssociates.contributionBatchId, id));

    return { ...batch, associates: associatesList };
  }

  /**
   * Persiste el lote de carga de haberes (`contribution_batches`) junto con
   * las entradas de detalle (`contribution_batch_associates`).
   *
   * Es cohesivo: SOLO registra el lote. No intenta generar asientos
   * contables (eso se hace fuera de la transacción financiera, vía el
   * orquestador que llama a `attemptAccountingEntry` en el servicio
   * de carga individual) ni emite auditoría (ver `emitAuditLog`).
   *
   * `accountingEntryId` y `bankTransactionId` se dejan en `undefined`
   * (NULL en DB) en este punto; el orquestador los actualizará post-commit
   * cuando el asiento contable o la transacción bancaria se confirmen.
   */
  async createBatchRecord(
    tx: NodePgDatabase<typeof schema>,
    tenantId: string,
    userId: string,
    dto: CreateContributionBatchDto,
    associateEntries: AssociateEntryInput[] = [],
  ): Promise<typeof schema.contributionBatches.$inferSelect> {
    const [batch] = await tx
      .insert(schema.contributionBatches)
      .values({
        tenantId,
        type: dto.type,
        movementType: dto.movementType,
        entryDate: dto.entryDate.toISOString().split('T')[0],
        associateId: dto.associateId,
        description: dto.description,
        amountVoluntario: dto.amountVoluntario?.toString(),
        amountPatrono: dto.amountPatrono?.toString(),
        amountAsociado: dto.amountAsociado?.toString(),
        totalAmount: dto.totalAmount.toString(),
        associateCount: dto.associateCount,
        status: 'completed',
        bankTransactionId: dto.bankTransactionId,
        bankData: dto.bankData,
        createdById: userId,
      })
      .returning();

    if (associateEntries.length > 0) {
      await tx.insert(schema.contributionBatchAssociates).values(
        associateEntries.map((entry) => ({
          contributionBatchId: batch.id,
          associateId: entry.associateId,
          contributionType: entry.contributionType ?? 'ASSOCIATED_SAVINGS',
          amount: entry.amount?.toString(),
          createdById: userId,
        })),
      );
    } else if (dto.associateId) {
      await tx.insert(schema.contributionBatchAssociates).values({
        contributionBatchId: batch.id,
        associateId: dto.associateId,
        contributionType: 'ASSOCIATED_SAVINGS',
        amount: dto.totalAmount.toString(),
        createdById: userId,
      });
    }

    return batch;
  }

  /**
   * Actualiza referencias externas del lote (asiento contable y/o
   * transacción bancaria) una vez confirmadas las operaciones post-commit.
   */
  async updateBatchReferences(
    tx: NodePgDatabase<typeof schema>,
    batchId: string,
    updates: {
      accountingEntryId?: string;
      bankTransactionId?: string;
    },
  ): Promise<void> {
    const set: Record<string, unknown> = {};
    if (updates.accountingEntryId !== undefined) {
      set.accountingEntryId = updates.accountingEntryId;
    }
    if (updates.bankTransactionId !== undefined) {
      set.bankTransactionId = updates.bankTransactionId;
    }
    if (Object.keys(set).length === 0) return;

    await tx
      .update(schema.contributionBatches)
      .set(set)
      .where(eq(schema.contributionBatches.id, batchId));
  }

  /**
   * Emite el evento de auditoría para un lote de carga de haberes.
   * Desacoplado de `createBatchRecord` para permitir que el orquestador
   * controle el momento exacto de la emisión dentro de la transacción.
   */
  emitAuditLog(
    batch: typeof schema.contributionBatches.$inferSelect,
    userId: string,
    action: 'INSERT' | 'UPDATE' = 'INSERT',
    previousData?: Record<string, unknown>,
    newData?: Record<string, unknown>,
  ): void {
    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        tableName: 'contribution_batches',
        recordId: batch.id,
        action,
        userId,
        area: 'savings_banks',
        description: `${action === 'UPDATE' ? 'Actualización de' : 'Carga de'} haberes${batch.type === 'massive' ? ' masiva' : ''} por ${batch.totalAmount}`,
        previousData,
        newData: newData ?? {
          type: batch.movementType,
          total: batch.totalAmount,
          count: batch.associateCount,
        },
      }),
    );
  }

  async reverse(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<{ message: string; accountingWarning?: string }> {
    return this.drizzle.transaction(async (tx) => {
      const [batch] = await tx
        .select()
        .from(schema.contributionBatches)
        .where(
          and(
            eq(schema.contributionBatches.id, id),
            eq(schema.contributionBatches.tenantId, tenantId),
          ),
        );

      if (!batch) {
        throw new NotFoundException('Lote de carga no encontrado');
      }

      if (batch.status !== 'completed') {
        throw new BadRequestException(
          'Solo se puede anular una carga completada',
        );
      }

      if (batch.associateId) {
        const [account] = await tx
          .select({ id: schema.associateAccounts.id })
          .from(schema.associateAccounts)
          .innerJoin(
            schema.associates,
            eq(schema.associateAccounts.associateId, schema.associates.id),
          )
          .where(
            and(
              eq(schema.associateAccounts.associateId, batch.associateId),
              eq(schema.associates.tenantId, tenantId),
            ),
          );

        if (account) {
          await this.associateMovementsService.create(
            userId,
            {
              associateAccountId: account.id,
              movementType: 'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
              amount: -Number(batch.totalAmount),
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: new Date(),
              description: `Reverso: ${batch.description || 'Carga de haberes'}`,
              status: 'COMPLETED',
            },
            tenantId,
            tx,
          );
        }
      }

      if (batch.bankTransactionId) {
        const [bankTx] = await tx
          .select()
          .from(schema.bankTransactions)
          .where(eq(schema.bankTransactions.id, batch.bankTransactionId));

        if (bankTx) {
          await this.bankMovementsService.createAndReconcile(
            {
              movement: {
                bankAccountId: bankTx.bankAccountId,
                transactionDate: new Date(bankTx.transactionDate),
                paymentMethod: bankTx.paymentMethod,
                description: `Reverso: ${batch.description || 'Carga de haberes'}`,
                bankReference: bankTx.bankReference || undefined,
                category: 'MEMBER_CONTRIBUTION' as any,
                creditAmount: 0,
                debitAmount: Number(batch.totalAmount),
              },
              links: [],
            },
            userId,
            tenantId,
            tx,
          );
        }
      }

      let reversalEntryId: string | undefined;
      let accountingWarning: string | undefined;

      if (batch.accountingEntryId) {
        await tx
          .update(schema.accountingEntries)
          .set({ status: 'CANCELLED' as any })
          .where(eq(schema.accountingEntries.id, batch.accountingEntryId));

        const reversal =
          await this.contributionAccountingService.generateReversalEntry(
            tenantId,
            userId,
            batch,
            tx,
          );

        if (reversal?.reversalEntryId) {
          reversalEntryId = reversal.reversalEntryId;
        }
        if (reversal?.warning) {
          accountingWarning = reversal.warning;
          this.logger.warn(
            `Reverso contable no generado para anulación (batch=${batch.id}): ${reversal.warning}.`,
          );
        }
      }

      await tx
        .update(schema.contributionBatches)
        .set({
          status: 'reversed',
          reversalEntryId,
          updatedById: userId,
        })
        .where(
          and(
            eq(schema.contributionBatches.id, id),
            eq(schema.contributionBatches.tenantId, tenantId),
          ),
        );

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'contribution_batches',
          recordId: id,
          action: 'UPDATE',
          userId,
          area: 'savings_banks',
          description: `Anulación de carga de haberes por ${batch.totalAmount}`,
          previousData: { status: 'completed' },
          newData: { status: 'reversed' },
        }),
      );

      return {
        message: accountingWarning
          ? `Carga anulada correctamente. Advertencia contable: ${accountingWarning}`
          : 'Carga anulada correctamente',
        accountingWarning,
      };
    });
  }
}
