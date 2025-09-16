import { PaginationDto } from '@/common/dto/pagination.dto';
import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  associateAccounts,
  associates,
  auditLogs,
  liquidationsAssociates,
} from '@/database/index';
import {
  AssociateMovementTypeEnum,
  creditPaymetTypeEnum,
  CurrencyCodeEnum,
  loanPaymetTypeEnum,
  paymentMethodEnum,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import { CreditPaidService } from '../../credits/credit-paid/credit-paid.service';
import { LoanPaidService } from '../../loans/loan_paid/loan-paid.service';
import { CreateSettlementAssociateDto } from './dto/create-settlement-associate.dto';

@Injectable()
export class SettlementAssociateService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly loanPaidService: LoanPaidService, // ¡Inyecta LoanPaidService!
    private readonly creditPaidService: CreditPaidService, // ¡Inyecta LoanPaidService!
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  async findOneRequest(cedula: string) {
    const result = await this.db
      .select()
      .from(associates)
      .where(eq(associates.cedula, cedula));

    if (!result.length) {
      throw new NotFoundException(`Associate with cedula ${cedula} not found`);
    }
    if (result[0].status === 'INACTIVE') {
      throw new NotFoundException(
        `Associate with cedula ${cedula} is inactive`,
      );
    }

    if (result[0].status === 'RETIRED') {
      throw new NotFoundException(`Associate with cedula ${cedula} is retired`);
    }

    const resultLiquidations = await this.db.execute(
      sql.raw(
        `select *from savings_banks.calculate_associate_liquidation('${cedula}')`,
      ),
    );

    if (resultLiquidations.rows.length === 0) {
      throw new NotFoundException(
        `Associate with cedula ${cedula} has no liquidation data`,
      );
    }

    const transformResultLiquidations = resultLiquidations.rows.map((row) => ({
      ...row,
      total_savings_balance: Number(row.total_savings_balance).toFixed(2),
      total_outstanding_loans: Number(row.total_outstanding_loans).toFixed(2),
      total_outstanding_credits: Number(row.total_outstanding_credits).toFixed(
        2,
      ),
      net_liquidation_amount: Number(row.net_liquidation_amount).toFixed(2),
    }));

    return {
      message: 'Associate liquidation calculated',
      data: transformResultLiquidations[0],
    };
  }

  //--- Método principal para procesar la liquidación ---
  async create(dto: CreateSettlementAssociateDto, userId: number) {
    const {
      associateId, //ide asociado
      netLiquidationAmount, // El monto neto final (lo que se paga/se debe)
      totalOutstandingCreditsAtLiquidation, // Deuda de créditos en el momento de la liquidación
      totalOutstandingLoansAtLiquidation, // Deuda de prestamos en el momento de la liquidación
      totalSavingsBalanceAtLiquidation, // Saldo de ahorros en el momento de la liquidación
      liquidationDate, // Fecha en que se procesó la liquidación
      notes, // Campo para cualquier nota relevante de la liquidación
      paymentMethod,
      beneficiary, // Beneficiario de la liquidación (opcional)
    } = dto;

    return this.db.transaction(async (tx) => {
      // 1. Obtener información del asociado y validar su existencia y estado
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
        .where(eq(associates.id, associateId));

      if (!associate?.id) {
        throw new NotFoundException(`Asociado no encontrado.`);
      }

      if (associate.status !== 'ACTIVE') {
        throw new BadRequestException(
          `El asociado con cédula '${associate.cedula}' no está activo para ser liquidado (estado actual: ${associate.status}).`,
        );
      }

      // 2. Compensación de Deudas (Préstamos y Créditos)
      // Usamos el LoanPaidService para gestionar los pagos de préstamos.
      // --- 2.1 Procesar Créditos Pendientes (asume un CreditPaidService similar) ---
      if (totalOutstandingCreditsAtLiquidation !== 0) {
        const credits = await this.creditPaidService.findOneRequest(
          associate.cedula,
        );

        try {
          const dataCredit = {
            amount: totalOutstandingCreditsAtLiquidation,
            bankId: undefined,
            creditId: credits?.creditId,
            paymentDate: liquidationDate!,
            paymentMethod: paymentMethod as paymentMethodEnum,
            paymentType: 'CANCELLATION' as creditPaymetTypeEnum,
            comment: 'PAGO CREDITOS POR LIQUIDACION ASOCIADO',
            transactionReference: '',
          };
          await this.creditPaidService.create(dataCredit, userId);
        } catch (error) {
          console.error(
            `Error al pagar credito ${credits.creditId} durante liquidación:`,
            error,
          );
          // Decide si esto debe abortar la liquidación o continuar
          throw new InternalServerErrorException(
            `No se pudo compensar el credito ${credits.creditId} durante la liquidación.`,
          );
        }
      }

      // --- 2.2 Procesar Préstamos Pendientes ---
      if (totalOutstandingLoansAtLiquidation !== 0) {
        const loans = await this.loanPaidService.findOneRequest(
          associate.cedula,
        );

        try {
          const dataLoan = {
            amount: totalOutstandingLoansAtLiquidation,
            bankId: undefined,
            loanId: loans.loanId,
            paymentDate: liquidationDate!,
            paymentMethod: paymentMethod as paymentMethodEnum,
            paymentType: 'CANCELLATION' as loanPaymetTypeEnum,
            comment: 'PAGO PRESTAMO POR LIQUIDACION ASOCIADO',

            transactionReference: '',
          };

          await this.loanPaidService.create(dataLoan, userId);
        } catch (error) {
          console.error(
            `Error al pagar prestamo ${loans.id} durante liquidación:`,
            error,
          );
          // Decide si esto debe abortar la liquidación o continuar
          throw new InternalServerErrorException(
            `No se pudo compensar el prestamo ${loans.id} durante la liquidación.`,
          );
        }
      }

      const reference =
        await this.generateCodeService.generateNextReference('RH-LIQ');

      // 3. Guardar el registro de la liquidación en la nueva tabla 'liquidations'
      const [newLiquidation] = await this.db
        .insert(liquidationsAssociates)
        .values({
          associateId: associateId,
          liquidationDate: liquidationDate,
          currencyCode: 'VES' as CurrencyCodeEnum,
          totalSavingsBalanceAtLiquidation: totalSavingsBalanceAtLiquidation,
          totalOutstandingLoansAtLiquidation:
            totalOutstandingLoansAtLiquidation,
          totalOutstandingCreditsAtLiquidation:
            totalOutstandingCreditsAtLiquidation,
          netLiquidationAmount: netLiquidationAmount,
          status: 'PROCESSED',
          notes: notes,
          createdById: Number(userId),
          customReference: reference,
          beneficiary: beneficiary ? beneficiary : null,
        })
        .returning({
          id: liquidationsAssociates.id,
          customReference: liquidationsAssociates.customReference,
        });

      // 4. Registrar el movimiento final en la cuenta del asociado (si hay un monto neto positivo)
      // Si el monto de liquidación es positivo, significa que el asociado recibe dinero.
      if (netLiquidationAmount > 0) {
        try {
          const payloadMovementLoan = {
            associateAccountId: Number(associate.associateAccountId),
            movementType: 'LIQUIDATION_BALANCE' as AssociateMovementTypeEnum,
            amount: netLiquidationAmount,
            currencyCode: 'VES' as CurrencyCodeEnum,
            transactionDate: liquidationDate ? liquidationDate : undefined,
            description: 'LIQUIDACION DE HABERES',
            referenceId: String(newLiquidation.id),
            referenceType: 'liquidationsAssociates',
            referenceNumber: newLiquidation.customReference ?? undefined,
            area: 'LIQUIDACION',
          };
          await this.associateAccountsMovementsService.create(
            userId,
            payloadMovementLoan,
          );
        } catch (error) {
          console.error(
            `Error al generar el movimiento de la liquidacion`,
            error,
          );
          // Decide si esto debe abortar la liquidación o continuar
          throw new InternalServerErrorException(
            `Error al generar el movimiento de la liquidacion`,
          );
        }
      }
      // Si `netLiquidationAmount` es cero o negativo, no hay retiro final positivo.
      // La cuenta se cerrará y cualquier deuda restante se manejará por las actualizaciones
      // de estado de los préstamos/créditos o políticas de cartera.

      // 5. Actualizar el estado del asociado a "retirado" y registrar la fecha de egreso
      await tx
        .update(associates)
        .set({
          status: 'RETIRED', // O 'INACTIVE', según tu enum `statusEnum`
          dateGraduation: (liquidationDate ?? new Date()).toISOString(),
          updatedAt: new Date(),
        })
        .where(eq(associates.id, associate.id));

      // // 6. Actualizar el estado de las cuentas del asociado a "cerrado"
      await tx
        .update(associateAccounts)
        .set({
          status: 'ARCHIVED', // O 'INACTIVE'
          closingDate: (liquidationDate ?? new Date()).toISOString(),
          updatedAt: new Date(),
        })
        .where(eq(associateAccounts.associateId, associate.id));

      // 8. (Opcional) Registrar en el log de auditoría
      await tx.insert(auditLogs).values({
        userId: userId,
        action: 'PROCESS',
        tableName: 'liquidationsAssociates',
        recordId: newLiquidation.id.toString(),
        description: `LIQUIDACION DE ASOCIADO`,
        area: 'RETIROS',
        newData: [
          {
            associateId: associateId,
            liquidationDate: liquidationDate,
            currencyCode: 'VES' as CurrencyCodeEnum,
            totalSavingsBalanceAtLiquidation: totalSavingsBalanceAtLiquidation,
            totalOutstandingLoansAtLiquidation:
              totalOutstandingLoansAtLiquidation,
            totalOutstandingCreditsAtLiquidation:
              totalOutstandingCreditsAtLiquidation,
            netLiquidationAmount: netLiquidationAmount,
            status: 'PROCESSED',
            notes: notes,
            createdById: Number(userId),
            customReference: reference,
            beneficiary: beneficiary ? beneficiary : null,
          },
        ],
      });

      // Si todo el proceso dentro de la transacción se completa, se confirma.
      return {
        message: `Liquidación procesada exitosamente para asociado '${associate.fullname}'.`,
        liquidation: newLiquidation,
        netAmount: netLiquidationAmount,
      };
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
    } = paginationDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(ilike(associates.cedula, `%${search}%`));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${liquidationsAssociates[sortBy as keyof typeof liquidationsAssociates]} asc`
        : sql`${liquidationsAssociates[sortBy as keyof typeof liquidationsAssociates]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(liquidationsAssociates)
      .leftJoin(
        associates,
        eq(associates.id, liquidationsAssociates.associateId),
      )
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
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
      })
      .from(liquidationsAssociates)
      .where(searchCondition)
      .leftJoin(
        associates,
        eq(associates.id, liquidationsAssociates.associateId),
      )
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Build pagination metadata
    const meta = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return {
      data: data.map((item) => ({
        ...item,
        totalSavingsBalanceAtLiquidation: Number(
          item.totalSavingsBalanceAtLiquidation,
        ).toFixed(2),
        totalOutstandingLoansAtLiquidation: Number(
          item.totalOutstandingLoansAtLiquidation,
        ).toFixed(2),
        totalOutstandingCreditsAtLiquidation: Number(
          item.totalOutstandingCreditsAtLiquidation,
        ).toFixed(2),
        netLiquidationAmount: Number(item.netLiquidationAmount).toFixed(2),
      })),
      meta,
    };
  }

  async findSettlementAprovee() {
    const result = await this.db
      .select({
        id: liquidationsAssociates.id,
        associateId: associates.id,
        associateCedula: associates.cedula,
        associateName: associates.fullname,
        reference: liquidationsAssociates.customReference,
        approvalDate: liquidationsAssociates.liquidationDate,
        amount: liquidationsAssociates.netLiquidationAmount,
      })
      .from(liquidationsAssociates)
      .leftJoin(
        associates,
        eq(associates.id, liquidationsAssociates.associateId),
      )
      .where(eq(liquidationsAssociates.status, 'REQUESTED'));

    return {
      data: result,
    };
  }
}
