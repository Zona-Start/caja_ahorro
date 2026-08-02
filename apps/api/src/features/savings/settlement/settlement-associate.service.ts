import { PaginationDto } from '@/common/dto/pagination.dto';
import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  associateAccounts,
  associateAccountMovements,
  associates,
  bankTransactions,
  creditAmortizationSchedule,
  creditPayments,
  creditPaymentsDetails,
  credits,
  internalTransactionBankLinks,
  liquidationsAssociates,
  loanAmortizationSchedule,
  loanPayments,
  loanPaymentsDetails,
  loans,
} from '@/database/schema';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import { AssociateMovementTypeEnum, CurrencyCodeEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, eq, ilike, inArray, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../parnerts/associate-accounts-movements/associate-accounts-movements.service';
import {
  CreateSettlementAssociateDto,
  DisburseSettlementAssociateDto,
} from './dto/settlement.schema';
import { SavingsLiquidationService } from './liquidation.service';

@Injectable()
export class SettlementAssociateService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly eventEmitter: EventEmitter2,
    private readonly savingsLiquidationService: SavingsLiquidationService,
  ) { }

  async findOneRequest(tenantId: string, cedula: string) {
    const result = await this.db
      .select()
      .from(associates)
      .where(
        and(eq(associates.cedula, cedula), eq(associates.tenantId, tenantId)),
      );

    if (!result.length) {
      throw new NotFoundException(`Associate with cedula ${cedula} not found`);
    }
    if (result[0].status === 'INACTIVE') {
      throw new BadRequestException(
        `Associate with cedula ${cedula} is inactive`,
      );
    }

    if (result[0].status === 'RETIRED') {
      throw new BadRequestException(`Associate with cedula ${cedula} is retired`);
    }

    const resultLiquidations =
      await this.savingsLiquidationService.calculateAssociateLiquidation(cedula);

    return {
      message: 'Datos de liquidacion calculados',
      data: resultLiquidations,
    };
  }

  async create(
    tenantId: string,
    userId: string,
    dto: CreateSettlementAssociateDto,
  ) {
    const { associateId, notes, date, beneficiary } = dto;

    return this.db.transaction(async (tx) => {
      const [associate] = await tx
        .select({
          id: associates.id,
          cedula: associates.cedula,
          status: associates.status,
        })
        .from(associates)
        .where(
          and(
            eq(associates.id, associateId),
            eq(associates.tenantId, tenantId),
          ),
        );

      if (!associate?.id) {
        throw new NotFoundException(`Asociado no encontrado.`);
      }

      if (associate.status !== 'ACTIVE') {
        throw new BadRequestException(
          `El asociado con cédula '${associate.cedula}' no está activo para ser liquidado (estado actual: ${associate.status}).`,
        );
      }

      const [existingLiquidation] = await tx
        .select()
        .from(liquidationsAssociates)
        .where(
          and(
            eq(liquidationsAssociates.associateId, associateId),
            eq(liquidationsAssociates.status, 'REQUESTED'),
            eq(liquidationsAssociates.tenantId, tenantId),
          ),
        );

      if (existingLiquidation) {
        throw new BadRequestException(
          `Ya existe una solicitud de liquidación pendiente para este asociado.`,
        );
      }

      const reference = await this.generateCodeService.generateNextReference(
        'RH-LIQ',
        tenantId,
        'savings',
        'settlement',
        tx,
      );

      const liq =
        await this.savingsLiquidationService.calculateAssociateLiquidation(
          associate.cedula,
        );

      const [newLiquidationRequest] = await tx
        .insert(liquidationsAssociates)
        .values({
          tenantId,
          associateId: associateId,
          liquidationDate: new Date(date).toISOString().split('T')[0],
          currencyCode: 'VES' as CurrencyCodeEnum,
          totalSavingsBalanceAtLiquidation: String(
            liq.total_savings_balance,
          ),
          totalOutstandingLoansAtLiquidation: String(
            liq.total_outstanding_loans,
          ),
          totalOutstandingCreditsAtLiquidation: String(
            liq.total_outstanding_credits,
          ),
          netLiquidationAmount: String(liq.net_liquidation_amount),
          status: 'REQUESTED',
          notes: notes,
          beneficiary: beneficiary ?? null,
          createdById: userId,
          customReference: reference,
        })
        .returning({
          id: liquidationsAssociates.id,
          customReference: liquidationsAssociates.customReference,
        });

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          userId,
          action: 'INSERT',
          tableName: 'liquidationsAssociates',
          recordId: newLiquidationRequest.id,
          description: `Solicitud de Liquidación de Asociado`,
          area: 'Liquidacion',
          newData: [{ ...dto, status: 'REQUESTED', customReference: reference }],
          tenantId,
        }),
      );

      return {
        message: `Solicitud de liquidación creada exitosamente.`,
        liquidation: newLiquidationRequest,
      };
    });
  }

  async approve(tenantId: string, userId: string, liquidationId: string) {
    return this.db.transaction(async (tx) => {
      const [liquidation] = await tx
        .select()
        .from(liquidationsAssociates)
        .where(
          and(
            eq(liquidationsAssociates.id, liquidationId),
            eq(liquidationsAssociates.tenantId, tenantId),
          ),
        );

      if (!liquidation) {
        throw new NotFoundException(
          `Solicitud de liquidación con ID ${liquidationId} no encontrada.`,
        );
      }

      if (liquidation.status !== 'REQUESTED') {
        throw new BadRequestException(
          `La liquidación no está en estado 'SOLICITADO'. Estado actual: ${liquidation.status}.`,
        );
      }

      const [associate] = await tx
        .select({
          id: associates.id,
          cedula: associates.cedula,
          fullname: associates.fullname,
          status: associates.status,
          associateAccountId: associateAccounts.id,
        })
        .from(associates)
        .leftJoin(
          associateAccounts,
          eq(associateAccounts.associateId, associates.id),
        )
        .where(
          and(
            eq(associates.id, liquidation.associateId),
            eq(associates.tenantId, tenantId),
          ),
        );

      if (!associate?.id) {
        throw new NotFoundException(
          `Asociado no encontrado para esta liquidación.`,
        );
      }

      const accountId = associate.associateAccountId;
      const processedDate = new Date();

      const totalSavings = Number(liquidation.totalSavingsBalanceAtLiquidation);
      const totalLoans = Number(liquidation.totalOutstandingLoansAtLiquidation);
      const totalCredits = Number(liquidation.totalOutstandingCreditsAtLiquidation);
      const netAmount = Number(liquidation.netLiquidationAmount);

      // 1. Pay off outstanding loans from savings
      if (totalLoans > 0) {
        const outstandingLoans = await tx
          .select({
            loanId: schema.loanOutstandingBalance.loanId,
            outstandingTotal: schema.loanOutstandingBalance.outstandingTotalBalance,
          })
          .from(schema.loanOutstandingBalance)
          .where(
            eq(schema.loanOutstandingBalance.associateId, liquidation.associateId),
          );

        for (const loan of outstandingLoans) {
          const loanBalance = Number(loan.outstandingTotal);
          if (loanBalance <= 0) continue;

          const pendingInstallments = await tx
            .select({
              id: loanAmortizationSchedule.id,
              totalAmount: loanAmortizationSchedule.totalInstallmentAmount,
              paidAmount: loanAmortizationSchedule.paidAmount,
            })
            .from(loanAmortizationSchedule)
            .where(
              and(
                eq(loanAmortizationSchedule.loanId, loan.loanId),
                inArray(loanAmortizationSchedule.paymentStatus, [
                  'PENDING',
                  'PARTIAL',
                ]),
              ),
            )
            .orderBy(loanAmortizationSchedule.installmentNumber);

          const paymentRef =
            await this.generateCodeService.generateNextReference(
              'PRE-PAG',
              tenantId,
              'portfolio',
              'loan-payments',
              tx,
            );

          const [loanPayment] = await tx
            .insert(loanPayments)
            .values({
              tenantId,
              loanId: loan.loanId,
              paymentDate: processedDate,
              paymentType: 'PAYING',
              amount: String(loanBalance),
              balancePending: '0',
              bankId: null,
              paymentMethod: 'BANK_TRANSFER',
              status: 'DONE',
              comment: `Cancelacion total por Liquidacion #${liquidation.customReference ?? liquidationId}`,
              customReference: paymentRef,
              createdById: userId,
            })
            .returning({ id: loanPayments.id });

          for (const inst of pendingInstallments) {
            const installmentOwed = Number(inst.totalAmount) - Number(inst.paidAmount || 0);

            await tx.insert(loanPaymentsDetails).values({
              loanPaymentId: loanPayment.id,
              installmentId: inst.id,
              amount: String(installmentOwed),
              status: 'DONE',
              createdById: userId,
            });

            await tx
              .update(loanAmortizationSchedule)
              .set({
                paymentStatus: 'PAID',
                paidAmount: sql`total_installment_amount`,
                updatedById: userId,
              })
              .where(eq(loanAmortizationSchedule.id, inst.id));
          }

          await tx
            .update(loans)
            .set({
              status: 'PAID',
              updatedById: userId,
            })
            .where(eq(loans.id, loan.loanId));

          if (accountId) {
            await this.associateAccountsMovementsService.create(
              userId,
              {
                associateAccountId: accountId,
                movementType:
                  'LIQUIDATION_LOAN_PAYMENT_DEBIT' as AssociateMovementTypeEnum,
                amount: loanBalance,
                currencyCode: 'VES' as CurrencyCodeEnum,
                transactionDate: processedDate,
                description: `Cancelacion de Prestamo por Liquidacion Total`,
                referenceId: liquidation.id,
                referenceType: 'liquidationsAssociates',
                area: 'LIQUIDACION',
              },
              tenantId,
            );
          }
        }
      }

      // 2. Pay off outstanding credits from savings
      if (totalCredits > 0) {
        const outstandingCredits = await tx
          .select({
            creditId: schema.creditOutstandingBalance.creditId,
            outstandingTotal:
              schema.creditOutstandingBalance.outstandingTotalBalance,
          })
          .from(schema.creditOutstandingBalance)
          .where(
            eq(
              schema.creditOutstandingBalance.associateId,
              liquidation.associateId,
            ),
          );

        for (const credit of outstandingCredits) {
          const creditBalance = Number(credit.outstandingTotal);
          if (creditBalance <= 0) continue;

          const pendingInstallments = await tx
            .select({
              id: creditAmortizationSchedule.id,
              totalAmount: creditAmortizationSchedule.totalInstallmentAmount,
              paidAmount: creditAmortizationSchedule.paidAmount,
            })
            .from(creditAmortizationSchedule)
            .where(
              and(
                eq(creditAmortizationSchedule.creditId, credit.creditId),
                inArray(creditAmortizationSchedule.paymentStatus, [
                  'PENDING',
                  'PARTIAL',
                ]),
              ),
            )
            .orderBy(creditAmortizationSchedule.installmentNumber);

          const paymentRef =
            await this.generateCodeService.generateNextReference(
              'CRE-PAG',
              tenantId,
              'portfolio',
              'credit-payments',
              tx,
            );



          const [creditPayment] = await tx
            .insert(creditPayments)
            .values({
              tenantId,
              creditId: credit.creditId,
              paymentDate: processedDate,
              paymentType: 'PAYING',
              amount: String(creditBalance),
              balancePending: '0',
              bankId: null,
              paymentMethod: 'BANK_TRANSFER',
              comment: `Cancelacion total por Liquidacion #${liquidation.customReference ?? liquidationId}`,
              customReference: paymentRef,
              status: 'DONE',
              createdById: userId,
            })
            .returning({ id: creditPayments.id });


          for (const inst of pendingInstallments) {
            const installmentOwed = Number(inst.totalAmount) - Number(inst.paidAmount || 0);

            await tx.insert(creditPaymentsDetails).values({
              creditPaymentId: creditPayment.id,
              installmentId: inst.id,
              amount: String(installmentOwed),
              createdById: userId,
            });

            await tx
              .update(creditAmortizationSchedule)
              .set({
                paymentStatus: 'PAID',
                paidAmount: sql`total_installment_amount`,
                updatedById: userId,
              })
              .where(eq(creditAmortizationSchedule.id, inst.id));
          }
          await tx
            .update(credits)
            .set({
              status: 'PAID',
              updatedById: userId,
            })
            .where(eq(credits.id, credit.creditId));

          if (accountId) {
            await this.associateAccountsMovementsService.create(
              userId,
              {
                associateAccountId: accountId,
                movementType:
                  'LIQUIDATION_COMMERCIAL_CREDIT_PAYMENT_DEBIT' as AssociateMovementTypeEnum,
                amount: creditBalance,
                currencyCode: 'VES' as CurrencyCodeEnum,
                transactionDate: processedDate,
                description: `Cancelacion de Credito por Liquidacion Total`,
                referenceId: liquidation.id,
                referenceType: 'liquidationsAssociates',
                area: 'LIQUIDACION',
              },
              tenantId,
            );
          }
        }
      }

      // 3. Create the net liquidation movement
      if (accountId && netAmount > 0) {
        try {
          await this.associateAccountsMovementsService.create(
            userId,
            {
              associateAccountId: accountId,
              movementType: 'LIQUIDATION_BALANCE' as AssociateMovementTypeEnum,
              amount: netAmount,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: processedDate,
              description: 'Liquidacion total de Haberes',
              referenceId: liquidation.id,
              referenceType: 'liquidationsAssociates',
              area: 'LIQUIDACION',
            },
            tenantId,
          );
        } catch (error) {
          throw new InternalServerErrorException(
            `Error al generar el movimiento de la liquidacion.`,
          );
        }
      }

      // 4. Mark associate as RETIRED
      await tx
        .update(associates)
        .set({
          status: 'RETIRED',
          updatedById: userId,
        })
        .where(eq(associates.id, liquidation.associateId));

      // 4.1 Mark associate account as RETIRED with closing date
      if (accountId) {
        await tx
          .update(associateAccounts)
          .set({
            status: 'RETIRED',
            closingDate: processedDate.toISOString().split('T')[0],
            updatedById: userId,
          })
          .where(eq(associateAccounts.id, accountId));
      }

      // 5. Update liquidation status
      await tx
        .update(liquidationsAssociates)
        .set({
          status: 'PROCESSED',
          updatedById: userId,
        })
        .where(
          and(
            eq(liquidationsAssociates.id, liquidationId),
            eq(liquidationsAssociates.tenantId, tenantId),
          ),
        );

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          userId,
          action: 'UPDATE',
          tableName: 'liquidationsAssociates',
          recordId: liquidationId,
          description: `Procesamiento y Aprobación de Liquidación de Asociado`,
          area: 'Liquidacion',
          newData: [{ ...liquidation, status: 'PROCESSED' }],
          tenantId,
        }),
      );

      return {
        message: `Liquidación procesada exitosamente. El asociado ha sido retirado.`,
        liquidationId: liquidation.id,
      };
    });
  }

  async disburse(
    tenantId: string,
    userId: string,
    liquidationId: string,
    dto: DisburseSettlementAssociateDto,
    tx?: any,
    skipBankTransaction = false,
  ) {
    const executeInTransaction = async (trx: any) => {
      const [liquidation] = await trx
        .select()
        .from(liquidationsAssociates)
        .leftJoin(
          associates,
          eq(liquidationsAssociates.associateId, associates.id),
        )
        .where(
          and(
            eq(liquidationsAssociates.id, liquidationId),
            eq(liquidationsAssociates.tenantId, tenantId),
          ),
        );

      if (!liquidation) {
        throw new NotFoundException(
          `Liquidación con ID ${liquidationId} no encontrada.`,
        );
      }

      if (
        liquidation.liquidations_associates.status !== 'PROCESSED' &&
        liquidation.liquidations_associates.status !==
        'PENDING_DISBURSEMENT_BANK_BATCH'
      ) {
        throw new BadRequestException(
          `Solo se pueden desembolsar liquidaciones en estado 'PROCESADO' o en lote de pago.`,
        );
      }

      const netAmount = Number(
        liquidation.liquidations_associates.netLiquidationAmount,
      );

      let bankTransactionId: string | null = null;
      if (!skipBankTransaction) {
        const internalCode =
          await this.generateCodeService.generateNextReference(
            'MB',
            tenantId,
            'banking',
            'bank_transactions',
            trx,
          );

        const [bankTransaction] = await trx
          .insert(bankTransactions)
          .values({
            tenantId,
            bankAccountId: dto.bankAccountId,
            paymentMethod: 'BANK_TRANSFER',
            transactionDate: dto.transferDate.toISOString().split('T')[0],
            description: `Liquidación Final - Socio - ${liquidation.associates?.fullname}`,
            internalCode,
            category: 'PAYROLL_SETTLEMENT',
            bankReference: dto.bankReference,
            creditAmount: netAmount.toString(),
            debitAmount: '0.00',
            reconciliationStatus: 'PENDING',
            internalLinkStatus: 'LINKED',
            createdById: userId,
          })
          .returning({ id: bankTransactions.id });

        await trx.insert(internalTransactionBankLinks).values({
          tenantId,
          bankTransactionId: bankTransaction.id,
          internalRecordType: 'PAYROLL_SETTLEMENT',
          internalRecordId: liquidationId,
          linkedBy: userId,
          createdById: userId,
        });

        bankTransactionId = bankTransaction.id;
      }

      await trx
        .update(liquidationsAssociates)
        .set({
          status: 'DISBURSED',
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(liquidationsAssociates.id, liquidationId),
            eq(liquidationsAssociates.tenantId, tenantId),
          ),
        );

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          userId,
          action: 'UPDATE',
          tableName: 'liquidationsAssociates',
          recordId: liquidationId,
          description: `Desembolso de Liquidación de Asociado - ${liquidation.associates?.fullname}`,
          area: 'Liquidacion',
          newData: [{ status: 'DISBURSED', bankTransactionId }],
          tenantId,
        }),
      );

      return {
        message: 'Desembolso procesado exitosamente',
        liquidationId: liquidationId,
        bankTransactionId: bankTransactionId,
      };
    };

    return tx
      ? executeInTransaction(tx)
      : this.db.transaction(executeInTransaction);
  }

  async findAll(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search = '' } = paginationDto || {};

    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [
      eq(liquidationsAssociates.tenantId, tenantId),
    ];

    if (search) {
      conditions.push(ilike(associates.cedula, `%${search}%`));
    }

    const where = and(...conditions);

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(liquidationsAssociates)
      .leftJoin(
        associates,
        eq(associates.id, liquidationsAssociates.associateId),
      )
      .where(where);

    const totalItems = Number(totalCountResult[0].count);

    const data = await this.db
      .select({
        id: liquidationsAssociates.id,
        customReference: liquidationsAssociates.customReference,
        liquidationDate: liquidationsAssociates.liquidationDate,
        totalSavingsBalanceAtLiquidation: liquidationsAssociates.totalSavingsBalanceAtLiquidation,
        totalOutstandingLoansAtLiquidation: liquidationsAssociates.totalOutstandingLoansAtLiquidation,
        totalOutstandingCreditsAtLiquidation: liquidationsAssociates.totalOutstandingCreditsAtLiquidation,
        netLiquidationAmount: liquidationsAssociates.netLiquidationAmount,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        status: liquidationsAssociates.status,
        notes: liquidationsAssociates.notes,
        beneficiary: liquidationsAssociates.beneficiary,
      })
      .from(liquidationsAssociates)
      .where(where)
      .leftJoin(
        associates,
        eq(associates.id, liquidationsAssociates.associateId),
      )
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findSettlementAprovee(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto || {};
    const offset = (page - 1) * limit;

    const where = and(
      eq(liquidationsAssociates.status, 'PROCESSED'),
      eq(liquidationsAssociates.tenantId, tenantId),
    );

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(liquidationsAssociates)
      .leftJoin(
        associates,
        eq(associates.id, liquidationsAssociates.associateId),
      )
      .where(where);

    const totalItems = Number(totalCountResult[0].count);

    const data = await this.db
      .select({
        id: liquidationsAssociates.id,
        associateName: associates.fullname,
        amount: liquidationsAssociates.netLiquidationAmount,
      })
      .from(liquidationsAssociates)
      .leftJoin(
        associates,
        eq(associates.id, liquidationsAssociates.associateId),
      )
      .where(where)
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }
}
