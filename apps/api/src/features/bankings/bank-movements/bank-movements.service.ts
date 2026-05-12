import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import {
  CreateAndReconcileDto,
  CreateBankMovementDto,
  FilterBankMovementDto,
  GetLinkablesDto,
  LinkToInternalDto,
  ReverseMovementDto,
} from './dto/bank-movements.schema';

@Injectable()
export class BankMovementsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(tenantId: string, dto: FilterBankMovementDto) {
    const { page, limit, search, bankAccountId, sortBy, sortOrder } = dto;
    const offset = (page - 1) * limit;

    const conditions = [eq(schema.bankTransactions.tenantId, tenantId)];

    if (bankAccountId) {
      conditions.push(eq(schema.bankTransactions.bankAccountId, bankAccountId));
    }

    if (search) {
      conditions.push(
        or(
          ilike(schema.bankTransactions.description, `%${search}%`),
          ilike(schema.bankTransactions.bankReference, `%${search}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.bankTransactions)
      .where(whereClause);

    const totalCount = Number(totalResult.count);

    const sortColumn =
      sortBy === 'createdAt'
        ? schema.bankTransactions.createdAt
        : sortBy === 'creditAmount'
          ? schema.bankTransactions.creditAmount
          : sortBy === 'debitAmount'
            ? schema.bankTransactions.debitAmount
            : schema.bankTransactions.transactionDate;

    const data = await this.db
      .select()
      .from(schema.bankTransactions)
      .where(whereClause)
      .orderBy(
        sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`,
      )
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const [row] = await this.db
      .select()
      .from(schema.bankTransactions)
      .where(
        and(
          eq(schema.bankTransactions.id, id),
          eq(schema.bankTransactions.tenantId, tenantId),
        ),
      );

    if (!row) throw new NotFoundException(`Bank movement ${id} not found`);
    return row;
  }

  async create(
    dto: CreateBankMovementDto,
    userId: string,
    tenantId: string,
    tx?: DrizzleDatabase,
  ) {
    const db = tx ?? this.db;
    const [row] = await db
      .insert(schema.bankTransactions)
      .values({
        tenantId,
        bankAccountId: dto.bankAccountId,
        transactionDate: dto.transactionDate.toISOString().split('T')[0],
        paymentMethod: dto.paymentMethod as any,
        description: dto.description,
        bankReference: dto.bankReference ?? null,
        category: dto.category as any,
        creditAmount: String(dto.creditAmount),
        debitAmount: String(dto.debitAmount),
        valueDate: dto.valueDate
          ? dto.valueDate.toISOString().split('T')[0]
          : null,
        note: dto.note ?? null,
        createdById: userId,
      })
      .returning();

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'INSERT',
        tableName: 'bank_transactions',
        recordId: row.id,
        description: `Bank movement created: ${row.description}`,
        area: 'Treasury',
        newData: row,
        tenantId,
      }),
    );

    return row;
  }

  async createAndReconcile(
    dto: CreateAndReconcileDto,
    userId: string,
    tenantId: string,
    tx?: DrizzleDatabase,
  ) {
    const db = tx ?? this.db;
    return db.transaction(async (tx) => {
      const movement = await this.create(dto.movement, userId, tenantId, tx);

      if (dto.links && dto.links.length > 0) {
        const linkValues: (typeof schema.internalTransactionBankLinks.$inferInsert)[] =
          dto.links.map((l) => ({
            tenantId,
            bankTransactionId: movement.id,
            internalRecordType: l.internalRecordType,
            internalRecordId: l.internalRecordId,
            linkedBy: userId,
          }));

        await tx.insert(schema.internalTransactionBankLinks).values(linkValues);

        await tx
          .update(schema.bankTransactions)
          .set({
            reconciliationStatus: 'RECONCILED',
            internalLinkStatus: 'LINKED',
          })
          .where(eq(schema.bankTransactions.id, movement.id));
      }

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          userId,
          action: 'INSERT',
          tableName: 'bank_transactions',
          recordId: movement.id,
          description: `Bank movement created and reconciled: ${movement.description}`,
          area: 'Treasury',
          newData: { movement, links: dto.links },
          tenantId,
        }),
      );

      return {
        message: 'Movement created and reconciled successfully',
        movement,
      };
    });
  }

  async getLinkables(category: string, tenantId: string, dto: GetLinkablesDto) {
    const { q, page, limit, startDate, endDate } = dto;
    const offset = (page - 1) * limit;

    const [rule] = await this.db
      .select()
      .from(schema.bankCategoryRule)
      .where(
        and(
          eq(schema.bankCategoryRule.category, category as any),
          eq(schema.bankCategoryRule.tenantId, tenantId),
        ),
      );

    const emptyMeta = {
      page,
      limit,
      totalCount: 0,
      totalPages: 0,
    };

    if (!rule || !rule.internalTable) {
      return { data: [], meta: emptyMeta };
    }

    const { internalTable } = rule;

    type LinkableRecord = {
      id: string | number;
      type: string;
      amount: string | number | null;
      date: string | Date | null;
      concept: string;
    };

    const tableQueries: Record<string, () => Promise<LinkableRecord[]>> = {
      associateAccountMovements: async () => {
        const rows = await this.db
          .select({
            id: schema.associateAccountMovements.id,
            type: sql<string>`'MEMBER_CONTRIBUTION'`.as('type'),
            amount: schema.associateAccountMovements.amount,
            date: schema.associateAccountMovements.transactionDate,
            concept:
              sql<string>`CONCAT('Aporte Socio ', ${schema.associates.fullname})`.as(
                'concept',
              ),
          })
          .from(schema.associateAccountMovements)
          .innerJoin(
            schema.associateAccounts,
            eq(
              schema.associateAccountMovements.associateAccountId,
              schema.associateAccounts.id,
            ),
          )
          .innerJoin(
            schema.associates,
            eq(schema.associateAccounts.associateId, schema.associates.id),
          )
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.associateAccountMovements.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(schema.associates.tenantId, tenantId),
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          );
        return rows;
      },
      withdrawalsAssociates: async () => {
        const rows = await this.db
          .select({
            id: schema.withdrawalsAssociates.id,
            type: sql<string>`'MEMBER_WITHDRAWAL'`.as('type'),
            amount: schema.withdrawalsAssociates.requestedAmount,
            date: schema.withdrawalsAssociates.withdrawalDate,
            concept:
              sql<string>`CONCAT('Retiro Socio ', ${schema.withdrawalsAssociates.referenceCode})`.as(
                'concept',
              ),
          })
          .from(schema.withdrawalsAssociates)
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.withdrawalsAssociates.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(schema.withdrawalsAssociates.tenantId, tenantId),
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          );
        return rows;
      },
      liquidationsAssociates: async () => {
        const rows = await this.db
          .select({
            id: schema.liquidationsAssociates.id,
            type: sql<string>`'PAYROLL_SETTLEMENT'`.as('type'),
            amount: schema.liquidationsAssociates.netLiquidationAmount,
            date: schema.liquidationsAssociates.liquidationDate,
            concept:
              sql<string>`CONCAT('Liquidacion Socio ', ${schema.liquidationsAssociates.customReference})`.as(
                'concept',
              ),
          })
          .from(schema.liquidationsAssociates)
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.liquidationsAssociates.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(schema.liquidationsAssociates.tenantId, tenantId),
              isNull(schema.liquidationsAssociates.payoutTransactionId),
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          );
        return rows;
      },
      loans: async () => {
        const rows = await this.db
          .select({
            id: schema.loans.id,
            type: sql<string>`'LOAN_DISBURSEMENT'`.as('type'),
            amount: schema.loans.disbursedAmount,
            date: schema.loans.disbursementDate,
            concept:
              sql<string>`CONCAT('Desembolso Prestamo N ', ${schema.loans.customReference})`.as(
                'concept',
              ),
          })
          .from(schema.loans)
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.loans.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(schema.loans.tenantId, tenantId),
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          );
        return rows;
      },
      loanPayments: async () => {
        const rows = await this.db
          .select({
            id: schema.loanPayments.id,
            type: sql<string>`'LOAN_PAYMENT'`.as('type'),
            amount: schema.loanPayments.amount,
            date: schema.loanPayments.paymentDate,
            concept:
              sql<string>`CONCAT('Pago Cuota Prestamo ', ${schema.loanPayments.customReference})`.as(
                'concept',
              ),
          })
          .from(schema.loanPayments)
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.loanPayments.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(schema.loanPayments.tenantId, tenantId),
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          );
        return rows;
      },
      credits: async () => {
        const rows = await this.db
          .select({
            id: schema.credits.id,
            type: sql<string>`'CREDIT_DISBURSEMENT'`.as('type'),
            amount: schema.credits.requestedAmount,
            date: schema.credits.approvalDate,
            concept:
              sql<string>`CONCAT('Desembolso Credito ', ${schema.credits.customReference})`.as(
                'concept',
              ),
          })
          .from(schema.credits)
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.credits.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(schema.credits.tenantId, tenantId),
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          );
        return rows;
      },
      creditPayments: async () => {
        const rows = await this.db
          .select({
            id: schema.creditPayments.id,
            type: sql<string>`'CREDIT_PAYMENT'`.as('type'),
            amount: schema.creditPayments.amount,
            date: schema.creditPayments.paymentDate,
            concept:
              sql<string>`CONCAT('Pago Credito ', ${schema.creditPayments.customReference})`.as(
                'concept',
              ),
          })
          .from(schema.creditPayments)
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.creditPayments.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(schema.creditPayments.tenantId, tenantId),
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          );
        return rows;
      },
      supplierPayments: async () => {
        const rows = await this.db
          .select({
            id: schema.supplierPaymentLines.id,
            type: sql<string>`'SUPPLIER_PAYMENT'`.as('type'),
            amount: schema.supplierPaymentLines.amount,
            date: schema.supplierPayments.bankTransactionDate,
            concept:
              sql<string>`CONCAT('Prov ', ${schema.suppliers.code}, ' - ', ${schema.accountsPayable.accountsPayableNumber})`.as(
                'concept',
              ),
          })
          .from(schema.supplierPaymentLines)
          .innerJoin(
            schema.supplierPayments,
            eq(
              schema.supplierPayments.id,
              schema.supplierPaymentLines.supplierPaymentId,
            ),
          )
          .innerJoin(
            schema.suppliers,
            eq(schema.suppliers.id, schema.supplierPayments.supplierId),
          )
          .innerJoin(
            schema.accountsPayable,
            eq(
              schema.accountsPayable.id,
              schema.supplierPaymentLines.accountsPayableId,
            ),
          )
          .leftJoin(
            schema.internalTransactionBankLinks,
            eq(
              schema.supplierPaymentLines.id,
              schema.internalTransactionBankLinks.internalRecordId,
            ),
          )
          .where(
            and(
              eq(schema.supplierPayments.tenantId, tenantId),
              isNull(schema.internalTransactionBankLinks.internalRecordId),
            ),
          );
        return rows;
      },
    };

    const queryFn = tableQueries[internalTable];
    if (!queryFn) {
      return { data: [], meta: emptyMeta };
    }

    let data = await queryFn();

    if (q) {
      const searchLower = q.toLowerCase();
      data = data.filter(
        (item) =>
          String(item.concept).toLowerCase().includes(searchLower) ||
          String(item.amount).toLowerCase().includes(searchLower) ||
          String(item.date).toLowerCase().includes(searchLower),
      );
    }

    if (startDate) {
      data = data.filter(
        (item) => item.date && new Date(item.date) >= startDate,
      );
    }
    if (endDate) {
      data = data.filter((item) => item.date && new Date(item.date) <= endDate);
    }

    const totalCount = data.length;
    const paginatedData = data.slice(offset, offset + limit);

    return {
      data: paginatedData,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async reconcile(
    bankTransactionId: string,
    dto: LinkToInternalDto,
    userId: string,
    tenantId: string,
    tx?: DrizzleDatabase,
  ) {
    const db = tx ?? this.db;

    const [mov] = await db
      .select()
      .from(schema.bankTransactions)
      .where(
        and(
          eq(schema.bankTransactions.id, bankTransactionId),
          eq(schema.bankTransactions.tenantId, tenantId),
        ),
      );

    if (!mov) throw new NotFoundException('Bank movement not found');
    if (mov.reconciliationStatus === 'RECONCILED') {
      throw new ConflictException('Movement already reconciled');
    }

    await db.insert(schema.internalTransactionBankLinks).values({
      tenantId,
      bankTransactionId,
      internalRecordType: dto.internalRecordType,
      internalRecordId: String(dto.internalRecordId),
      linkedBy: userId,
    } as typeof schema.internalTransactionBankLinks.$inferInsert);

    await db
      .update(schema.bankTransactions)
      .set({
        reconciliationStatus: 'RECONCILED',
        internalLinkStatus: 'LINKED',
      })
      .where(eq(schema.bankTransactions.id, bankTransactionId));

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'bank_transactions',
        recordId: bankTransactionId,
        description: `Bank movement reconciled with ${dto.internalRecordType} #${dto.internalRecordId}`,
        area: 'Treasury',
        newData: {
          internalRecordType: dto.internalRecordType,
          internalRecordId: dto.internalRecordId,
        },
        tenantId,
      }),
    );

    return { message: 'Reconciled successfully' };
  }

  async findInternalLink(bankTransactionId: string, tenantId: string) {
    const [link] = await this.db
      .select()
      .from(schema.internalTransactionBankLinks)
      .where(
        and(
          eq(
            schema.internalTransactionBankLinks.bankTransactionId,
            bankTransactionId,
          ),
          eq(schema.internalTransactionBankLinks.tenantId, tenantId),
        ),
      );

    if (!link) {
      throw new NotFoundException(
        `No link found for bank transaction ${bankTransactionId}`,
      );
    }
    return link;
  }

  async unlinkFromInternalRecord(bankTransactionId: string, tenantId: string) {
    const [link] = await this.db
      .delete(schema.internalTransactionBankLinks)
      .where(
        and(
          eq(
            schema.internalTransactionBankLinks.bankTransactionId,
            bankTransactionId,
          ),
          eq(schema.internalTransactionBankLinks.tenantId, tenantId),
        ),
      )
      .returning();

    if (!link) {
      throw new NotFoundException(
        `No link found for bank transaction ${bankTransactionId}`,
      );
    }

    await this.db
      .update(schema.bankTransactions)
      .set({ reconciliationStatus: 'PENDING', internalLinkStatus: 'UNLINKED' })
      .where(eq(schema.bankTransactions.id, bankTransactionId));

    return { message: 'Unlinked successfully' };
  }

  async reverse(
    bankTransactionId: string,
    dto: ReverseMovementDto,
    userId: string,
    tenantId: string,
  ) {
    return this.db.transaction(async (tx) => {
      const [orig] = await tx
        .select()
        .from(schema.bankTransactions)
        .where(
          and(
            eq(schema.bankTransactions.id, bankTransactionId),
            eq(schema.bankTransactions.tenantId, tenantId),
          ),
        );

      if (!orig) throw new NotFoundException('Bank movement not found');
      if (orig.reconciliationStatus !== 'RECONCILED') {
        throw new ConflictException(
          'Only reconciled movements can be reversed',
        );
      }

      const [rev] = await tx
        .insert(schema.bankTransactions)
        .values({
          tenantId,
          bankAccountId: orig.bankAccountId,
          transactionDate: dto.valueDate.toISOString().split('T')[0],
          valueDate: dto.valueDate.toISOString().split('T')[0],
          description: `Reversal de ${orig.description}`,
          category: orig.category,
          bankReference: orig.bankReference ? `${orig.bankReference}-R` : null,
          debitAmount: orig.creditAmount,
          creditAmount: orig.debitAmount,
          paymentMethod: orig.paymentMethod,
          note: dto.reason ?? 'Reversion usuario',
          createdById: userId,
        })
        .returning();

      await tx
        .delete(schema.internalTransactionBankLinks)
        .where(
          and(
            eq(
              schema.internalTransactionBankLinks.bankTransactionId,
              bankTransactionId,
            ),
            eq(schema.internalTransactionBankLinks.tenantId, tenantId),
          ),
        );

      await tx
        .update(schema.bankTransactions)
        .set({
          reconciliationStatus: 'PENDING',
          internalLinkStatus: 'UNLINKED',
        })
        .where(eq(schema.bankTransactions.id, bankTransactionId));

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          userId,
          action: 'INSERT',
          tableName: 'bank_transactions',
          recordId: rev.id,
          description: `Movement reversed: ${rev.description}`,
          area: 'Treasury',
          newData: { originalId: bankTransactionId, reversalId: rev.id },
          tenantId,
        }),
      );

      return {
        originalId: bankTransactionId,
        reversalId: rev.id,
        message: 'Movement reversed successfully',
      };
    });
  }
}
