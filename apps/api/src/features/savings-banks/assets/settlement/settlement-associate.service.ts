import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import { LoanPaidService } from '../../loans/loan_paid/loan-paid.service';

@Injectable()
export class SettlementAssociateService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly loanPaidService: LoanPaidService, // ¡Inyecta LoanPaidService!
  ) {}

  // async findAll(paginationDto: FilterWithdrawalAssociateDto) {

  // }

  // async findOneRequest(cedula: string) {

  // }

  // --- Helper function to generate custom reference ---
  // private async generateCustomReference(): Promise<string> {
  //   // Fetch the current correlative number and increment it
  //   const key = 'correlativo_retiros';
  //   try {
  //     const result = await this.db.transaction(async (tx) => {
  //       // Lock the row for update
  //       const setting = await tx.query.systemSettings.findFirst({
  //         where: eq(systemSettings.key, key),
  //         // Add forUpdate() if your Drizzle version supports it for row locking
  //         // Example: columns: {}, with: { forUpdate: true }
  //       });

  //       if (!setting) {
  //         throw new InternalServerErrorException(
  //           `System setting '${key}' not found.`,
  //         );
  //       }

  //       const currentNumber = parseInt(setting.value, 10);
  //       if (isNaN(currentNumber)) {
  //         throw new InternalServerErrorException(
  //           `Invalid correlative number format for '${key}'.`,
  //         );
  //       }

  //       const nextNumber = currentNumber + 1;
  //       const nextValue = nextNumber.toString().padStart(5, '0'); // Pad with leading zeros

  //       // Update the setting with the new value
  //       await tx
  //         .update(systemSettings)
  //         .set({ value: nextValue, updatedAt: new Date() }) // Assuming you have an updatedById field to set too
  //         .where(eq(systemSettings.id, setting.id));

  //       return nextValue; // Return the generated reference
  //     });
  //     return `RET${result}`; // Prefix the reference
  //   } catch (error) {
  //     console.error('Error generating custom reference:', error);
  //     throw new InternalServerErrorException(
  //       'Failed to generate custom loan reference.',
  //     );
  //   }
  // }

  // --- Método principal para procesar la liquidación ---
  // async create(dto: CreateSettlementAssociateDto, userId: number) {
  //   // Inicia una transacción de base de datos. Esto asegura que todas las operaciones
  //   // se completen con éxito o se reviertan.
  //   return this.db.transaction(async (tx) => {
  //     // 1. Obtener información del asociado y validar su existencia y estado
  //     const associate = await tx.query.associates.findFirst({
  //       where: eq(associates.cedula, dto.cedula),
  //     });

  //     if (!associate) {
  //       throw new NotFoundException(`Asociado con cédula '${dto.cedula}' no encontrado.`);
  //     }

  //     if (associate.status !== 'ACTIVE') {
  //       throw new BadRequestException(`El asociado con cédula '${dto.cedula}' no está activo para ser liquidado (estado actual: ${associate.status}).`);
  //     }

  //     const associateAccountsToClose = await tx.query.associateAccounts.findMany({
  //       where: and(
  //         eq(associateAccounts.associateId, associate.id),
  //         eq(associateAccounts.currencyCode, CurrencyCodeEnum.VES)
  //       ),
  //     });

  //     if (associateAccountsToClose.length === 0) {
  //       throw new BadRequestException(`El asociado con cédula '${dto.cedula}' no tiene cuentas de ahorro activas para liquidar en VES.`);
  //     }

  //     const mainAssociateAccount = associateAccountsToClose[0]; // Asume la primera cuenta para operaciones

  //     // 2. Calcular los montos de liquidación usando la función de PostgreSQL
  //     const liquidationResult = await tx.execute(sql`
  //       SELECT
  //         associate_id,
  //         fullname,
  //         admission_date,
  //         currency_code,
  //         total_savings_balance,
  //         total_outstanding_loans,
  //         total_outstanding_credits,
  //         net_liquidation_amount
  //       FROM savings_banks.calculate_associate_liquidation(${dto.cedula});
  //     `);

  //     const liquidationData = liquidationResult.rows[0];

  //     if (!liquidationData) {
  //       throw new InternalServerErrorException('Error al calcular la liquidación. Datos no disponibles.');
  //     }

  //     const totalSavingsBalance = parseFloat(liquidationData.total_savings_balance as string);
  //     const totalOutstandingLoans = parseFloat(liquidationData.total_outstanding_loans as string);
  //     const totalOutstandingCredits = parseFloat(liquidationData.total_outstanding_credits as string);
  //     let netLiquidationAmount = parseFloat(liquidationData.net_liquidation_amount as string); // Usamos 'let' porque puede ajustarse

  //     // 3. Compensación de Deudas (Préstamos y Créditos)
  //     // Usamos el LoanPaidService para gestionar los pagos de préstamos.
  //     // La idea es "pagar" los préstamos del asociado con su saldo de liquidación.
  //     // Esta lógica se ejecuta *dentro de la transacción actual (tx)* de Drizzle.

  //     // --- 3.1 Procesar Préstamos Pendientes ---
  //     if (totalOutstandingLoans > 0) {
  //       // Obtener todos los préstamos pendientes del asociado
  //       const pendingLoans = await tx.query.loans.findMany({
  //         where: and(
  //           eq(loans.associateId, associate.id),
  //           eq(loans.currencyCode, CurrencyCodeEnum.VES),
  //           sql`${loans.status} IN (${LoanStatusEnum.DISBURSED}, ${LoanStatusEnum.IN_PAYMENT}, ${LoanStatusEnum.OVERDUE})`
  //         ),
  //       });

  //       // Iterar sobre cada préstamo y llamar al LoanPaidService para saldarlo
  //       for (const loan of pendingLoans) {
  //         // Si el netLiquidationAmount actual es suficiente para cubrir este préstamo
  //         // o al menos parte de él, se intenta pagarlo.
  //         // El LoanPaidService debería manejar si el 'amount' es mayor o menor
  //         // que el saldo pendiente del préstamo.
  //         // Aquí, le pasamos el `totalOutstandingLoans` global a cada uno
  //         // asumiendo que `LoanPaidService` tiene la inteligencia para solo pagar
  //         // lo que le queda al préstamo.
  //         // Si `LoanPaidService` espera el monto EXACTO a aplicar por este pago
  //         // entonces la lógica de asignación debería ser más fina aquí.
  //         // Para una liquidación total, se esperaría que el monto pase el total
  //         // y el servicio lo marque como 'PAID'.

  //         const loanAmountToPay = parseFloat(loan.approvedAmount as string); // Asume que approvedAmount es el total a pagar si aún no se ha saldado.
  //         // O podrías consultar el saldo pendiente exacto de este préstamo:
  //         // const loanOutstanding = await tx.query.loanOutstandingBalance.findFirst({
  //         //   where: eq(schema.loanOutstandingBalance.loanId, loan.id)
  //         // });
  //         // const loanPrincipalPending = loanOutstanding ? parseFloat(loanOutstanding.outstandingPrincipalBalance as string) : 0;

  //         // Creamos un DTO para el LoanPaidService.create
  //         const createLoanPaidDto: CreateLoanPaidDto = {
  //           loanId: loan.id,
  //           amount: loanAmountToPay, // Intentamos pagar el total del préstamo
  //           paymentDate: new Date().toISOString().split('T')[0], // Fecha de hoy
  //           paymentMethod: 'COMPENSATION', // Método de pago especial para liquidación
  //           paymentType: 'FULL_PAYMENT', // Tipo de pago completo
  //           bankId: undefined, // No aplica un banco externo
  //           transactionReference: await this.generateCustomReference(), // Referencia de la liquidación
  //           comment: `Pago por compensación en liquidación del asociado.`,
  //         };

  //         try {
  //           // Llama al servicio de pago de préstamos, pasándole la transacción (tx)
  //           // Esto es crucial para que LoanPaidService opere dentro de la misma transacción
  //           // Si LoanPaidService no acepta 'tx' como parámetro en su método 'create',
  //           // tendrías que modificarlo para que lo haga.
  //           await this.loanPaidService.create(createLoanPaidDto, userId, tx);
  //         } catch (error) {
  //           console.error(`Error al pagar préstamo ${loan.id} durante liquidación:`, error);
  //           // Decide si esto debe abortar la liquidación o continuar
  //           throw new InternalServerErrorException(`No se pudo compensar el préstamo ${loan.id} durante la liquidación.`);
  //         }
  //       }

  //       // Después de "pagar" todos los préstamos, el netLiquidationAmount ya ha tenido
  //       // en cuenta estos débitos en su cálculo inicial. No necesitamos ajustar `netLiquidationAmount` aquí
  //       // a menos que la lógica de `LoanPaidService.create` modifique el saldo de la cuenta
  //       // del asociado de una manera que no está ya reflejada en `calculate_associate_liquidation`.
  //       // Para la mayoría de los casos, la `netLiquidationAmount` ya es el valor final.
  //     }

  //     // --- 3.2 Procesar Créditos Pendientes (asume un CreditPaidService similar) ---
  //     if (totalOutstandingCredits > 0) {
  //       const pendingCredits = await tx.query.credits.findMany({
  //           where: and(
  //               eq(credits.associateId, associate.id),
  //               eq(credits.currencyCode, CurrencyCodeEnum.VES),
  //               sql`${credits.status} IN ('APPROVED', 'IN_PAYMENT')` // Ajusta los estados de crédito
  //           )
  //       });

  //       for (const credit of pendingCredits) {
  //         // Similares a los préstamos, crea un DTO y llama a creditPaidService.create
  //         // const createCreditPaidDto: CreateCreditPaidDto = { /* ... */ };
  //         // await this.creditPaidService.create(createCreditPaidDto, userId, tx);
  //         console.warn(`Lógica para pago de crédito ${credit.id} durante liquidación no implementada.`);
  //       }
  //     }

  //     // 4. Registrar el movimiento final en la cuenta del asociado (si hay un monto neto positivo)
  //     // Si el monto de liquidación es positivo, significa que el asociado recibe dinero.
  //     if (netLiquidationAmount > 0) {
  //       await this.associateAccountsMovementsService.createMovement(tx, {
  //         associateAccountId: mainAssociateAccount.id,
  //         amount: netLiquidationAmount,
  //         currencyCode: CurrencyCodeEnum.VES,
  //         movementType: AssociateMovementTypeEnum.SAVING_WITHDRAWAL, // Retiro final
  //         description: `Retiro final de ${netLiquidationAmount} ${CurrencyCodeEnum.VES} por liquidación de haberes.`,
  //         referenceType: 'liquidation',
  //         referenceId: associate.id.toString(), // ID del asociado para referencia
  //         referenceNumber: await this.generateCustomReference(),
  //       });
  //     }
  //     // Si `netLiquidationAmount` es cero o negativo, no hay retiro final positivo.
  //     // La cuenta se cerrará y cualquier deuda restante se manejará por las actualizaciones
  //     // de estado de los préstamos/créditos o políticas de cartera.

  //     // 5. Actualizar el estado del asociado a "retirado" y registrar la fecha de egreso
  //     await tx.update(associates)
  //       .set({
  //         status: 'RETIRED', // O 'INACTIVE', según tu enum `statusEnum`
  //         dateGraduation: new Date(),
  //         updatedAt: new Date(),
  //       })
  //       .where(eq(associates.id, associate.id));

  //     // 6. Actualizar el estado de las cuentas del asociado a "cerrado"
  //     await tx.update(associateAccounts)
  //       .set({
  //         status: 'CLOSED', // O 'INACTIVE'
  //         closingDate: new Date(),
  //         updatedAt: new Date(),
  //       })
  //       .where(eq(associateAccounts.associateId, associate.id));

  //     // 7. Guardar el registro de la liquidación en la nueva tabla 'liquidations'
  //     // Este registro es un snapshot de la liquidación
  //     const [newLiquidation] = await tx.insert(liquidations).values({
  //       associateId: associate.id,
  //       liquidationDate: new Date(),
  //       currencyCode: CurrencyCodeEnum.VES,
  //       totalSavingsBalanceAtLiquidation: totalSavingsBalance,
  //       totalOutstandingLoansAtLiquidation: totalOutstandingLoans,
  //       totalOutstandingCreditsAtLiquidation: totalOutstandingCredits,
  //       netLiquidationAmount: netLiquidationAmount,
  //       status: netLiquidationAmount > 0 ? 'PENDING_PAYOUT' : 'PROCESSED',
  //       notes: `Liquidación procesada para ${associate.fullname} (Cédula: ${dto.cedula}).`,
  //       processedByUserId: userId,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     }).returning(); // Retorna el registro de liquidación insertado

  //     // 8. (Opcional) Registrar en el log de auditoría
  //     await tx.insert(auditLogs).values({
  //       userId: userId,
  //       action: 'PROCESS',
  //       tableName: 'liquidations',
  //       recordId: newLiquidation.id.toString(),
  //       description: `Liquidación de asociado procesada para ID: ${associate.id}, Cédula: ${dto.cedula}. Monto Neto: ${netLiquidationAmount}`,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     });

  //     // Si todo el proceso dentro de la transacción se completa, se confirma.
  //     return {
  //       message: `Liquidación procesada exitosamente para asociado '${associate.fullname}'.`,
  //       liquidation: newLiquidation,
  //       netAmount: netLiquidationAmount,
  //     };
  //   });
  // }

  // --- Otros métodos (mantener tus métodos existentes) ---
  // async findAll(paginationDto: FilterWithdrawalAssociateDto) { /* ... */ }
  // async findOneRequest(cedula: string) { /* ... */ }
}
