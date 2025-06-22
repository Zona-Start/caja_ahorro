import { generateUniqueReference } from '@/common/utils/reference';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  associateAccounts,
  associates,
  auditLogs,
  bankDirectory,
  loanAmortizationSchedule,
  loanPayments,
  loanPaymentsDetails,
  loans,
  loanTypes,
} from '@/database/index';
import {
  AssociateMovementTypeEnum,
  CurrencyCodeEnum,
  loanPaymetTypeEnum,
  LoanStatusEnum,
  paymentMethodEnum,
} from '@/types/enum';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, ne, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import { CreateLoanPaidDto } from './dto/create-loan.dto';
import { FilterLoanPaidDto } from './dto/filter-loan-paid.dto';

// Define una tolerancia para comparar montos monetarios después de redondeo.
// Esto es para CUADRAR el pago si hay una diferencia mínima causada por el toFixed(2) del usuario.
// Por ejemplo, si la cuota es 17.666667 y el usuario paga 17.67, la diferencia es 0.003333.
// Queremos que 17.67 sea "suficiente" para 17.666667.
const ROUNDING_ACCEPTANCE_TOLERANCE = 0.005; // Permite hasta medio centavo de ajuste
const EPSILON_COMPARISON = 0.050000; // Para errores de punto flotante muy pequeños


@Injectable()
export class LoanPaidService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
  ) {}

  // --- Helper function to generate custom reference ---
  // private async generateCustomReference(): Promise<string> {
  //   // Fetch the current correlative number and increment it
  //   const key = 'correlativo_pago_prestamo';
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
  //     return `PGPRES${result}`; // Prefix the reference
  //   } catch (error) {
  //     console.error('Error generating custom reference:', error);
  //     throw new InternalServerErrorException(
  //       'Failed to generate custom loan reference.',
  //     );
  //   }
  // }


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
    paidInstallmentDetails: { id: number; amount: number }[];
    partialInstallment?: { id: number; paidAmount: number; originalPaidAmount: number };
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

    const paidInstallmentDetails: { id: number; amount: number }[] = [];
    let partialInstallment: { id: number; paidAmount: number; originalPaidAmount: number } | undefined;

    let remainingPaymentAmount = amount; 

    for (const installment of pendingInstallments) {
      const installmentTotal = Number(installment.totalInstallmentAmount);
      const installmentPaid = Number(installment.paidAmount || 0);
      let dueAmountExact = installmentTotal - installmentPaid; 

      if (dueAmountExact <= EPSILON_COMPARISON) {
        continue;
      }

      // *** LÓGICA DE COMPARACIÓN MODIFICADA AQUÍ ***
      const diffBetweenPaymentAndDue = Math.abs(remainingPaymentAmount - dueAmountExact);

      if (
        remainingPaymentAmount >= dueAmountExact - EPSILON_COMPARISON || // Suficiente para cubrir (incluyendo pequeñas diferencias flotantes)
        diffBetweenPaymentAndDue <= ROUNDING_ACCEPTANCE_TOLERANCE // O está muy cerca del monto exacto (dentro de la tolerancia)
      ) {
        // La cuota se cubre completamente.
        // Registramos el monto EXACTO que se debía para esta cuota.
        paidInstallmentDetails.push({
          id: installment.id,
          amount: parseFloat(dueAmountExact.toFixed(6)), 
        });

        // Ajustamos el remainingPaymentAmount del pago.
        // Si el pago era ligeramente mayor, se reduce por el dueAmountExact.
        // Si el pago era ligeramente menor, se considera que se consumió todo para completar la cuota.
        remainingPaymentAmount = Math.max(0, remainingPaymentAmount - dueAmountExact);

        // Si después de completar una cuota, el `remainingPaymentAmount` es un valor pequeño
        // (por ejemplo, el resultado de una resta de flotantes muy cercanos, o el exceso absorbido)
        // lo forzamos a 0 para que no quede un "saldo a favor" insignificante.
        if (
          remainingPaymentAmount > EPSILON_COMPARISON &&
          remainingPaymentAmount <= ROUNDING_ACCEPTANCE_TOLERANCE
        ) {
          remainingPaymentAmount = 0; 
          break; // Se absorbe el remanente, no hay más para procesar.
        }
      } else {
        // La cuota se paga parcialmente.
        partialInstallment = {
          id: installment.id,
          paidAmount: parseFloat(
            (installmentPaid + remainingPaymentAmount).toFixed(6),
          ),
          originalPaidAmount: installmentPaid, 
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
  async create(createLoanPaidDto: CreateLoanPaidDto, userId: number) {
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

      const currentBalanceCalculatedFromInstallments = await this._calculateBalancePending(loanId);

      const appliedAmountExact = amount - remainingAmount;

      let newBalancePending = Math.max(
        0,
        currentBalanceCalculatedFromInstallments - appliedAmountExact,
      );

      if (newBalancePending < EPSILON_COMPARISON) {
        newBalancePending = 0;
      }
      
      const customReference = generateUniqueReference();

      const [insertedPayment] = await tx
        .insert(loanPayments)
        .values({
          loanId: String(loanId),
          paymentDate,
          paymentType,
          amount: amount,
          balancePending: String(newBalancePending.toFixed(6)), 
          bankId: bankId !== undefined && bankId !== null ? Number(bankId) : undefined,
          paymentMethod,
          transactionReference,
          comment,
          createdById: Number(userId),
          customReference: customReference,
        })
        .returning({
          id: loanPayments.id,
          customReference: loanPayments.customReference,
        });

      for (const installment of paidInstallmentDetails) {
        await tx.insert(loanPaymentsDetails).values({
          loanPaymentId: String(insertedPayment.id),
          installmentId: String(installment.id),
          amount: String(installment.amount),
          createdById: String(userId),
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
        await tx
          .update(loanAmortizationSchedule)
          .set({
            paymentStatus: 'PARTIAL',
            paidAmount: String(partialInstallment.paidAmount),
            updatedById: Number(userId),
          })
          .where(eq(loanAmortizationSchedule.id, partialInstallment.id));

        const amountAppliedToPartial = partialInstallment.paidAmount - partialInstallment.originalPaidAmount;

        await tx.insert(loanPaymentsDetails).values({
          loanPaymentId: String(insertedPayment.id),
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
        bankId: bankId !== undefined && bankId !== null ? Number(bankId) : undefined,
        paymentMethod,
        transactionReference,
        comment,
        createdById: Number(userId),
        customReference: customReference,
      };

      await tx.insert(auditLogs).values({
        tableName: 'loansPayments',
        recordId: String(insertedPayment.id),
        action: 'INSERT',
        userId: Number(userId),
        area: 'PRESTAMOS',
        description: 'PAGO PRESTAMOS',
        newData: [paylodAuditData],
      });

      return {
        transation: true,
        insertedPaymentId: insertedPayment.id,
        customReference: insertedPayment.customReference,
        balanceInFavorValue: balanceInFavorValue,
      };
    });

    if (result.transation) {
      const resutAccount = await this.db
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
        description: 'PAGO PRESTAMO',
        referenceId: String(result.insertedPaymentId),
        referenceType: 'loansPayments',
        referenceNumber: result.customReference ?? undefined,
        area: 'PRESTAMOS',
      };

      await this.associateAccountsMovementsService.create(
        userId,
        payloadMovementLoan,
      );

      if (result.balanceInFavorValue > EPSILON_COMPARISON) {
        const payloadMovementLoanFavor = {
          associateAccountId: Number(resutAccount[0].id),
          movementType: 'LOAN_OVERPAYMENT_CREDIT' as AssociateMovementTypeEnum,
          amount: result.balanceInFavorValue,
          currencyCode: 'VES' as CurrencyCodeEnum,
          transactionDate: paymentDate ? paymentDate : undefined,
          description: 'CREDITO SOBREGIRO DE PRESTAMO',
          referenceId: String(loanId),
          referenceType: 'loans',
          referenceNumber: undefined,
          area: 'PRESTAMOS',
        };

        await this.associateAccountsMovementsService.create(
          userId,
          payloadMovementLoanFavor,
        );
      }
    }

    return {
      message: 'Loan paid create success',
      transation: true,
      balanceInFavorValue: result.balanceInFavorValue,
      insertedPaymentId: result.insertedPaymentId,
      customReference: result.customReference,
    };
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
      balancePending: Number(item.balancePending).toFixed(2),  // Redondea a
    }))

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

  // async findRequestByEdit(id: number) {
  //   // Get paginated data
  //   const [data] = await this.db
  //     .select({
  //       id: loans.id,
  //       associateId: loans.associateId,
  //       associateCedula: associates.cedula,
  //       associateFullname: associates.fullname,
  //       associatePhone: associates.phone,
  //       associateEmail: associates.email,
  //       associateDateAdmission: associates.dateAdmission,
  //       associateIsPayrollCredit: associates.isPayrollCredit,
  //       associateAccountId: associateAccounts.id,
  //       associateAccountNumber: associateAccounts.accountNumber,
  //       associateBalance: associateAccounts.balance,
  //       loanTypeId: loans.loanTypeId,
  //       loanModality: loans.loanModality,
  //       loanTypeName: loanTypes.name,
  //       requestDate: loans.requestDate,
  //       approvalDate: loans.approvalDate,
  //       disbursementDate: loans.disbursementDate,
  //       requestedAmount: loans.requestedAmount,
  //       approvedAmount: loans.approvedAmount,
  //       disbursedAmount: loans.disbursedAmount,
  //       startDate: loans.startDate,
  //       endDate: loans.endDate,
  //       totalInterest: loans.totalInterest,
  //       totalPayable: loans.totalPayable,
  //       expensesAmount: loans.expensesAmount,
  //       overdraftAmount: loans.overdraftAmount,
  //       previousLoanId: loans.previousLoanId,
  //       paymentMethod: loans.paymentMethod,
  //       disbursementAccountId: loans.disbursementAccountId,
  //       status: loans.status,
  //       rejectionReason: loans.rejectionReason,
  //       approvedByUserId: loans.approvedByUserId,
  //       disbursedByUserId: loans.disbursedByUserId,
  //       notes: loans.notes,
  //       customReference: loans.customReference,
  //       currencyCode: loans.currencyCode,
  //       exchangeRateId: loans.exchangeRateId,
  //     })
  //     .from(loans)
  //     .where(eq(loans.id, id))
  //     .leftJoin(associates, eq(loans.associateId, associates.id))
  //     .leftJoin(
  //       associateAccounts,
  //       eq(loans.associateId, associateAccounts.associateId),
  //     )
  //     .leftJoin(loanTypes, eq(loans.loanTypeId, loanTypes.id));

  //   const [{ count: total }] = await this.db
  //     .select({
  //       count: count(),
  //     })
  //     .from(loans)
  //     .where(
  //       and(
  //         eq(loans.associateId, data.associateId),
  //         ne(loans.status, LoanStatusEnum.PAID),
  //       ),
  //     );

  //   return {
  //     id: data.id,
  //     associateId: data.associateId,
  //     associateCedula: data.associateCedula,
  //     associateFullname: data.associateFullname,
  //     associatePhone: data.associatePhone,
  //     associateEmail: data.associateEmail,
  //     associateDateAdmission: data.associateDateAdmission,
  //     associateIsPayrollCredit: data.associateIsPayrollCredit,
  //     associateAccountId: data.associateAccountId,
  //     associateAccountNumber: data.associateAccountNumber,
  //     associateBalance: data.associateBalance,
  //     loanTypeId: data.loanTypeId,
  //     loanModality: data.loanModality,
  //     loanTypeName: data.loanTypeName,
  //     requestDate: data.requestDate,
  //     approvalDate: data.approvalDate,
  //     disbursementDate: data.disbursementDate,
  //     requestedAmount: data.requestedAmount,
  //     approvedAmount: data.approvedAmount,
  //     disbursedAmount: data.disbursedAmount,
  //     startDate: data.startDate,
  //     endDate: data.endDate,
  //     totalInterest: data.totalInterest,
  //     totalPayable: data.totalPayable,
  //     expensesAmount: data.expensesAmount,
  //     overdraftAmount: data.overdraftAmount,
  //     previousLoanId: data.previousLoanId,
  //     paymentMethod: data.paymentMethod,
  //     disbursementAccountId: data.disbursementAccountId,
  //     status: data.status,
  //     rejectionReason: data.rejectionReason,
  //     approvedByUserId: data.approvedByUserId,
  //     disbursedByUserId: data.disbursedByUserId,
  //     notes: data.notes,
  //     customReference: data.customReference,
  //     currencyCode: data.currencyCode,
  //     exchangeRateId: data.exchangeRateId,
  //     totalLoans: total,
  //   };
  // }

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
      .where(
        eq(associates.cedula, cedula),
      );

    	
 if (!associate.length) {
      throw new NotFoundException(`Associate with cedula ${cedula} not found`);
    }
       if (associate[0].status === 'INACTIVE') {
          throw new NotFoundException(  `Associate with cedula ${cedula} is inactive`);
        }

        if (associate[0].status === 'RETIRED') {
          throw new NotFoundException(  `Associate with cedula ${cedula} is retired`);
        }

    const result = await this.db
      .select({
        loanId: loans.id,
        loanType: loanTypes.name,
        loanTotalAmount: loans.totalPayable,
        loanModality: loans.loanModality,
      })
      .from(loans)
      .where(
        and(
          eq(loans.associateId, associate[0].id),
          ne(loans.status, LoanStatusEnum.PAID),
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
     }))


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
    };
  }

  // async update(
  //   id: number,
  //   updateLoanDto: UpdateLoanDto,
  //   userId: number,
  // ): Promise<{ id: number; customReference: string | null }> {
  //   // 1. Obtener el préstamo actual

  //   const existingLoan = await this.db
  //     .select()
  //     .from(loans)
  //     .where(eq(loans.id, id));
  //   if (existingLoan.length === 0) {
  //     throw new InternalServerErrorException('Loan not found.');
  //   }

  //   const setting = await this.db.query.systemSettings.findFirst({
  //     where: eq(systemSettings.key, 'moneda'),
  //   });
  //   const entryDate = new Date().toISOString().split('T')[0];
  //   const exchangeRateData = await this.db.query.exchangeRates.findFirst({
  //     where: eq(exchangeRates.date, entryDate),
  //   });

  //   // 2. Obtener datos relevantes para el cálculo
  //   const [getLoanTypes] = await this.db
  //     .select()
  //     .from(loanTypes)
  //     .where(
  //       eq(
  //         loanTypes.id,
  //         updateLoanDto.loanTypeId ?? existingLoan[0].loanTypeId,
  //       ),
  //     );

  //   // 3. Calcular nuevos valores si corresponde
  //   // 1. Perform calculations
  //   // Using the standard formula for annuity loan payments
  //   const annualInterestRate = parseFloat(getLoanTypes.interestRate); // Tasa de interés anual
  //   const term = getLoanTypes.termUnits; // Plazo en meses
  //   const expensePercentage = parseFloat(
  //     getLoanTypes.administrativeExpensePercentage ?? '0',
  //   ); //  Tasa Porcentaje de gastos administrativos
  //   const percentageInterest =
  //     ((updateLoanDto.requestedAmount ?? 0) * annualInterestRate) / 100; // Porcentaje de cuota
  //   const percentageExpenses =
  //     ((updateLoanDto.requestedAmount ?? 0) * expensePercentage) / 100; // Porcentaje de gastos

  //   let totalQuota = 0; //Cálculo del pago cuotas mesual
  //   let totalInterest = 0; //Cálculo del monto total de intereses
  //   let installmentAmount = 0; //total gasto administrativo
  //   let totalPayable = 0; //Cálculo del monto total a pagar
  //   if (setting && setting.value === 'USD' && exchangeRateData) {
  //     totalQuota =
  //       ((updateLoanDto?.requestedAmount ?? 0) +
  //         percentageInterest +
  //         percentageExpenses) /
  //       term /
  //       Number(exchangeRateData.rate);
  //     totalInterest =
  //       ((updateLoanDto?.requestedAmount ?? 0) * annualInterestRate) /
  //       100 /
  //       Number(exchangeRateData.rate);
  //     installmentAmount =
  //       ((updateLoanDto?.requestedAmount ?? 0) * expensePercentage) /
  //       100 /
  //       Number(exchangeRateData.rate);
  //     totalPayable =
  //       ((updateLoanDto?.requestedAmount ?? 0) +
  //         totalInterest +
  //         installmentAmount) /
  //       Number(exchangeRateData.rate);
  //   } else {
  //     totalQuota =
  //       ((updateLoanDto?.requestedAmount ?? 0) +
  //         percentageInterest +
  //         percentageExpenses) /
  //       term;
  //     totalInterest =
  //       ((updateLoanDto?.requestedAmount ?? 0) * annualInterestRate) / 100;
  //     installmentAmount =
  //       ((updateLoanDto?.requestedAmount ?? 0) * expensePercentage) / 100;
  //     totalPayable =
  //       (updateLoanDto?.requestedAmount ?? 0) +
  //       totalInterest +
  //       installmentAmount;
  //   }

  //   let customReference: string | null | undefined = undefined;
  //   let approvalDate: Date | null = null;
  //   const currentDate = new Date(); // Fecha actual
  //   const finalDate = this.addMonthsToDate(
  //     updateLoanDto?.startDate ?? currentDate,
  //     getLoanTypes.termUnits,
  //   ); //fecha finalizacion del pago

  //   // 2 & 3. Handle APPROVED status
  //   if (
  //     updateLoanDto?.status !== LoanStatusEnum.REQUESTED &&
  //     updateLoanDto?.status !== LoanStatusEnum.REJECTED
  //   ) {
  //     customReference = await this.generateCustomReference();
  //     approvalDate = currentDate;
  //   }

  //   // 4. Actualizar el préstamo y la tabla de amortización en una transacción
  //   const updatedLoan = await this.db.transaction(async (tx) => {
  //     // Actualizar préstamo

  //     const [loanUpdated] = await tx
  //       .update(loans)
  //       .set({
  //         ...updateLoanDto,
  //         associateId: Number(updateLoanDto.associateId),
  //         loanTypeId: Number(updateLoanDto.loanTypeId),
  //         loanModality: updateLoanDto?.loanModality,
  //         requestDate: updateLoanDto?.requestDate?.toISOString().split('T')[0],
  //         approvalDate: approvalDate?.toISOString().split('T')[0],
  //         disbursementDate:
  //           updateLoanDto?.status === 'DISBURSED'
  //             ? currentDate.toISOString().split('T')[0]
  //             : null,
  //         requestedAmount:
  //           updateLoanDto.requestedAmount !== null &&
  //           updateLoanDto.requestedAmount !== undefined
  //             ? String(updateLoanDto.requestedAmount)
  //             : undefined, // Usa undefined en vez de null
  //         approvedAmount:
  //           updateLoanDto.requestedAmount !== null &&
  //           updateLoanDto.requestedAmount !== undefined
  //             ? String(updateLoanDto.requestedAmount)
  //             : undefined, // Usa undefined en vez de null
  //         disbursedAmount:
  //           updateLoanDto.requestedAmount !== null &&
  //           updateLoanDto.requestedAmount !== undefined
  //             ? String(updateLoanDto.requestedAmount)
  //             : undefined, // Usa undefined en vez de null
  //         startDate: updateLoanDto?.startDate?.toISOString().split('T')[0],
  //         endDate: finalDate.toISOString().split('T')[0],
  //         totalInterest:
  //           totalInterest !== null && totalInterest !== undefined
  //             ? String(totalInterest.toFixed(6))
  //             : undefined, // Usa undefined en vez de null
  //         totalPayable:
  //           totalPayable !== null && totalPayable !== undefined
  //             ? String(totalPayable.toFixed(6))
  //             : undefined, // Usa undefined en vez de null
  //         installmentAmount:
  //           totalQuota !== null && totalQuota !== undefined
  //             ? String(totalQuota.toFixed(6))
  //             : undefined, // Usa undefined en vez de null
  //         expensesAmount:
  //           installmentAmount !== null && installmentAmount !== undefined
  //             ? String(installmentAmount.toFixed(6))
  //             : undefined, // Usa undefined en vez de null
  //         // *** LÍNEA CORREGIDA PARA overdraftAmount ***
  //         overdraftAmount:
  //           updateLoanDto.overdraftAmount !== null &&
  //           updateLoanDto.overdraftAmount !== undefined
  //             ? String(updateLoanDto.overdraftAmount)
  //             : undefined, // Usa undefined en vez de null
  //         previousLoanId: updateLoanDto.previousLoanId ?? null,
  //         paymentMethod: updateLoanDto.paymentMethod,
  //         disbursementAccountId: updateLoanDto.disbursementAccountId,
  //         status: updateLoanDto?.status,
  //         approvedByUserId: userId,
  //         disbursedByUserId:
  //           updateLoanDto?.status === 'DISBURSED' ? userId : null,
  //         notes: updateLoanDto.notes ?? null,
  //         currencyCode: setting?.value === '1' ? 'VES' : 'USD',
  //         exchangeRateId: setting?.value === '2' ? exchangeRateData?.id : null,
  //         customReference: customReference,
  //         updatedById: userId,
  //         updatedAt: new Date(),
  //       })
  //       .where(eq(loans.id, id))
  //       .returning({
  //         id: loans.id,
  //         customReference: loans.customReference,
  //       });

  //     if (!loanUpdated) {
  //       throw new InternalServerErrorException('Failed to update loan.');
  //     }

  //     // Eliminar tabla de amortización anterior
  //     await tx
  //       .delete(loanAmortizationSchedule)
  //       .where(eq(loanAmortizationSchedule.loanId, id));

  //     // Generar y guardar nueva tabla de amortización
  //     const schedule = this.generateAmortizationSchedule(
  //       updateLoanDto.requestedAmount!,
  //       term,
  //       annualInterestRate,
  //       expensePercentage,
  //       updateLoanDto.startDate!,
  //       id,
  //     );
  //     if (schedule.length > 0) {
  //       await tx.insert(loanAmortizationSchedule).values(
  //         schedule.map((item) => ({
  //           ...item,
  //           dueDate: item.dueDate.toISOString(),
  //           principalAmount: item.principalAmount.toString(),
  //           interestAmount: item.interestAmount.toString(),
  //           totalInstallmentAmount: item.totalInstallmentAmount.toString(),
  //           principalBalancePending: item.principalBalancePending.toString(),
  //         })),
  //       );
  //     }

  //     // Registrar historial de estatus
  //     await tx.insert(loanStatusHistory).values({
  //       loanId: id,
  //       status: updateLoanDto.status!,
  //       changedAt: new Date(),
  //       changedByUserId: userId,
  //       comment: 'Loan updated',
  //     });

  //     return loanUpdated;
  //   });

  //   return updatedLoan;
  // }

  // async remove(id: number): Promise<{ message: string }> {
  //   const [existingLoan] = await this.db
  //     .select()
  //     .from(loans)
  //     .where(eq(loans.id, id));

  //   if (!existingLoan) {
  //     throw new HttpException('Loan not found', HttpStatus.NOT_FOUND);
  //   }

  //   await this.db.delete(loans).where(eq(loans.id, id));
  //   return { message: 'Loan deleted successfully' };
  // }

  // async findCountAllLoans() {
  //   const totalLoansOrdinary = await this.db
  //     .select({ count: sql<number>`count(*)` })
  //     .from(loans)
  //     .where(
  //       and(
  //         eq(loans.loanModality, loanModalityTypeEnum.ORDINARY),
  //         or(
  //           eq(loans.status, LoanStatusEnum.APPROVED),
  //           eq(loans.status, LoanStatusEnum.DISBURSED),
  //         ),
  //       ),
  //     );

  //   const totalLoanSpecialQuotas = await this.db
  //     .select({ count: sql<number>`count(*)` })
  //     .from(loans)
  //     .where(
  //       and(
  //         eq(loans.loanModality, loanModalityTypeEnum.SPECIAL_QUOTAS),
  //         or(
  //           eq(loans.status, LoanStatusEnum.APPROVED),
  //           eq(loans.status, LoanStatusEnum.DISBURSED),
  //         ),
  //       ),
  //     );

  //   const totalLoanPaid = await this.db
  //     .select({ count: sql<number>`count(*)` })
  //     .from(loans)
  //     .where(eq(loans.status, LoanStatusEnum.PAID));

  //   const totalLoanInPaymet = await this.db
  //     .select({ count: sql<number>`count(*)` })
  //     .from(loans)
  //     .where(eq(loans.status, LoanStatusEnum.IN_PAYMENT));

  //   return {
  //     totalLoansOrdinary: Number(totalLoansOrdinary[0].count),
  //     totalLoanSpecialQuotas: Number(totalLoanSpecialQuotas[0].count),
  //     totalLoanPaid: Number(totalLoanPaid[0].count),
  //     totalLoanInPaymet: Number(totalLoanInPaymet[0].count),
  //   };
  // }
}
