import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  associateAccounts,
  associates,
  bankDirectory,
  loanAmortizationSchedule,
  loanPayments,
  loanPaymentsDetails,
  loans,
  loanTypes,
} from '@/database/index';
import * as ExcelJS from 'exceljs';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CurrencyCodeEnum,
  loanPaymetTypeEnum,
  LoanStatusEnum,
  paymentMethodEnum,
} from '@/types/enum';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { and, eq, ilike, inArray, ne, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import { CreateLoanPaidDto } from './dto/create-loan.dto';
import { FilterLoanPaidDto } from './dto/filter-loan-paid.dto';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import { format } from 'date-fns';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import { ModuleRef } from '@nestjs/core';

// Define una tolerancia para comparar montos monetarios después de redondeo.
// Esto es para CUADRAR el pago si hay una diferencia mínima causada por el toFixed(2) del usuario.
// Por ejemplo, si la cuota es 17.666667 y el usuario paga 17.67, la diferencia es 0.003333.
// Queremos que 17.67 sea "suficiente" para 17.666667.
const ROUNDING_ACCEPTANCE_TOLERANCE = 0.005; // Permite hasta medio centavo de ajuste
const EPSILON_COMPARISON = 0.05; // Para errores de punto flotante muy pequeños

@Injectable()
export class LoanPaidService implements OnModuleInit {

  // Declara la variable aquí arriba en lugar de en el constructor
  private bankMovementsService: BankMovementsService;

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly accountingEntriesService: AccountingEntriesService,
    private readonly eventEmitter: EventEmitter2,
    private readonly pdfService: PdfGeneratorService,

    private moduleRef: ModuleRef,
  ) {}

  // Este método se ejecuta automáticamente cuando NestJS ya leyó todos los archivos
  onModuleInit() {
    this.bankMovementsService = this.moduleRef.get(BankMovementsService, { strict: false });
  }

  /** Genera el asiento contable automático al registrar un pago de préstamo */
  private async generatePaymentAccountingEntry(
    userId: number,
    loanData: {
      id: number;
      companyId: number;
      associateId: number;
      currencyCode: string | null;
      associateFullname: string | null;
    },
    paymentAmount: number,
    principalAmount: number,
    interestAmount: number,
    paymentDate: Date,
    tx: NodePgDatabase<typeof schema>,
  ) {
    const dateStr = format(paymentDate, 'dd/MM/yyyy');
    const fullname = loanData.associateFullname ?? 'ASOCIADO';

    // 1. Redondear valores a 2 decimales para contabilidad
    const roundedPayment = Number(paymentAmount.toFixed(2));
    const roundedInterest = Number(interestAmount.toFixed(2));
    
    // 2. El capital se ajusta para que el asiento SIEMPRE cuadre (Ajuste por redondeo)
    const roundedPrincipal = Number((roundedPayment - roundedInterest).toFixed(2));

    try {
      await this.accountingEntriesService.createAutomaticEntry(
        userId,
        {
          companyId: Number(loanData.companyId),
          category: 'SAVINGS_BANK',
          operationType: 'LOAN_PAYMENT',
          description: `Pago de Préstamo - ${fullname}`,
          entryDate: paymentDate,
          referenceValue: undefined,
          currencyCode: (loanData.currencyCode ?? 'VES') as CurrencyCodeEnum,
          originReferenceId: String(loanData.id),
          originType: 'LOAN_PAYMENT',
          items: [
            {
              associateId: loanData.associateId,
              amounts: {
                LOAN_PRINCIPAL: roundedPrincipal,
                LOAN_INTEREST_INCOME: roundedInterest,
                BANK_ACCOUNT: roundedPayment,
              },
              descriptions: {
                LOAN_PRINCIPAL: `Amortización de Capital - Prestamo del ${dateStr}`,
                LOAN_INTEREST_INCOME: `Intereses de Prestamo del ${dateStr}`,
                BANK_ACCOUNT: `Ingreso por Pago de Prestamo del ${dateStr}`,
              },
            },
          ],
          globalDescriptions: {
            LOAN_PRINCIPAL: `Amortización de Capital - Prestamo del ${dateStr}`,
            LOAN_INTEREST_INCOME: `Intereses de Prestamo del ${dateStr}`,
            BANK_ACCOUNT: `Ingreso por Pago de Prestamo del ${dateStr}`,
          },
        },
        tx,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        error.message.includes('No existe una regla contable')
      ) {
        throw new BadRequestException(
          `El sistema está configurado para asientos automáticos, pero no existe una regla contable creada para procesar el pago del préstamo. Por favor, contacte al administrador.`,
        );
      }
      throw error;
    }
  }

  /** Genera el asiento contable de reversa al anular un pago de préstamo */
  private async generatePaymentReversalAccountingEntry(
    userId: number,
    loanData: {
      id: number;
      companyId: number;
      associateId: number;
      currencyCode: string | null;
      associateFullname: string | null;
    },
    paymentAmount: number,
    principalAmount: number,
    interestAmount: number,
    tx: NodePgDatabase<typeof schema>,
    paymentRef: string,
  ) {
    const fullname = loanData.associateFullname ?? 'ASOCIADO';

    // 1. Redondear valores a 2 decimales para contabilidad (coherencia con logic de pago)
    const roundedPayment = Number(paymentAmount.toFixed(2));
    const roundedInterest = Number(interestAmount.toFixed(2));

    // 2. El capital se ajusta para que el asiento cuadre exactamente con la reversa del pago total
    const roundedPrincipal = Number(
      (roundedPayment - roundedInterest).toFixed(2),
    );

    try {
      // Usamos el servicio de asientos automáticos.
      // Al pasar montos NEGATIVOS en las mismas claves de la regla original (LOAN_PAYMENT),
      // el sistema contable generará los movimientos contrarios (Debito donde era Credito y viceversa).
      await this.accountingEntriesService.createAutomaticEntry(
        userId,
        {
          companyId: Number(loanData.companyId),
          category: 'SAVINGS_BANK',
          operationType: 'LOAN_PAYMENT',
          description: `ANULACIÓN: Pago de Préstamo - ${fullname} (Ref: ${paymentRef})`,
          entryDate: new Date(), // Fecha de la reversa
          currencyCode: (loanData.currencyCode ?? 'VES') as CurrencyCodeEnum,
          originReferenceId: String(loanData.id),
          originType: 'LOAN_PAYMENT_REVERSAL',
          items: [
            {
              associateId: loanData.associateId,
              amounts: {
                LOAN_PRINCIPAL: -roundedPrincipal,
                LOAN_INTEREST_INCOME: -roundedInterest,
                BANK_ACCOUNT: -roundedPayment,
              },
              descriptions: {
                LOAN_PRINCIPAL: `REVERSA: Amortización de Capital - Ref: ${paymentRef}`,
                LOAN_INTEREST_INCOME: `REVERSA: Intereses de Prestamo - Ref: ${paymentRef}`,
                BANK_ACCOUNT: `REVERSA: Ingreso por Pago de Prestamo - Ref: ${paymentRef}`,
              },
            },
          ],
          globalDescriptions: {
            LOAN_PRINCIPAL: `REVERSA: Amortización de Capital - Ref: ${paymentRef}`,
            LOAN_INTEREST_INCOME: `REVERSA: Intereses de Prestamo - Ref: ${paymentRef}`,
            BANK_ACCOUNT: `REVERSA: Ingreso por Pago de Prestamo - Ref: ${paymentRef}`,
          },
        },
        tx,
      );
    } catch (error) {
      // Logueamos pero no bloqueamos la anulación si es un error de configuración contable
      // aunque lo ideal es que el usuario lo sepa.
      console.error('Error al generar asiento de reversa:', error);

      if (
        error instanceof BadRequestException &&
        error.message.includes('No existe una regla contable')
      ) {
        throw new BadRequestException(
          `Error en reversa contable: No existe una regla para procesar la anulación.`,
        );
      }
      throw error;
    }
  }

  // Función para recalcular el balance pendiente de un préstamo
  // Útil para obtener el balance actual, pero no directamente usada en la lógica de aplicar el pago completo
  private async _calculateBalancePending(loanId: number): Promise<number> {
    const loanAmortization = await this.db
      .select({
        quotaAmount: loanAmortizationSchedule.totalInstallmentAmount,
        paidAmount: loanAmortizationSchedule.paidAmount,
        quotaStatus: loanAmortizationSchedule.paymentStatus,
      })
      .from(loanAmortizationSchedule)
      .where(eq(loanAmortizationSchedule.loanId, loanId))
      .orderBy(
        sql<string>`
          CASE payment_status
            WHEN 'PARTIAL' THEN 1
            WHEN 'PENDING' THEN 2
            WHEN 'PAID' THEN 3
            ELSE 4
          END ASC,
          id ASC`,
      );

    const totalRemainingExact = loanAmortization.reduce((acc, item) => {
      const total = Number(item.quotaAmount);
      const paid = Number(item.paidAmount || 0);
      const remaining = total - paid;
      return acc + (remaining > EPSILON_COMPARISON ? remaining : 0);
    }, 0);

    return parseFloat(totalRemainingExact.toFixed(6));
  }

  // --- Función Principal para Calcular Cuotas Cubiertas (MODIFICADA) ---
  private async _calculateCoveredInstallments(
    loanId: number,
    amount: number, // Monto que el usuario está pagando
  ): Promise<{
    paidInstallmentDetails: {
      id: number;
      amount: number;
      principal: number;
      interest: number;
    }[];
    partialInstallment?: {
      id: number;
      paidAmount: number;
      originalPaidAmount: number;
      principal: number;
      interest: number;
    };
    remainingAmount: number;
  }> {
    const pendingInstallments =
      await this.db.query.loanAmortizationSchedule.findMany({
        where: and(
          eq(loanAmortizationSchedule.loanId, loanId),
          inArray(loanAmortizationSchedule.paymentStatus, [
            'PENDING',
            'PARTIAL',
          ]),
        ),
        orderBy: loanAmortizationSchedule.installmentNumber,
      });

    const paidInstallmentDetails: {
      id: number;
      amount: number;
      principal: number;
      interest: number;
    }[] = [];
    let partialInstallment:
      | {
          id: number;
          paidAmount: number;
          originalPaidAmount: number;
          principal: number;
          interest: number;
        }
      | undefined;

    let remainingPaymentAmount = amount;

    for (const installment of pendingInstallments) {
      const installmentTotal = Number(installment.totalInstallmentAmount);
      const installmentPaid = Number(installment.paidAmount || 0);
      let dueAmountExact = installmentTotal - installmentPaid;

      if (dueAmountExact <= EPSILON_COMPARISON) {
        continue;
      }

      // *** LÓGICA DE COMPARACIÓN MODIFICADA AQUÍ ***
      const diffBetweenPaymentAndDue = Math.abs(
        remainingPaymentAmount - dueAmountExact,
      );

      if (
        remainingPaymentAmount >= dueAmountExact - EPSILON_COMPARISON || // Suficiente para cubrir (incluyendo pequeñas diferencias flotantes)
        diffBetweenPaymentAndDue <= ROUNDING_ACCEPTANCE_TOLERANCE // O está muy cerca del monto exacto (dentro de la tolerancia)
      ) {
        // La cuota se cubre completamente.
        // Registramos el monto EXACTO que se debía para esta cuota.
        const totalInst = Number(installment.totalInstallmentAmount);
        const princInst = Number(installment.principalAmount);
        const intInst = Number(installment.interestAmount);
        const alreadyPaid = Number(installment.paidAmount || 0);

        // 1. Calculamos cuánto del interés ya se pagó y cuánto queda pendiente
        const interestPaidBefore = Math.min(alreadyPaid, intInst);
        const interestStillDue = Math.max(0, intInst - interestPaidBefore);

        // 2. Calculamos cuánto del capital ya se pagó (el excedente del interés) y cuánto queda pendiente
        const principalPaidBefore = Math.max(0, alreadyPaid - intInst);
        const principalStillDue = Math.max(0, princInst - principalPaidBefore);

        paidInstallmentDetails.push({
          id: installment.id,
          amount: totalInst, //parseFloat(dueAmountExact.toFixed(6)),
          principal: principalStillDue,
          interest: interestStillDue,
        });

        remainingPaymentAmount = Math.max(0, remainingPaymentAmount - dueAmountExact);

        if (remainingPaymentAmount > EPSILON_COMPARISON && remainingPaymentAmount <= ROUNDING_ACCEPTANCE_TOLERANCE) {
          remainingPaymentAmount = 0;
          break;
        }
      } else {
        // --- LA CUOTA SE PAGA PARCIALMENTE ---
        const princInst = Number(installment.principalAmount);
        const intInst = Number(installment.interestAmount);
        const alreadyPaid = Number(installment.paidAmount || 0);

        // Calculamos pendientes antes de este nuevo pago
        const interestPaidBefore = Math.min(alreadyPaid, intInst);
        const interestStillDue = Math.max(0, intInst - interestPaidBefore);

        let newInterestPaid = 0;
        let newPrincipalPaid = 0;

        // El nuevo pago cubre primero el interés pendiente
        if (remainingPaymentAmount <= interestStillDue) {
          newInterestPaid = remainingPaymentAmount;
          newPrincipalPaid = 0;
        } else {
          newInterestPaid = interestStillDue;
          newPrincipalPaid = remainingPaymentAmount - interestStillDue;
        }

        partialInstallment = {
          id: installment.id,
          paidAmount: parseFloat((alreadyPaid + remainingPaymentAmount).toFixed(6)),
          originalPaidAmount: alreadyPaid,
          principal: newPrincipalPaid,
          interest: newInterestPaid,
        };
        remainingPaymentAmount = 0;
        break;
      }

      if (remainingPaymentAmount <= EPSILON_COMPARISON) {
        remainingPaymentAmount = 0;
        break;
      }
    }

    if (
      remainingPaymentAmount < EPSILON_COMPARISON &&
      remainingPaymentAmount > -EPSILON_COMPARISON
    ) {
      remainingPaymentAmount = 0;
    }

    return {
      paidInstallmentDetails,
      partialInstallment,
      remainingAmount: parseFloat(remainingPaymentAmount.toFixed(6)),
    };
  }

  // --- Función Principal para Crear un Pago de Préstamo (sin cambios significativos en lógica, solo por completitud) ---
  async create(createLoanPaidDto: CreateLoanPaidDto, userId: number, tx?: NodePgDatabase<typeof schema>,liquidationActive?: boolean) {
    const {
      amount,
      bankId,
      loanId,
      paymentDate,
      paymentMethod,
      paymentType,
      comment,
      transactionReference,
    } = createLoanPaidDto;

    const db = tx || this.db;

    // --- VALIDACIÓN DE ESTADO DEL PRÉSTAMO ---
    const [loan] = await db
      .select({
        id: loans.id,
        companyId: loans.companyId,
        associateId: loans.associateId,
        status: loans.status,
        currencyCode: loans.currencyCode,
        associateFullname: associates.fullname,
      })
      .from(loans)
      .leftJoin(associates, eq(associates.id, loans.associateId))
      .where(eq(loans.id, loanId));

    if (!loan) {
      throw new NotFoundException(`The loan was not found.`);
    }

    if (
      loan.status !== LoanStatusEnum.DISBURSED &&
      loan.status !== LoanStatusEnum.IN_PAYMENT
    ) {
      throw new BadRequestException(
        `Payments cannot be made on loans with a status other than disbursed or in payment..`,
      );
    }
    // --- FIN DE LA VALIDACIÓN ---

    // Las líneas comentadas para moneda y tasa de cambio no son parte de la lógica central
    // de pago del crédito, pero las dejo si son necesarias para otras funcionalidades.
    // const setting = await this.db.query.systemSettings.findFirst({
    //   where: eq(systemSettings.key, 'moneda'),
    // });
    // const entryDate = new Date().toISOString().split('T')[0];
    // const exchangeRateData = await this.db.query.exchangeRates.findFirst({
    //   where: eq(exchangeRates.date, entryDate),
    // });

    const result = await this.db.transaction(async (tx) => {
      const { paidInstallmentDetails, partialInstallment, remainingAmount } =
        await this._calculateCoveredInstallments(loanId, amount);

      const currentBalanceCalculatedFromInstallments =
        await this._calculateBalancePending(loanId);

      const appliedAmountExact = amount - remainingAmount;

      let totalPrincipalPaid = 0;
      let totalInterestPaid = 0;

      let newBalancePending = Math.max(
        0,
        currentBalanceCalculatedFromInstallments - appliedAmountExact,
      );

      if (newBalancePending < EPSILON_COMPARISON) {
        newBalancePending = 0;
      }

      const customReference =
        await this.generateCodeService.generateNextReference('PRE-PAG');

      const [insertedPayment] = await tx
        .insert(loanPayments)
        .values({
          loanId: loanId,
          paymentDate,
          paymentType: paymentType || 'PAYING',
          amount: String(amount),
          balancePending: String(newBalancePending.toFixed(6)),
          bankId:
            bankId !== undefined && bankId !== null
              ? Number(bankId)
              : undefined,
          paymentMethod,
          transactionReference,
          comment,
          createdById: Number(userId),
          customReference: customReference,
          status: 'DONE',
        })
        .returning({
          id: loanPayments.id,
          customReference: loanPayments.customReference,
        });

      for (const installment of paidInstallmentDetails) {
        totalPrincipalPaid += installment.principal;
        totalInterestPaid += installment.interest;

        await tx.insert(loanPaymentsDetails).values({
          loanPaymentId: insertedPayment.id,
          installmentId: installment.id,
          amount: String(installment.amount),
          createdById: userId,
        });

        await tx
          .update(loanAmortizationSchedule)
          .set({
            paymentStatus: 'PAID',
            updatedById: Number(userId),
            paidAmount: sql`total_installment_amount`,
          })
          .where(eq(loanAmortizationSchedule.id, installment.id));
      }

      if (partialInstallment) {
        totalPrincipalPaid += partialInstallment.principal;
        totalInterestPaid += partialInstallment.interest;

        await tx
          .update(loanAmortizationSchedule)
          .set({
            paymentStatus: 'PARTIAL',
            paidAmount: String(partialInstallment.paidAmount),
            updatedById: Number(userId),
          })
          .where(eq(loanAmortizationSchedule.id, partialInstallment.id));

        const amountAppliedToPartial =
          partialInstallment.paidAmount - partialInstallment.originalPaidAmount;

        await tx.insert(loanPaymentsDetails).values({
          loanPaymentId: insertedPayment.id,
          installmentId: partialInstallment.id,
          amount: String(amountAppliedToPartial.toFixed(6)),
          createdById: Number(userId),
        });
      }

      let newLoanStatus: 'PAID' | 'IN_PAYMENT';
      let balanceInFavorValue = remainingAmount;

      if (newBalancePending <= 0) {
        newLoanStatus = 'PAID';
      } else {
        newLoanStatus = 'IN_PAYMENT';
      }

      // if (loan[0].status !== newLoanStatus) {
      //   await tx.insert(schema.loanStatusHistory).values({
      //     loanId: loan[0].id,
      //     status: newLoanStatus,
      //     changedByUserId: userId,
      //     comment: 'Loan update',
      //   });
      // }

      await tx
        .update(loans)
        .set({
          status: newLoanStatus,
          balanceInFavor: String(balanceInFavorValue.toFixed(6)),
          updatedById: Number(userId),
        })
        .where(eq(loans.id, loanId));

      const paylodAuditData = {
        loanId: String(loanId),
        paymentDate,
        paymentType,
        amount: amount,
        balancePending: String(newBalancePending.toFixed(6)),
        bankId:
          bankId !== undefined && bankId !== null ? Number(bankId) : undefined,
        paymentMethod,
        transactionReference,
        comment,
        createdById: Number(userId),
        customReference: insertedPayment.customReference,
      };


      if (!liquidationActive) {
        // 3. Asiento contable automático
        await this.generatePaymentAccountingEntry(
          userId,
          loan,
          appliedAmountExact,
          totalPrincipalPaid,
          totalInterestPaid,
          paymentDate ? new Date(paymentDate) : new Date(),
          tx,
        );

        // 4. Auditoría por evento
        this.eventEmitter.emit(
          'audit.log',
          new AuditLogEvent({
            tableName: 'loan_payments',
            recordId: String(insertedPayment.id),
            action: 'INSERT',
            userId: Number(userId),
            area: 'PRESTAMOS',
            description: `Pago de Préstamo registrado: ${loan.associateFullname} (Ref: ${insertedPayment.customReference})`,
            newData: [paylodAuditData],
          }),
        );
      }

      

      

      const resutAccount = await tx
        .select({
          id: associateAccounts.id,
        })
        .from(loans)
        .leftJoin(
          associateAccounts,
          eq(associateAccounts.associateId, loans.associateId),
        )
        .where(eq(loans.id, loanId));

      const payloadMovementLoan = {
        associateAccountId: Number(resutAccount[0].id),
        movementType: 'LOAN_PAYMENT_DEBIT' as AssociateMovementTypeEnum,
        amount: amount,
        currencyCode: 'VES' as CurrencyCodeEnum,
        transactionDate: paymentDate ? paymentDate : undefined,
        description: 'Pago Prestamo',
        referenceId: String(insertedPayment.id),
        referenceType: 'loansPayments',
        referenceNumber: insertedPayment.customReference ?? undefined,
        area: 'PRESTAMOS',
      };

      await this.associateAccountsMovementsService.create(
        userId,
        payloadMovementLoan,
        tx
      );

      if (bankId !== undefined && bankId !== null && !liquidationActive) {
        const dataBank = {
          movement: {
            bankAccountId: Number(bankId),
            transactionDate: paymentDate ?? new Date(),
            paymentMethod: paymentMethod as paymentMethodEnum,
            description: `Pago de Cuota Prestamo`,
            bankReference: transactionReference,
            category: 'LOAN_PAYMENT' as BankTransactionCategory,
            creditAmount: amount,
            debitAmount: 0,
            createdById: userId,
          },
          links: [
            {
              internalRecordType: 'LOAN_PAYMENT',
              internalRecordId: Number(resutAccount[0].id),
            },
          ],
        };
        await this.bankMovementsService.createAndReconcile(dataBank, userId, tx);
      }

      if (!liquidationActive){
        if (balanceInFavorValue > EPSILON_COMPARISON) {
          const payloadMovementLoanFavor = {
            associateAccountId: Number(resutAccount[0].id),
            movementType: 'LOAN_OVERPAYMENT_CREDIT' as AssociateMovementTypeEnum,
            amount: balanceInFavorValue,
            currencyCode: 'VES' as CurrencyCodeEnum,
            transactionDate: paymentDate ? paymentDate : undefined,
            description: 'Credito Sobregiro de Prestamo',
            referenceId: String(loanId),
            referenceType: 'loans',
            referenceNumber: undefined,
            area: 'PRESTAMOS',
          };
   
          await this.associateAccountsMovementsService.create(
            userId,
            payloadMovementLoanFavor,
            tx
          );
        }
      }

      return {
        transation: true,
        insertedPaymentId: insertedPayment.id,
        customReference: insertedPayment.customReference,
        balanceInFavorValue: balanceInFavorValue,
      };
    });

    return {
      message: 'Loan paid create success',
      transation: true,
      balanceInFavorValue: result.balanceInFavorValue,
      insertedPaymentId: result.insertedPaymentId,
      customReference: result.customReference,
    };
  }

  async downloadTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla de Pagos');

    worksheet.columns = [
      { header: 'cedula', key: 'cedula', width: 20 },
      { header: 'monto', key: 'monto', width: 15 },
      { header: 'fecha', key: 'fecha', width: 18 },
    ];

    // Formatear cabecera
    worksheet.getRow(1).font = { bold: true };

    // Agregar fila de ejemplo
    worksheet.addRow({
      cedula: 'V-12345678',
      monto: 1500.50,
      fecha: format(new Date(), 'yyyy-MM-dd'),
    });

    // Añadir validación/comentario sobre el formato de fecha si es necesario
    // Pero el usuario pidió año-mes-dia explícitamente en la fila de ejemplo

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async bulkUpload(
    file: Express.Multer.File, 
    userId: number
  ) {
    // 1. Procesar el Excel con exceljs
    if (!file) throw new BadRequestException('Archivo Excel no proporcionado');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    const worksheet = workbook.getWorksheet(1);
    const itemsFromExcel: { cedula: string; amount: number, fecha: string }[] = [];
    let finalPaymentDate
    if (!worksheet) throw new BadRequestException('No se encontró la hoja de trabajo en el Excel');
    
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Saltar encabezado
        const cedula = row.getCell(1).value?.toString().trim();
        const amountValue = row.getCell(2).value;
        const amount = typeof amountValue === 'number' ? amountValue : parseFloat(amountValue?.toString() || '0');
        const dateValue = row.getCell(3).value?.toString().trim();
        finalPaymentDate = dateValue ? new Date(dateValue) : new Date();

        // Obtener fecha de la columna 3
        let itemDate: Date;
        


        if (cedula && !isNaN(amount) && amount > 0) {
          itemsFromExcel.push({ 
            cedula, 
            amount, 
            fecha: finalPaymentDate 
          });
        }
      }
    });

    if (itemsFromExcel.length === 0) throw new BadRequestException('El archivo Excel está vacío o no tiene el formato correcto (Col 1: Cedula, Col 2: Monto, Col 3: Fecha)');

    const results = {
      success: [] as any[],
      errors: [] as any[],
      totalProcessed: 0,
    };

   

    const result = await this.db.transaction(async (tx) => {
      let bulkTotalPrincipal = 0;
      let bulkTotalInterest = 0;
      let totalAmountApplied = 0;
      const accountingItemsForEntry: any[] = [];
      let companyIdFirst = 1;

      for (const item of itemsFromExcel) {
        try {
          // 1. Buscar asociado por cédula
          const [associate] = await tx
            .select({ id: associates.id, fullname: associates.fullname })
            .from(associates)
            .where(eq(associates.cedula, item.cedula));

          if (!associate) {
            results.errors.push({ cedula: item.cedula, error: 'Asociado no encontrado' });
            continue;
          }

          // 2. Buscar préstamo activo
          const [loan] = await tx
            .select({ id: loans.id, currencyCode: loans.currencyCode, companyId: loans.companyId })
            .from(loans)
            .where(
              and(
                eq(loans.associateId, associate.id),
                inArray(loans.status, [LoanStatusEnum.DISBURSED, LoanStatusEnum.IN_PAYMENT])
              )
            );

          if (!loan) {
            results.errors.push({ cedula: item.cedula, error: 'No se encontró préstamo activo' });
            continue;
          }
          
          companyIdFirst = loan.companyId ?? companyIdFirst;

          // 3. Procesar el pago
          const { paidInstallmentDetails, partialInstallment, remainingAmount } = 
            await this._calculateCoveredInstallments(loan.id, item.amount);

          const appliedAmountExact = item.amount - remainingAmount;
          if (appliedAmountExact <= 0) {
            results.errors.push({ cedula: item.cedula, error: 'Monto insuficiente para abonar' });
            continue;
          }

          const currentBalance = await this._calculateBalancePending(loan.id);
          let newBalancePending = Math.max(0, currentBalance - appliedAmountExact);
          if (newBalancePending < EPSILON_COMPARISON) newBalancePending = 0;

          // 4. Registrar Pago Individual
          const customReference = await this.generateCodeService.generateNextReference('PRE-PAG');
          const [insertedPayment] = await tx
            .insert(loanPayments)
            .values({
              loanId: loan.id,
              paymentDate: new Date(item.fecha),
              paymentType: 'PAYING' as loanPaymetTypeEnum,
              amount: String(item.amount),
              balancePending: String(newBalancePending.toFixed(6)),
              paymentMethod: 'BANK_TRANSFER' as paymentMethodEnum,
              transactionReference: customReference,
              comment: 'Carga Masiva Excel',
              createdById: Number(userId),
              customReference,
              status: 'DONE',
            })
            .returning({ id: loanPayments.id, customReference: loanPayments.customReference });

          let localPrincipal = 0;
          let localInterest = 0;

          for (const inst of paidInstallmentDetails) {
            localPrincipal += inst.principal;
            localInterest += inst.interest;

            await tx.insert(loanPaymentsDetails).values({
              loanPaymentId: insertedPayment.id,
              installmentId: inst.id,
              amount: String(inst.amount),
              createdById: userId,
            });

            await tx.update(loanAmortizationSchedule).set({
                paymentStatus: 'PAID',
                paidAmount: sql`total_installment_amount`,
                updatedById: Number(userId),
              }).where(eq(loanAmortizationSchedule.id, inst.id));
          }

          if (partialInstallment) {
            localPrincipal += partialInstallment.principal;
            localInterest += partialInstallment.interest;

            await tx.update(loanAmortizationSchedule).set({
                paymentStatus: 'PARTIAL',
                paidAmount: String(partialInstallment.paidAmount),
                updatedById: Number(userId),
              }).where(eq(loanAmortizationSchedule.id, partialInstallment.id));

            await tx.insert(loanPaymentsDetails).values({
              loanPaymentId: insertedPayment.id,
              installmentId: partialInstallment.id,
              amount: String((partialInstallment.paidAmount - partialInstallment.originalPaidAmount).toFixed(6)),
              createdById: Number(userId),
            });
          }

          await tx.update(loans).set({
              status: newBalancePending <= 0 ? 'PAID' : 'IN_PAYMENT',
              balanceInFavor: String(remainingAmount.toFixed(6)),
              updatedById: Number(userId),
            }).where(eq(loans.id, loan.id));

          // 5. Movimientos de Cuenta Individual
          const [acc] = await tx.select({ id: associateAccounts.id }).from(associateAccounts).where(eq(associateAccounts.associateId, associate.id));
          if (acc) {
            await this.associateAccountsMovementsService.create(userId, {
              associateAccountId: Number(acc.id),
              movementType: AssociateMovementTypeEnum.LOAN_PAYMENT_DEBIT,
              amount: item.amount,
              currencyCode: (loan.currencyCode ?? 'VES') as CurrencyCodeEnum,
              transactionDate: new Date(item.fecha),
              description: 'Pago Préstamo (Carga Masiva Excel)',
              referenceId: String(insertedPayment.id),
              referenceType: 'loansPayments',
            }, tx);
          }

          // 1. Calcular el pago exacto que se va a aplicar contablemente y redondear a 2 decimales
          const roundedPayment = Number(appliedAmountExact.toFixed(2));
          const roundedInterest = Number(localInterest.toFixed(2));
          // 2. El capital será la diferencia (plug) para asegurar el cuadre exacto a nivel contable (2 decimales)
          const roundedPrincipal = Number((roundedPayment - roundedInterest).toFixed(2));

          // GUARDAR PARA EL ASIENTO DETALLADO (Auxiliar por asociado)
          accountingItemsForEntry.push({
            associateId: associate.id,
            amounts: {
              LOAN_PRINCIPAL: roundedPrincipal,
              LOAN_INTEREST_INCOME: roundedInterest,
            },
            descriptions: {
              LOAN_PRINCIPAL: `Amortización de Capital - Préstamo del Asociado ${associate.fullname}`,
              LOAN_INTEREST_INCOME: `Intereses - Préstamo del Asociado ${associate.fullname}`,
            },
          });

          bulkTotalPrincipal += roundedPrincipal;
          bulkTotalInterest += roundedInterest;
          totalAmountApplied += roundedPayment;
          results.success.push({ cedula: item.cedula, ref: insertedPayment.customReference });
          results.totalProcessed++;

        } catch (err) {
          results.errors.push({
            cedula: item.cedula,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // --- 6. ASIENTO CONTABLE CONSOLIDADO PERO DETALLADO POR AUXILIAR ---
      if (results.totalProcessed > 0) {
        const roundedTotalPayment = Number(totalAmountApplied.toFixed(2));
        
        // Agregamos la línea de BANCO consolidada al final de la lista de items
        accountingItemsForEntry.push({
          associateId: 0, // Sin auxiliar específico para el banco (consolidado)
          amounts: {
            BANK_ACCOUNT: roundedTotalPayment,
          },
          descriptions: {
            BANK_ACCOUNT: `Ingreso por Pagos de Préstamos (${results.totalProcessed} registros)`,
          },
        });

        await this.accountingEntriesService.createAutomaticEntry(userId, {
            companyId: companyIdFirst,
            category: 'SAVINGS_BANK',
            operationType: 'LOAN_PAYMENT',
            description: `Carga Pagos de Préstamos - ${results.totalProcessed} registros`,
            entryDate: finalPaymentDate,
            currencyCode: CurrencyCodeEnum.VES,
            originType: 'LOAN_PAYMENT',
            items: accountingItemsForEntry
        }, tx);

        // // --- 7. MOVIMIENTO BANCARIO ÚNICO ---
        // await this.bankMovementsService.createAndReconcile({
        //   movement: {
        //     bankAccountId: Number(createBulkLoanPaidDto.bankId),
        //     transactionDate: finalPaymentDate,
        //     paymentMethod: createBulkLoanPaidDto.paymentMethod as paymentMethodEnum,
        //     description: `Carga Masiva Préstamos (${results.totalProcessed} registros)`,
        //     bankReference: createBulkLoanPaidDto.transactionReference ?? 'MASIVA-EXCEL',
        //     category: 'LOAN_PAYMENT' as BankTransactionCategory,
        //     creditAmount: totalAmountApplied,
        //     debitAmount: 0,
        //     createdById: userId,
        //   },
        //   links: [{ internalRecordType: 'LOAN_PAYMENT', internalRecordId: 0 }]
        // }, userId, tx);
      }

      return results;
    });

    return result;
  }

  async findAll(paginationDto: FilterLoanPaidDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      bank = '',
      type = '',
      method = '',
    } = paginationDto || {};

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(ilike(loanPayments.customReference, `%${search}%`));
    }

    if (bank !== '') {
      searchConditions.push(eq(loanPayments.bankId, Number(bank)));
    }

    if (type !== '') {
      searchConditions.push(
        eq(loanPayments.paymentType, type as loanPaymetTypeEnum),
      );
    }

    if (method) {
      searchConditions.push(
        eq(loanPayments.paymentMethod, method as paymentMethodEnum),
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${loanPayments[sortBy as keyof typeof loanPayments]} asc`
        : sql`${loanPayments[sortBy as keyof typeof loanPayments]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(loanPayments)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.db
      .select({
        id: loanPayments.id,
        customReference: loanPayments.customReference,
        paymentDate: loanPayments.paymentDate,
        paymentType: loanPayments.paymentType,
        paymentMethod: loanPayments.paymentMethod,
        bankName: bankDirectory.name,
        transactionReference: loanPayments.transactionReference,
        amount: loanPayments.amount,
        balancePending: loanPayments.balancePending,
        associateCedula: associates.cedula,
        associateFullname: associates.fullname,
        paymentStatus: loanPayments.status,
      })
      .from(loanPayments)
      .where(searchCondition)
      .leftJoin(bankDirectory, eq(bankDirectory.id, loanPayments.bankId))
      .leftJoin(loans, eq(loans.id, loanPayments.loanId))
      .leftJoin(associates, eq(associates.id, loans.associateId))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const trnasformData = data.map((item) => ({
      ...item,
      amount: Number(item.amount).toFixed(2), // Redondea a 6 decimales
      balancePending: Number(item.balancePending).toFixed(2), // Redondea a
    }));

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
      data: trnasformData,
      meta,
    };
  }

  async findOneRequest(cedula: string) {
    const associate = await this.db
      .select({
        id: associates.id,
        cedula: associates.cedula,
        fullname: associates.fullname,
        phone: associates.phone,
        email: associates.email,
        status: associates.status,
      })
      .from(associates)
      .where(eq(associates.cedula, cedula));

    if (!associate.length) {
      throw new NotFoundException(`Associate with cedula ${cedula} not found`);
    }
    if (associate[0].status === 'INACTIVE') {
      throw new NotFoundException(
        `Associate with cedula ${cedula} is inactive`,
      );
    }

    if (associate[0].status === 'RETIRED') {
      throw new NotFoundException(`Associate with cedula ${cedula} is retired`);
    }

    const result = await this.db
      .select({
        loanId: loans.id,
        loanType: loanTypes.name,
        loanTotalAmount: loans.totalPayable,
        loanModality: loans.loanModality,
        status: loans.status,
      })
      .from(loans)
      .where(
        and(
          eq(loans.associateId, associate[0].id),
          ne(loans.status, LoanStatusEnum.PAID),
          ne(loans.status, LoanStatusEnum.CANCELLED),
        ),
      )
      .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id))
      .leftJoin(
        loanAmortizationSchedule,
        eq(loans.id, loanAmortizationSchedule.loanId),
      );

    const loanAmortization = await this.db
      .select({
        id: loanAmortizationSchedule.id,
        quotaNumber: loanAmortizationSchedule.installmentNumber,
        quotaAmount: loanAmortizationSchedule.totalInstallmentAmount,
        quotaDate: loanAmortizationSchedule.dueDate,
        quotaStatus: loanAmortizationSchedule.paymentStatus,
        quotaPartial: loanAmortizationSchedule.paidAmount,
        principalBalancePending:
          loanAmortizationSchedule.principalBalancePending,
        paidAmount: loanAmortizationSchedule.paidAmount,
      })
      .from(loanAmortizationSchedule)
      .where(eq(loanAmortizationSchedule.loanId, result[0]?.loanId))
      .orderBy(sql<string>`
    CASE payment_status
      WHEN 'PARTIAL' THEN 1
      WHEN 'PENDING' THEN 2
      WHEN 'PAID' THEN 3
      ELSE 4
    END ASC,
    id ASC`);
    console.log(loanAmortization);

    const pendingQuotas = loanAmortization.filter(
      (item) => item.quotaStatus === 'PENDING',
    );

    const partialQuotas = loanAmortization.filter(
      (item) => item.quotaStatus === 'PARTIAL',
    );

    // Sumar todas las cuotas PENDING directamente
    const totalPending = pendingQuotas.reduce((acc, item) => {
      const amount = Number(item.quotaAmount) || 0;
      return acc + amount;
    }, 0);

    // Para cuotas PARTIAL, sumar (totalInstallmentAmount - paidAmount)
    const totalPartial = partialQuotas.reduce((acc, item) => {
      const totalAmount = Number(item.quotaAmount) || 0;
      const paidAmount = Number(item.paidAmount) || 0;
      const remaining = totalAmount - paidAmount;
      return acc + (remaining > 0 ? remaining : 0); // evitar negativos
    }, 0);
    // Suma final
    const totalPendingAmount = totalPending + totalPartial;

    if (associate.length === 0) {
      throw new InternalServerErrorException(
        'No active associate found with the provided cedula.',
      );
    }

    const transformLoandAdmortization = loanAmortization.map((item) => ({
      ...item,
      principalBalancePending: Number(item.principalBalancePending).toFixed(2),
      quotaAmount: Number(item.quotaAmount).toFixed(2),
    }));

    return {
      id: associate[0].id,
      cedula: associate[0].cedula,
      fullname: associate[0].fullname,
      phone: associate[0].phone,
      email: associate[0].email,
      loanId: result.length === 0 ? null : result[0]?.loanId,
      loanType: result.length === 0 ? null : result[0]?.loanType,
      loanTotalAmount: String(totalPendingAmount.toFixed(2)),
      loanModality: result.length === 0 ? null : result[0]?.loanModality,
      loanAmortization: transformLoandAdmortization || null,
      loanStatus: result.length === 0 ? null : result[0]?.status,
    };
  }

  async remove(paymentId: number, userId: number) {
    return await this.db.transaction(async (tx) => {
      // 1. Validar que el pago existe y no está ya cancelado

      const [payment] = await tx
        .select({
          id: loanPayments.id,
          amount: loanPayments.amount,
          customReference: loanPayments.customReference,
          loanId: loanPayments.loanId,
          statusPayment: loanPayments.status,
          associateId: loans.associateId,
          companyId: loans.companyId,
          currencyCode: loans.currencyCode,
          associateFullname: associates.fullname,
        })
        .from(loanPayments)
        .leftJoin(loans, eq(loans.id, loanPayments.loanId))
        .leftJoin(associates, eq(associates.id, loans.associateId))
        .where(eq(loanPayments.id, paymentId));

      if (typeof payment?.loanId === 'undefined') {
        throw new InternalServerErrorException(
          'The payment does not have a valid loanId.',
        );
      }
      const paymetCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(loanPayments)
        .where(
          and(
            eq(loanPayments.loanId, payment.loanId),
            eq(loanPayments.status, 'DONE'),
          ),
        );

      if (!payment) {
        throw new NotFoundException(`The payment was not found.`);
      }

      if (payment.statusPayment === 'CANCELED') {
        throw new BadRequestException(
          'This payment has already been cancelled.',
        );
      }

      // 2. Obtener los detalles del pago para saber qué cuotas se afectaron
      const paymentDetails = await tx.query.loanPaymentsDetails.findMany({
        where: eq(loanPaymentsDetails.loanPaymentId, paymentId),
      });

      let totalPrincipalReverted = 0;
      let totalInterestReverted = 0;

      // 3. Revertir cada cuota afectada
      for (const detail of paymentDetails) {
        const installmentId = detail.installmentId;
        const amountToRevert = Number(detail.amount);

        if (installmentId == null) {
          throw new InternalServerErrorException(
            'installmentId is null or undefined.',
          );
        }

        await tx
          .update(loanPaymentsDetails)
          .set({ status: 'CANCELED' })
          .where(eq(loanPaymentsDetails.id, detail.id));

        const currentInstallment =
          await tx.query.loanAmortizationSchedule.findFirst({
            where: eq(loanAmortizationSchedule.id, Number(installmentId)),
          });

        if (currentInstallment) {
          const installmentPaid = Number(currentInstallment.paidAmount);
          const installmentInterest = Number(currentInstallment.interestAmount);

          // Lógica de desglose para reversa contable:
          // El capital pagado en esta cuota (antes de la reversa)
          const principalInInstallmentBefore = Math.max(
            0,
            installmentPaid - installmentInterest,
          );

          // Al revertir el pago de una cuota, primero descontamos del capital
          // (ya que en la aplicación del pago, el capital es lo último que se cubre)
          const principalReverted = Math.min(
            amountToRevert,
            principalInInstallmentBefore,
          );
          const interestReverted = amountToRevert - principalReverted;

          totalPrincipalReverted += principalReverted;
          totalInterestReverted += interestReverted;

          const newPaidAmount = Math.max(
            0,
            Number(currentInstallment.paidAmount) - amountToRevert,
          );

          let newStatus: 'PENDING' | 'PARTIAL' = 'PENDING';
          if (newPaidAmount > 0) {
            newStatus = 'PARTIAL';
          }

          await tx
            .update(loanAmortizationSchedule)
            .set({
              paidAmount: String(newPaidAmount),
              paymentStatus: newStatus,
              updatedById: userId,
            })
            .where(eq(loanAmortizationSchedule.id, installmentId));
        }
      }

      // 4. Actualizar el estado general del préstamo
      const loanId = payment.loanId;
      let newStatusLoan;

      if (Number(paymetCount[0].count) === 1) {
        newStatusLoan = 'DISBURSED';
      } else {
        newStatusLoan = 'IN_PAYMENT';
      }
      await tx
        .update(loans)
        .set({
          status: newStatusLoan, // El préstamo vuelve a estar en pago o desembolsado
          updatedById: userId,
        })
        .where(eq(loans.id, loanId));

      // 5. Actualizar el estado del pago a CANCELADO
      await tx
        .update(loanPayments)
        .set({
          status: 'CANCELED',
          updatedById: userId,
        })
        .where(eq(loanPayments.id, paymentId));

      // 6. Revertir el movimiento en la cuenta del asociado
      const associateAccount = await tx.query.associateAccounts.findFirst({
        where: eq(associateAccounts.associateId, payment?.associateId ?? 0),
      });

      if (associateAccount) {
        await this.associateAccountsMovementsService.create(
          userId,
          {
            associateAccountId: associateAccount.id,
            movementType:
              'LOAN_PAYMENT_REVERSAL_CREDIT' as AssociateMovementTypeEnum,
            amount: Number(payment.amount),
            currencyCode: 'VES' as CurrencyCodeEnum,
            description: `REVERSO PAGO PRESTAMO - REF: ${payment.customReference}`,
            referenceId: String(payment.id),
            referenceType: 'loanPayments',
            area: 'PRESTAMOS',
          },
          tx,
        );
      }

      // 7. Generar Asiento Contable de Reversa
      await this.generatePaymentReversalAccountingEntry(
        userId,
        {
          id: payment.loanId,
          companyId: payment.companyId!,
          associateId: payment.associateId!,
          currencyCode: payment.currencyCode,
          associateFullname: payment.associateFullname,
        },
        Number(payment.amount),
        totalPrincipalReverted,
        totalInterestReverted,
        tx,
        payment.customReference!,
      );

      // 8. Registrar en auditoría por evento
      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'loan_payments',
          recordId: String(paymentId),
          action: 'CANCELED',
          userId: Number(userId),
          area: 'PRESTAMOS',
          description: `Cancelación del pago ${payment.customReference}`,
          newData: [{ status: 'CANCELED' }],
        }),
      );

      return {
        message: `The payment ${payment.customReference} has been successfully cancelled.`,
      };
    });
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Generación de Reporte PDF
  // ──────────────────────────────────────────────────────────────────────────────

  async getReportsPdf(paginationDto?: FilterLoanPaidDto) {
    let rawData: any[];

    if (paginationDto) {
      // Si usas un findAll existente, extraemos los datos
      const payload = await this.findAll({
        ...paginationDto,
        limit: paginationDto.search ? 99999 : (paginationDto.limit ?? 99999), 
      });
      rawData = payload.data;
    } else {
      // Consulta directa simple si no hay filtros
      rawData = await this.db
        .select({
          id: loanPayments.id,
          customReference: loanPayments.customReference,
          paymentDate: loanPayments.paymentDate,
          paymentType: loanPayments.paymentType,
          paymentMethod: loanPayments.paymentMethod,
          bankName: bankDirectory.name,
          transactionReference: loanPayments.transactionReference,
          amount: loanPayments.amount,
          balancePending: loanPayments.balancePending,
          associateCedula: associates.cedula,
          associateFullname: associates.fullname,
          paymentStatus: loanPayments.status,
        })
        .from(loanPayments)
        .leftJoin(bankDirectory, eq(bankDirectory.id, loanPayments.bankId))
        .leftJoin(loans, eq(loans.id, loanPayments.loanId))
        .leftJoin(associates, eq(associates.id, loans.associateId))
        .orderBy(sql`${loanPayments.id} desc`)
        .limit(1000); 
    }

    const paymentTypeMapper: Record<string, string> = {
      PAYING: 'Pago Cuota',
      CANCELLATION: 'Cancelación Pago',
    };

    const paymentStatusMapper: Record<string, string> = {
      DONE: 'Pagado',
      CANCELED: 'Anulado'
    };

    // Transformamos los datos al formato que espera la tabla de pdfmake
    const tableBody = [
      // Fila 1: Encabezados
      ['Referencia', 'Fecha', 'Cédula', 'Asociado', 'Monto', 'Tipo', 'Estado'],
      // Filas de datos mapeadas
      ...rawData.map((item) => [
        item.customReference ?? 'N/A',
        item.paymentDate ? format(new Date(item.paymentDate), 'dd/MM/yyyy') : 'N/A',
        item.associateCedula ?? 'N/A',
        item.associateFullname ?? 'N/A',
        item.amount ? `${Number(item.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : '0,00',
        item.paymentType ? paymentTypeMapper[item.paymentType] || item.paymentType : 'N/A',
        item.paymentStatus ? paymentStatusMapper[item.paymentStatus] || item.paymentStatus : 'N/A',
      ]),
    ];

    const content = {
      table: {
        headerRows: 1,
        widths: [80, 60, 60, '*', 70, 70, 60],
        body: tableBody,
      },
      layout: 'lightHorizontalLines',
    };

    return this.pdfService.generateReport('LISTADO DE PAGOS DE PRÉSTAMOS', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }

  async applyPaymentFromBankReconciliation(
    paymentId: number,
    tx: NodePgDatabase<typeof schema>,
  ) {
    await tx
      .update(loanPayments)
      .set({ status: 'DONE' })
      .where(eq(loanPayments.id, paymentId));
  }
}

