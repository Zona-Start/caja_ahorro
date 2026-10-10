import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associateAccounts,
  associates,
  credits,
  loans,
  reimbursementDetails,
  reimbursements,
} from '@/database/schema';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CurrencyCodeEnum,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../parnerts/associate-accounts-movements/associate-accounts-movements.service';
import {
  CreateReimbursementDto,
  FilterReimbursementDto,
} from './dto/reimbursement.schema';
import { ReimbursementAccountingService } from './reimbursement-accounting.service';

export interface ExcessItem {
  originType: 'LOAN' | 'CREDIT' | 'WITHDRAWAL';
  originId: string | null;
  originReference: string | null;
  originTypeName: string | null;
  amount: number;
}

@Injectable()
export class ReimbursementService implements OnModuleInit {
  private bankMovementsService: BankMovementsService;
  private readonly logger = new Logger(ReimbursementService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly moduleRef: ModuleRef,
    private readonly generateCodeService: GenerateCodeService,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly accountingService: ReimbursementAccountingService,
  ) {}

  onModuleInit() {
    this.bankMovementsService = this.moduleRef.get(BankMovementsService, {
      strict: false,
    });
  }

  private async resolveAssociate(
    tenantId: string,
    associateId?: string,
    cedula?: string,
  ) {
    if (!associateId && !cedula) {
      throw new BadRequestException('Debe indicar associateId o cédula.');
    }
    const [assoc] = await this.db
      .select({
        id: associates.id,
        cedula: associates.cedula,
        fullname: associates.fullname,
        status: associates.status,
        accountId: associateAccounts.id,
        currencyCode: associateAccounts.currencyCode,
      })
      .from(associates)
      .leftJoin(
        associateAccounts,
        and(
          eq(associateAccounts.associateId, associates.id),
          eq(associateAccounts.status, 'ACTIVE'),
        ),
      )
      .where(
        and(
          eq(associates.tenantId, tenantId),
          associateId
            ? eq(associates.id, associateId)
            : eq(associates.cedula, cedula!),
        ),
      )
      .limit(1);

    if (!assoc) {
      throw new NotFoundException('Asociado no encontrado.');
    }
    return assoc;
  }

  /**
   * Saldos a favor pendientes por origen (préstamo, crédito, retiro).
   * Se calculan desde los MOVIMIENTOS de reversión acumulados por origen
   * (no desde `balance_in_favor`, que solo guarda el último ajuste), menos
   * lo ya reintegrado.
   */
  async getExcesses(tenantId: string, cedula: string) {
    const assoc = await this.resolveAssociate(tenantId, undefined, cedula);
    const items: ExcessItem[] = [];

    if (!assoc.accountId) {
      return {
        associate: {
          id: assoc.id,
          cedula: assoc.cedula,
          fullname: assoc.fullname,
          accountId: assoc.accountId,
          currencyCode: assoc.currencyCode,
        },
        items,
        total: 0,
      };
    }

    const { rows: grouped } = (await this.db.execute(sql`
      SELECT movement_type, reference_id, SUM(amount)::numeric AS total
      FROM savings.associate_account_movements
      WHERE associate_account_id = ${assoc.accountId}
        AND status = 'COMPLETED'
        AND movement_type IN (
          'LOAN_PAYMENT_REVERSAL_CREDIT',
          'CREDIT_PAYMENT_REVERSAL_CREDIT',
          'SAVING_WITHDRAWAL_REVERSAL_CREDIT'
        )
      GROUP BY movement_type, reference_id
    `)) as unknown as {
      rows: {
        movement_type: string;
        reference_id: string | null;
        total: string;
      }[];
    };

    for (const g of grouped) {
      const total = Number(g.total ?? 0);
      if (total <= 0.001) continue;

      const originType: ExcessItem['originType'] =
        g.movement_type === 'LOAN_PAYMENT_REVERSAL_CREDIT'
          ? 'LOAN'
          : g.movement_type === 'CREDIT_PAYMENT_REVERSAL_CREDIT'
            ? 'CREDIT'
            : 'WITHDRAWAL';
      const originId = g.reference_id ?? null;

      // Lo ya reintegrado por este origen.
      const { rows: refundedRows } = (await this.db.execute(sql`
        SELECT COALESCE(SUM(rd.amount), 0)::numeric AS total
        FROM savings.reimbursement_details rd
        JOIN savings.reimbursements re ON re.id = rd.reimbursement_id
        WHERE re.tenant_id = ${tenantId}
          AND re.status IN ('PROCESSED','DISBURSED')
          AND rd.origin_type = ${originType}
          AND rd.origin_id IS NOT DISTINCT FROM ${originId}
      `)) as unknown as { rows: { total: string }[] };
      const pending = total - Number(refundedRows[0]?.total ?? 0);
      if (pending <= 0.001) continue;

      // Referencia y tipo del origen.
      let originReference: string | null = null;
      let originTypeName: string | null = null;
      if (originType === 'LOAN' && originId) {
        const [row] = await this.db
          .select({
            ref: loans.customReference,
            name: schema.loanTypes.name,
          })
          .from(loans)
          .leftJoin(schema.loanTypes, eq(schema.loanTypes.id, loans.loanTypeId))
          .where(eq(loans.id, originId));
        originReference = row?.ref ?? null;
        originTypeName = row?.name ?? null;
      } else if (originType === 'CREDIT' && originId) {
        const [row] = await this.db
          .select({
            ref: credits.customReference,
            name: schema.creditsTypes.name,
          })
          .from(credits)
          .leftJoin(
            schema.creditsTypes,
            eq(schema.creditsTypes.id, credits.creditTypeId),
          )
          .where(eq(credits.id, originId));
        originReference = row?.ref ?? null;
        originTypeName = row?.name ?? null;
      } else {
        originReference = originId;
        originTypeName = 'Retiro';
      }

      items.push({
        originType,
        originId,
        originReference,
        originTypeName,
        amount: pending,
      });
    }

    return {
      associate: {
        id: assoc.id,
        cedula: assoc.cedula,
        fullname: assoc.fullname,
        accountId: assoc.accountId,
        currencyCode: assoc.currencyCode,
      },
      items,
      total: items.reduce((s, i) => s + i.amount, 0),
    };
  }

  async create(tenantId: string, userId: string, dto: CreateReimbursementDto) {
    const assoc = await this.resolveAssociate(
      tenantId,
      dto.associateId,
      dto.cedula,
    );
    if (!assoc.accountId) {
      throw new BadRequestException('El asociado no tiene cuenta activa.');
    }
    if (assoc.status !== 'ACTIVE' && assoc.status !== 'PENDING') {
      throw new BadRequestException('El asociado no está activo.');
    }

    const excesses = await this.getExcesses(tenantId, assoc.cedula);
    const total = dto.items.reduce((s, i) => s + Number(i.amount), 0);

    // Validar que cada origen exista y el monto no supere el pendiente.
    for (const item of dto.items) {
      const match = excesses.items.find(
        (e) =>
          e.originType === item.originType &&
          ((item.originId && e.originId === item.originId) ||
            (item.originReference &&
              e.originReference === item.originReference)),
      );
      if (!match) {
        throw new BadRequestException(
          `No hay saldo a favor pendiente para ${item.originType} ${item.originReference ?? item.originId ?? ''}.`,
        );
      }
      if (Number(item.amount) > match.amount + 0.01) {
        throw new BadRequestException(
          `El monto (${item.amount}) supera el saldo a favor pendiente (${match.amount}) de ${item.originType}.`,
        );
      }
    }

    const customReference =
      await this.generateCodeService.generateNextReference(
        'REI',
        tenantId,
        'savings',
        'reimbursements',
      );

    const result = await this.db.transaction(async (tx) => {
      const [reimbursement] = await tx
        .insert(reimbursements)
        .values({
          tenantId,
          associateId: assoc.id,
          associateAccountId: assoc.accountId,
          currencyCode: (assoc.currencyCode as CurrencyCodeEnum) ?? 'VES',
          destination: dto.destination,
          totalAmount: String(total.toFixed(6)),
          status: 'REQUESTED',
          bankId: dto.bankId ?? null,
          transactionReference: dto.transactionReference ?? null,
          comment: dto.comment ?? null,
          customReference,
          createdById: userId,
          updatedById: userId,
        })
        .returning({
          id: reimbursements.id,
          customReference: reimbursements.customReference,
        });

      await tx.insert(reimbursementDetails).values(
        dto.items.map((i) => ({
          reimbursementId: reimbursement.id,
          originType: i.originType,
          originId: i.originId ?? null,
          originReference: i.originReference ?? null,
          amount: String(Number(i.amount).toFixed(6)),
          createdById: userId,
          updatedById: userId,
        })),
      );

      return reimbursement;
    });

    return {
      message: 'Solicitud de reintegro creada.',
      reimbursement: result,
    };
  }

  async approve(tenantId: string, userId: string, id: string) {
    return this.db.transaction(async (tx) => {
      const [r] = await this.lockReimbursement(tx, tenantId, id);
      if (!r) throw new NotFoundException('Reintegro no encontrado.');
      if (r.status !== 'REQUESTED') {
        throw new BadRequestException(
          `El reintegro no está en estado SOLICITADO (actual: ${r.status}).`,
        );
      }
      await tx
        .update(reimbursements)
        .set({
          status: 'APPROVED',
          approvedById: userId,
          approvedAt: new Date(),
          updatedById: userId,
        })
        .where(eq(reimbursements.id, id));
      return { message: 'Reintegro aprobado.' };
    });
  }

  /** Transferencia a haberes: procesa (crea movimientos + asiento). */
  async process(tenantId: string, userId: string, id: string) {
    return this.db.transaction(async (tx) => {
      const locked = await this.lockReimbursement(tx, tenantId, id);
      const r = locked[0];
      if (!r) throw new NotFoundException('Reintegro no encontrado.');
      if (r.destination !== 'SAVINGS') {
        throw new BadRequestException(
          'Este reintegro es en efectivo: use desembolsar.',
        );
      }
      if (r.status !== 'APPROVED') {
        throw new BadRequestException(
          `El reintegro debe estar APROBADO (actual: ${r.status}).`,
        );
      }

      const details = await this.getDetails(tx, id);
      const total = details.reduce((s, d) => s + Number(d.amount), 0);

      // Movimientos: débito por origen (cancelación saldo a favor) + crédito haberes.
      for (const d of details) {
        await this.associateAccountsMovementsService.create(
          userId,
          {
            associateAccountId: r.associateAccountId,
            movementType: 'ADJUSTMENT_DEBIT' as AssociateMovementTypeEnum,
            amount: Number(d.amount),
            currencyCode: r.currencyCode,
            transactionDate: new Date(),
            description: this.detailDescription(d),
            referenceId: id,
            referenceType: 'reimbursements',
            referenceNumber: r.customReference,
            area: 'REINTEGROS',
          },
          tenantId,
          tx,
        );
      }

      await this.associateAccountsMovementsService.create(
        userId,
        {
          associateAccountId: r.associateAccountId,
          movementType: 'VOLUNTARY_SAVINGS' as AssociateMovementTypeEnum,
          amount: total,
          currencyCode: r.currencyCode,
          transactionDate: new Date(),
          description: `Reintegro de saldo a favor a haberes Nº ${r.customReference}`,
          referenceId: id,
          referenceType: 'reimbursements',
          referenceNumber: r.customReference,
          area: 'REINTEGROS',
        },
        tenantId,
        tx,
      );

      await this.applyAccountingAndZero(tx, tenantId, userId, r, details);

      await tx
        .update(reimbursements)
        .set({
          status: 'PROCESSED',
          processedById: userId,
          processedAt: new Date(),
          updatedById: userId,
        })
        .where(eq(reimbursements.id, id));

      return { message: 'Reintegro procesado a haberes.' };
    });
  }

  /** Devolución en efectivo: desembolsa (movimientos + banco opcional + asiento). */
  async disburse(
    tenantId: string,
    userId: string,
    id: string,
    dto?: {
      bankId?: string;
      transactionReference?: string;
      paymentDate?: string;
    },
  ) {
    return this.db.transaction(async (tx) => {
      const locked = await this.lockReimbursement(tx, tenantId, id);
      const r = locked[0];
      if (!r) throw new NotFoundException('Reintegro no encontrado.');
      if (r.destination !== 'CASH') {
        throw new BadRequestException(
          'Este reintegro es a haberes: use procesar.',
        );
      }
      if (r.status !== 'APPROVED') {
        throw new BadRequestException(
          `El reintegro debe estar APROBADO (actual: ${r.status}).`,
        );
      }

      const details = await this.getDetails(tx, id);
      const total = details.reduce((s, d) => s + Number(d.amount), 0);
      const bankId = dto?.bankId ?? r.bankId;
      const transactionReference =
        dto?.transactionReference ?? r.transactionReference;

      for (const d of details) {
        await this.associateAccountsMovementsService.create(
          userId,
          {
            associateAccountId: r.associateAccountId,
            movementType: 'ADJUSTMENT_DEBIT' as AssociateMovementTypeEnum,
            amount: Number(d.amount),
            currencyCode: r.currencyCode,
            transactionDate: new Date(),
            description: this.detailDescription(d),
            referenceId: id,
            referenceType: 'reimbursements',
            referenceNumber: r.customReference,
            area: 'REINTEGROS',
          },
          tenantId,
          tx,
        );
      }

      // Movimiento bancario OPCIONAL.
      if (bankId) {
        await this.bankMovementsService.createAndReconcile(
          {
            movement: {
              bankAccountId: bankId,
              transactionDate: dto?.paymentDate
                ? new Date(dto.paymentDate)
                : new Date(),
              paymentMethod: 'BANK_TRANSFER' as never,
              description: `Reintegro de saldo a favor Nº ${r.customReference}`,
              bankReference: transactionReference ?? undefined,
              category: BankTransactionCategory.MEMBER_WITHDRAWAL,
              creditAmount: 0,
              debitAmount: total,
            },
            links: [
              {
                internalRecordType: 'REIMBURSEMENT',
                internalRecordId: id,
              },
            ],
          },
          userId,
          tenantId,
          tx,
        );
      }

      await this.applyAccountingAndZero(tx, tenantId, userId, r, details);

      await tx
        .update(reimbursements)
        .set({
          status: 'DISBURSED',
          bankId: bankId ?? null,
          transactionReference: transactionReference ?? null,
          disbursedById: userId,
          disbursedAt: new Date(),
          updatedById: userId,
        })
        .where(eq(reimbursements.id, id));

      return { message: 'Reintegro desembolsado.' };
    });
  }

  private async applyAccountingAndZero(
    tx: NodePgDatabase<typeof schema>,
    tenantId: string,
    userId: string,
    r: typeof reimbursements.$inferSelect,
    details: (typeof reimbursementDetails.$inferSelect)[],
  ) {
    // Asiento contable.
    await this.accountingService.generateEntry(
      tenantId,
      userId,
      r.associateId,
      {
        module: 'savings',
        destination: r.destination as 'SAVINGS' | 'CASH',
        lines: details.map((d) => ({
          originType: d.originType as 'LOAN' | 'CREDIT' | 'WITHDRAWAL',
          originTypeName: null,
          amount: Number(d.amount),
        })),
        entryDate: new Date(),
        currencyCode: r.currencyCode as CurrencyCodeEnum,
        originReferenceId: r.id,
        description: `Reintegro de saldo a favor Nº ${r.customReference ?? r.id}`,
      },
      tx,
    );

    // Poner el saldo a favor en 0 por origen (préstamo / crédito).
    const loanIds = details
      .filter((d) => d.originType === 'LOAN' && d.originId)
      .map((d) => d.originId!);
    if (loanIds.length) {
      await tx
        .update(loans)
        .set({ balanceInFavor: '0', updatedById: userId })
        .where(and(eq(loans.tenantId, tenantId), inArray(loans.id, loanIds)));
    }
    const creditIds = details
      .filter((d) => d.originType === 'CREDIT' && d.originId)
      .map((d) => d.originId!);
    if (creditIds.length) {
      await tx
        .update(credits)
        .set({ balanceInFavor: '0', updatedById: userId })
        .where(
          and(eq(credits.tenantId, tenantId), inArray(credits.id, creditIds)),
        );
    }
  }

  private detailDescription(d: typeof reimbursementDetails.$inferSelect) {
    const originLabel =
      d.originType === 'LOAN'
        ? 'Préstamo'
        : d.originType === 'CREDIT'
          ? 'Crédito'
          : 'Retiro';
    return `Reintegro saldo a favor - ${originLabel} ${d.originReference ?? d.originId ?? ''}`.trim();
  }

  private async getDetails(tx: NodePgDatabase<typeof schema>, id: string) {
    return tx
      .select()
      .from(reimbursementDetails)
      .where(eq(reimbursementDetails.reimbursementId, id));
  }

  private async lockReimbursement(
    tx: NodePgDatabase<typeof schema>,
    tenantId: string,
    id: string,
  ) {
    return tx
      .select()
      .from(reimbursements)
      .where(
        and(eq(reimbursements.id, id), eq(reimbursements.tenantId, tenantId)),
      )
      .for('update');
  }

  async findAll(tenantId: string, filter: FilterReimbursementDto) {
    const { page = 1, limit = 10, search = '', status = '' } = filter;
    const offset = (page - 1) * limit;

    const conditions = [eq(reimbursements.tenantId, tenantId)];
    if (search) {
      conditions.push(ilike(reimbursements.customReference, `%${search}%`));
    }
    if (status) {
      conditions.push(sql`${reimbursements.status}::text = ${status}`);
    }
    const where = and(...conditions);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(reimbursements)
      .where(where);

    const data = await this.db
      .select({
        id: reimbursements.id,
        customReference: reimbursements.customReference,
        associateId: reimbursements.associateId,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        destination: reimbursements.destination,
        totalAmount: reimbursements.totalAmount,
        status: reimbursements.status,
        currencyCode: reimbursements.currencyCode,
        createdAt: reimbursements.createdAt,
      })
      .from(reimbursements)
      .leftJoin(associates, eq(associates.id, reimbursements.associateId))
      .where(where)
      .orderBy(desc(reimbursements.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: data.map((r) => ({
        ...r,
        totalAmount: Number(r.totalAmount).toFixed(2),
      })),
      meta: {
        totalItems: Number(count),
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(Number(count) / limit),
        currentPage: page,
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const [r] = await this.db
      .select()
      .from(reimbursements)
      .where(
        and(eq(reimbursements.id, id), eq(reimbursements.tenantId, tenantId)),
      );
    if (!r) throw new NotFoundException('Reintegro no encontrado.');
    const details = await this.getDetails(this.db, id);
    return { ...r, details };
  }
}
