import { generateUniqueReference } from '@/common/utils/reference';
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
import { eq, sql } from 'drizzle-orm';
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
  ) {}

  // async findAll(paginationDto: FilterWithdrawalAssociateDto) {

  // }

  async findOneRequest(cedula: string) {
    const resultLiquidations = await this.db.execute(
      sql.raw(
        `select *from savings_banks.calculate_associate_liquidation('${cedula}')`,
      ),
    );
    if (resultLiquidations.rows.length === 0) {
      return {
        message: 'Associate not found or inactive',
        data: [],
      };
    }

    return {
      message: 'Associate liquidation calculated',
      data: resultLiquidations.rows[0],
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

      const reference = generateUniqueReference();

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
          status: 'CLOSED', // O 'INACTIVE'
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

  // --- Otros métodos (mantener tus métodos existentes) ---
  // async findAll(paginationDto: FilterWithdrawalAssociateDto) { /* ... */ }
  // async findOneRequest(cedula: string) { /* ... */ }
}
