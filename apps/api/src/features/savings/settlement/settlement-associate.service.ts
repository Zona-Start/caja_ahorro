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
  creditsTypes,
  internalTransactionBankLinks,
  liquidationsAssociates,
  loanAmortizationSchedule,
  loanPayments,
  loanPaymentsDetails,
  loanTypes,
  loans,
  withdrawalTypes,
  withdrawalsAssociates,
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
import { and, eq, ilike, inArray, isNotNull, isNull, or, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { format } from 'date-fns';
import * as ExcelJS from 'exceljs';
import { AssociateAccountsMovementsService } from '../parnerts/associate-accounts-movements/associate-accounts-movements.service';
import {
  CreateBulkSettlementAssociateDto,
  CreateSettlementAssociateDto,
  DisburseSettlementAssociateDto,
  FilterSettlementAssociateDto,
} from './dto/settlement.schema';
import { SavingsLiquidationService } from './liquidation.service';
import {
  SettlementAssociateAccountingService,
  type LiquidationDebtLine,
  type LiquidationWithdrawalLine,
} from './settlement-associate-accounting.service';

@Injectable()
export class SettlementAssociateService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly eventEmitter: EventEmitter2,
    private readonly savingsLiquidationService: SavingsLiquidationService,
    private readonly settlementAccountingService: SettlementAssociateAccountingService,
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
      throw new BadRequestException(
        `Associate with cedula ${cedula} is retired`,
      );
    }

    const resultLiquidations =
      await this.savingsLiquidationService.calculateAssociateLiquidation(
        cedula,
      );

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

    const [associate] = await this.db
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
      )
      .limit(1);

    if (!associate?.id) {
      throw new NotFoundException(`Asociado no encontrado.`);
    }

    const liquidation = await this.createLiquidationForAssociate(
      tenantId,
      userId,
      associate,
      new Date(date),
      notes,
      beneficiary,
    );

    return {
      message: `Solicitud de liquidación creada exitosamente.`,
      liquidation,
    };
  }

  private async createLiquidationForAssociate(
    tenantId: string,
    userId: string,
    associate: { id: string; cedula: string; status: string },
    date: Date,
    notes?: string,
    beneficiary?: CreateSettlementAssociateDto['beneficiary'],
  ) {
    return this.db.transaction(async (tx) => {
      if (associate.status !== 'ACTIVE') {
        throw new BadRequestException(
          `El asociado con cédula '${associate.cedula}' no está activo para ser liquidado (estado actual: ${associate.status}).`,
        );
      }

      const [existingLiquidation] = await tx
        .select({ id: liquidationsAssociates.id })
        .from(liquidationsAssociates)
        .where(
          and(
            eq(liquidationsAssociates.associateId, associate.id),
            eq(liquidationsAssociates.status, 'REQUESTED'),
            eq(liquidationsAssociates.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (existingLiquidation) {
        throw new BadRequestException(
          `Ya existe una solicitud de liquidación pendiente para este asociado.`,
        );
      }

      const reference = await this.generateCodeService.generateNextReference(
        'LIQ-SOC',
        tenantId,
        'savings',
        'liquidations',
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
          associateId: associate.id,
          liquidationDate: date.toISOString().split('T')[0],
          currencyCode: 'VES' as CurrencyCodeEnum,
          totalSavingsBalanceAtLiquidation: String(liq.total_savings_balance),
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
          newData: [
            {
              associateId: associate.id,
              cedula: associate.cedula,
              status: 'REQUESTED',
              customReference: reference,
            },
          ],
          tenantId,
        }),
      );

      return newLiquidationRequest;
    });
  }

  async downloadTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla Liquidaciones');

    worksheet.columns = [{ key: 'a', width: 28 }, { key: 'b', width: 22 }];

    worksheet.getCell('A1').value = 'fecha';
    worksheet.getCell('B1').value = format(new Date(), 'yyyy-MM-dd');
    worksheet.getCell('A1').font = { bold: true };
    worksheet.getCell('B1').font = { bold: true };

    worksheet.getCell('A2').value = 'cedula';
    worksheet.getRow(2).font = { bold: true };

    worksheet.getCell('A3').value = '19354301';
    worksheet.getCell('A4').value = '87654321';

    return await workbook.xlsx.writeBuffer();
  }

  async bulkUpload(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    dto?: CreateBulkSettlementAssociateDto,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('Archivo no recibido.');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new BadRequestException('El archivo no contiene una hoja válida.');
    }

    const dateCell = worksheet.getCell('B1').value?.toString().trim();
    const parsedDate = dateCell ? new Date(dateCell) : null;
    const liquidationDate =
      parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : new Date();

    const cedulas: string[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 2) {
        const cedula = row.getCell(1).value?.toString().trim();
        if (cedula) cedulas.push(cedula);
      }
    });

    // Los datos bancarios son OPCIONALES: si se envian se crea el movimiento
    // bancario; si no, la liquidacion se desembolsa igualmente (sin banco).
    const hasBankData = !!dto?.bankAccountId;
    const transferDate = dto?.transferDate ?? liquidationDate;

    const success: {
      cedula: string;
      customReference: string | null;
      liquidationId: string;
      disbursed: boolean;
      disburseError?: string;
    }[] = [];
    const errors: { cedula: string; error: string }[] = [];

    for (const cedulaInput of cedulas) {
      try {
        const digits = cedulaInput.replace(/\D/g, '');
        const variants = [cedulaInput];
        if (digits && digits !== cedulaInput) variants.push(digits);

        const [associate] = await this.db
          .select({
            id: associates.id,
            cedula: associates.cedula,
            status: associates.status,
          })
          .from(associates)
          .where(
            and(
              eq(associates.tenantId, tenantId),
              or(...variants.map((c) => eq(associates.cedula, c))),
            ),
          )
          .limit(1);

        if (!associate?.id) {
          throw new NotFoundException(
            `Asociado con cédula '${cedulaInput}' no encontrado.`,
          );
        }

        // 1. Crear la solicitud (REQUESTED).
        const created = await this.createLiquidationForAssociate(
          tenantId,
          userId,
          associate,
          liquidationDate,
        );

        // 2. Procesar (aprobar) la liquidacion -> PROCESSED.
        await this.approve(tenantId, userId, created.id, { isBulk: true });

        // 3. Desembolsar -> DISBURSED (siempre). El movimiento bancario se crea
        //    solo si se enviaron datos bancarios; si no, se desembolsa sin banco.
        let disbursed = false;
        let disburseError: string | undefined;
        try {
          await this.disburse(
            tenantId,
            userId,
            created.id,
            {
              bankAccountId: dto?.bankAccountId,
              transferDate,
              bankReference: dto?.bankReference,
            },
            undefined,
            !hasBankData,
            { isBulk: true },
          );
          disbursed = true;
        } catch (disburseErr) {
          disburseError =
            disburseErr instanceof Error
              ? disburseErr.message
              : 'Error desconocido al desembolsar.';
        }

        success.push({
          cedula: associate.cedula,
          customReference: created.customReference,
          liquidationId: created.id,
          disbursed,
          disburseError,
        });
      } catch (error) {
        errors.push({
          cedula: cedulaInput,
          error:
            error instanceof Error
              ? error.message
              : 'Error desconocido al procesar la liquidación.',
        });
      }
    }

    return {
      message: 'Carga masiva de liquidaciones procesada.',
      totalProcessed: success.length,
      totalDisbursed: success.filter((s) => s.disbursed).length,
      totalErrors: errors.length,
      bankMovementCreated: hasBankData,
      success,
      errors,
    };
  }

  /**
   * Mapeos manuales por palabras clave para retiros acumulados migrados sin
   * referencia. Tienen PRIORIDAD sobre el matcher generico por tokens y sirven
   * para resolver casos ambiguos donde la descripcion contiene palabras de mas
   * de un tipo (ej. "Retiros Parciales por Ajuste Prestamo" contiene "parcial"
   * y "prestamo").
   *
   * Si TODAS las palabras clave aparecen en la descripcion normalizada, se
   * asigna el tipo indicado. Para agregar un caso nuevo basta con anadir una
   * entrada aqui.
   */
  private static readonly WITHDRAWAL_DESCRIPTION_ALIASES: ReadonlyArray<{
    keywords: string[];
    typeDescription: string;
  }> = [
    {
      keywords: ['ajuste', 'prestamo'],
      typeDescription: 'PRESTAMOS VS HABERES',
    },
  ];

  /**
   * Identifica el tipo de retiro a partir de la descripcion de un movimiento
   * acumulado/migrado que no tiene referencia. Se comparan palabras
   * significativas (sin acentos, sin plural, sin palabras genericas como
   * "acumulado", "retiros", "año", "vs", "haberes") para no depender del texto
   * exacto. Ej:
   *   "Acumulado Retiros por Combo Escolares año 2025" -> "Combo Escolar vs Haberes"
   *   "Acumulado Retiros Parciales año 2025"          -> "Retiros Parciales"
   */
  private matchWithdrawalTypeByDescription(
    rawDescription: string,
    types: {
      description: string;
      isHouseComercial: boolean;
      isInternalInventory: boolean;
    }[],
  ): {
    description: string;
    isHouseComercial: boolean;
    isInternalInventory: boolean;
  } | null {
    const stopwords = new Set([
      'acumulado',
      'acumulada',
      'acumulados',
      'ano',
      'anos',
      'retiro',
      'retiros',
      'por',
      'haberes',
      'precarga',
      'precargado',
      'migracion',
      'del',
      'los',
      'las',
      'mes',
      'meses',
      'dia',
      'dias',
    ]);

    const normalize = (text: string): string[] =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        // 1) Se descartan stopwords y numeros en su forma original.
        .filter((w) => w.length > 2 && !/^\d+$/.test(w) && !stopwords.has(w))
        // 2) Se singulariza (escolares -> escolar, parciales -> parcial).
        .map((w) => w.replace(/(es|s)$/, ''))
        // 3) Se vuelve a descartar por stopword / longitud tras singularizar.
        .filter((w) => w.length > 2 && !stopwords.has(w));

    const descTokens = new Set(normalize(rawDescription));

    // 1) Mapeos explicitos por palabras clave (prioridad sobre el generico).
    for (const alias of SettlementAssociateService.WITHDRAWAL_DESCRIPTION_ALIASES) {
      const keys = Array.from(
        new Set(alias.keywords.flatMap((k) => normalize(k))),
      );
      if (keys.length > 0 && keys.every((k) => descTokens.has(k))) {
        const found = types.find(
          (t) => t.description === alias.typeDescription,
        );
        return (
          found ?? {
            description: alias.typeDescription,
            isHouseComercial: false,
            isInternalInventory: false,
          }
        );
      }
    }

    // 2) Matcher generico por tokens: exige coincidencia de TODAS las palabras
    //    significativas del tipo y prefiere el mas especifico.
    let best: (typeof types)[number] | null = null;
    let bestScore = 0;

    for (const type of types) {
      const typeTokens = Array.from(new Set(normalize(type.description)));
      if (typeTokens.length === 0) continue;
      const matched = typeTokens.filter((t) => descTokens.has(t)).length;
      if (matched === typeTokens.length && matched > bestScore) {
        best = type;
        bestScore = matched;
      }
    }

    return best;
  }

  async approve(
    tenantId: string,
    userId: string,
    liquidationId: string,
    options?: { isBulk?: boolean },
  ) {
    const bulkNote = options?.isBulk ? ' (carga masiva)' : '';
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
      const totalCredits = Number(
        liquidation.totalOutstandingCreditsAtLiquidation,
      );
      const netAmount = Number(liquidation.netLiquidationAmount);

      // Datos para el asiento contable (se toman ANTES de aplicar los pagos).
      const haberes =
        await this.savingsLiquidationService.calculateAssociateLiquidation(
          associate.cedula,
        );
      const loanAccountingLines: LiquidationDebtLine[] = [];
      const creditAccountingLines: LiquidationDebtLine[] = [];
      const withdrawalAccountingLines: LiquidationWithdrawalLine[] = [];

      if (accountId) {
        // 1. Retiros CON referencia -> el tipo sale directo de la tabla.
        const referencedRows = await tx
          .select({
            description: withdrawalTypes.description,
            isHouseComercial: withdrawalTypes.isHouseComercial,
            isInternalInventory: withdrawalTypes.isInternalInventory,
            amount: sql<string>`SUM(${associateAccountMovements.amount})`,
          })
          .from(associateAccountMovements)
          .innerJoin(
            withdrawalsAssociates,
            and(
              eq(withdrawalsAssociates.tenantId, tenantId),
              sql`${withdrawalsAssociates.id}::text = ${associateAccountMovements.referenceId}`,
            ),
          )
          .innerJoin(
            withdrawalTypes,
            eq(withdrawalTypes.id, withdrawalsAssociates.withdrawalTypeId),
          )
          .where(
            and(
              eq(associateAccountMovements.associateAccountId, accountId),
              eq(associateAccountMovements.status, 'COMPLETED'),
              isNotNull(associateAccountMovements.referenceId),
              inArray(associateAccountMovements.movementType, [
                'SAVING_WITHDRAWAL',
                'WITHDRAWAL_FEE_DEBIT',
              ]),
            ),
          )
          .groupBy(
            withdrawalTypes.description,
            withdrawalTypes.isHouseComercial,
            withdrawalTypes.isInternalInventory,
          );

        for (const row of referencedRows) {
          withdrawalAccountingLines.push({
            description: row.description,
            isSpecial:
              Boolean(row.isHouseComercial) ||
              Boolean(row.isInternalInventory),
            amount: Number(row.amount),
          });
        }

        // 2. Retiros SIN referencia (acumulados migrados): se agrupan por su
        //    descripcion y se identifica el tipo por coincidencia de palabras.
        const unreferencedRows = await tx
          .select({
            rawDescription: associateAccountMovements.description,
            amount: sql<string>`SUM(${associateAccountMovements.amount})`,
          })
          .from(associateAccountMovements)
          .where(
            and(
              eq(associateAccountMovements.associateAccountId, accountId),
              eq(associateAccountMovements.status, 'COMPLETED'),
              isNull(associateAccountMovements.referenceId),
              inArray(associateAccountMovements.movementType, [
                'SAVING_WITHDRAWAL',
                'WITHDRAWAL_FEE_DEBIT',
              ]),
            ),
          )
          .groupBy(associateAccountMovements.description);

        if (unreferencedRows.length > 0) {
          const types = await tx
            .select({
              description: withdrawalTypes.description,
              isHouseComercial: withdrawalTypes.isHouseComercial,
              isInternalInventory: withdrawalTypes.isInternalInventory,
            })
            .from(withdrawalTypes)
            .where(eq(withdrawalTypes.tenantId, tenantId));

          for (const row of unreferencedRows) {
            const raw = row.rawDescription ?? '';
            const matched = this.matchWithdrawalTypeByDescription(raw, types);
            withdrawalAccountingLines.push({
              description: matched?.description ?? '',
              isSpecial: matched
                ? Boolean(matched.isHouseComercial) ||
                  Boolean(matched.isInternalInventory)
                : false,
              amount: Number(row.amount),
            });
            console.log(
              `[Liquidacion] Retiro acumulado sin referencia: "${raw}" -> tipo: ${
                matched?.description ?? '(no identificado)'
              } | monto=${Number(row.amount)}`,
            );
          }
        }
      }

      // 1. Pay off outstanding loans from savings
      if (totalLoans > 0) {
        const outstandingLoans = await tx
          .select({
            loanId: schema.loanOutstandingBalance.loanId,
            outstandingTotal:
              schema.loanOutstandingBalance.outstandingTotalBalance,
            typeName: loanTypes.name,
          })
          .from(schema.loanOutstandingBalance)
          .leftJoin(
            loans,
            eq(loans.id, schema.loanOutstandingBalance.loanId),
          )
          .leftJoin(loanTypes, eq(loanTypes.id, loans.loanTypeId))
          .where(
            eq(
              schema.loanOutstandingBalance.associateId,
              liquidation.associateId,
            ),
          );

        for (const loan of outstandingLoans) {
          const loanBalance = Number(loan.outstandingTotal);
          if (loanBalance <= 0) continue;

          loanAccountingLines.push({
            typeName: loan.typeName ?? 'PRESTAMO',
            amount: loanBalance,
          });

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
            const installmentOwed =
              Number(inst.totalAmount) - Number(inst.paidAmount || 0);

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
            typeName: creditsTypes.name,
          })
          .from(schema.creditOutstandingBalance)
          .leftJoin(
            credits,
            eq(credits.id, schema.creditOutstandingBalance.creditId),
          )
          .leftJoin(creditsTypes, eq(creditsTypes.id, credits.creditTypeId))
          .where(
            eq(
              schema.creditOutstandingBalance.associateId,
              liquidation.associateId,
            ),
          );

        for (const credit of outstandingCredits) {
          const creditBalance = Number(credit.outstandingTotal);
          if (creditBalance <= 0) continue;

          creditAccountingLines.push({
            typeName: credit.typeName ?? 'CREDITO',
            amount: creditBalance,
          });

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
            const installmentOwed =
              Number(inst.totalAmount) - Number(inst.paidAmount || 0);

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

      // 3.1 Generate the automatic accounting entry.
      await this.settlementAccountingService.generateLiquidationEntry(
        tenantId,
        userId,
        {
          liquidationId: liquidation.id,
          associateId: associate.id,
          associateAccountId: accountId,
          associateFullname: associate.fullname,
          associateCedula: associate.cedula,
          entryDate: processedDate,
          currencyCode: 'VES' as CurrencyCodeEnum,
          haberesContribution: haberes.haberes_contribution,
          haberesVoluntary: haberes.haberes_voluntary,
          haberesEmployer: haberes.haberes_employer,
          surpluses: haberes.surpluses,
          totalHaberesBalance: totalSavings,
          withdrawals: withdrawalAccountingLines,
          loans: loanAccountingLines,
          credits: creditAccountingLines,
          netAmount,
        },
        tx,
      );

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
          description: `Procesamiento y Aprobación de Liquidación de Asociado${bulkNote}`,
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
    dto: Partial<DisburseSettlementAssociateDto>,
    tx?: any,
    skipBankTransaction = false,
    options?: { isBulk?: boolean },
  ) {
    const bulkNote = options?.isBulk ? ' (carga masiva)' : '';
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
        if (!dto.bankAccountId || !dto.transferDate) {
          throw new BadRequestException(
            'Datos bancarios incompletos para registrar el desembolso.',
          );
        }

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
          description: `Desembolso de Liquidación de Asociado - ${liquidation.associates?.fullname}${bulkNote}`,
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

  async findAll(
    tenantId: string,
    paginationDto: FilterSettlementAssociateDto,
  ) {
    const { page = 1, limit = 10, search = '', status } = paginationDto || {};

    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [
      eq(liquidationsAssociates.tenantId, tenantId),
    ];

    if (search) {
      conditions.push(ilike(associates.cedula, `%${search}%`));
    }

    if (status) {
      conditions.push(
        eq(
          liquidationsAssociates.status,
          status as (typeof liquidationsAssociates.status.enumValues)[number],
        ),
      );
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
        totalSavingsBalanceAtLiquidation:
          liquidationsAssociates.totalSavingsBalanceAtLiquidation,
        totalOutstandingLoansAtLiquidation:
          liquidationsAssociates.totalOutstandingLoansAtLiquidation,
        totalOutstandingCreditsAtLiquidation:
          liquidationsAssociates.totalOutstandingCreditsAtLiquidation,
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
