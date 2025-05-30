import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  associates,
  bankDirectory,
  loanAmortizationSchedule,
  loanPayments,
  loanPaymentsDetails,
  loans,
  loanTypes,
  systemSettings,
} from '@/database/index';
import {
  loanPaymetTypeEnum,
  LoanStatusEnum,
  paymentMethodEnum,
} from '@/types/enum';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, ne, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateLoanPaidDto } from './dto/create-loan.dto';
import { FilterLoanPaidDto } from './dto/filter-loan-paid.dto';

@Injectable()
export class LoanPaidService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}

  // --- Helper function to generate custom reference ---
  private async generateCustomReference(): Promise<string> {
    // Fetch the current correlative number and increment it
    const key = 'correlativo_pago_prestamo';
    try {
      const result = await this.db.transaction(async (tx) => {
        // Lock the row for update
        const setting = await tx.query.systemSettings.findFirst({
          where: eq(systemSettings.key, key),
          // Add forUpdate() if your Drizzle version supports it for row locking
          // Example: columns: {}, with: { forUpdate: true }
        });

        if (!setting) {
          throw new InternalServerErrorException(
            `System setting '${key}' not found.`,
          );
        }

        const currentNumber = parseInt(setting.value, 10);
        if (isNaN(currentNumber)) {
          throw new InternalServerErrorException(
            `Invalid correlative number format for '${key}'.`,
          );
        }

        const nextNumber = currentNumber + 1;
        const nextValue = nextNumber.toString().padStart(5, '0'); // Pad with leading zeros

        // Update the setting with the new value
        await tx
          .update(systemSettings)
          .set({ value: nextValue, updatedAt: new Date() }) // Assuming you have an updatedById field to set too
          .where(eq(systemSettings.id, setting.id));

        return nextValue; // Return the generated reference
      });
      return `PGPRES${result}`; // Prefix the reference
    } catch (error) {
      console.error('Error generating custom reference:', error);
      throw new InternalServerErrorException(
        'Failed to generate custom loan reference.',
      );
    }
  }

  // calculate balance pending
  private async _calculateBalancePending(amount: number, loanId: number) {
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
      .where(eq(loanAmortizationSchedule.loanId, loanId)).orderBy(sql<string>`
      CASE payment_status
        WHEN 'PARTIAL' THEN 1
        WHEN 'PENDING' THEN 2
        WHEN 'PAID' THEN 3
        ELSE 4
      END ASC,
      id ASC`);

    // Cuotas pendientes
    const pendingQuotas = loanAmortization.filter(
      (item) => item.quotaStatus === 'PENDING',
    );

    // Cuotas parcialmente pagadas
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

    // Suma final de lo pendiente antes del abono
    const totalPendingAmount = totalPending + totalPartial;

    // Calcular el nuevo saldo pendiente después del abono
    const newPendingAmount = Math.max(totalPendingAmount - amount, 0);

    return newPendingAmount;
  }

  //calculate page quotas
  private async _calculateCoveredInstallments(
    loanId: number,
    amount: number,
  ): Promise<{
    paidInstallmentDetails: { id: number; amount: number }[];
    partialInstallment?: { id: number; paidAmount: number };
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

    let coveredAmount = 0;
    const paidInstallmentDetails: { id: number; amount: number }[] = [];
    let partialInstallment: { id: number; paidAmount: number } | undefined;
    let remainingAmount = amount;

    for (const installment of pendingInstallments) {
      const dueAmount =
        Number(installment.totalInstallmentAmount) -
        Number(installment.paidAmount || 0);
      const canPay = Math.min(remainingAmount, dueAmount);

      if (canPay >= dueAmount) {
        paidInstallmentDetails.push({ id: installment.id, amount: dueAmount });
        coveredAmount += dueAmount;
        remainingAmount -= dueAmount;
      } else if (canPay > 0) {
        partialInstallment = {
          id: installment.id,
          paidAmount: Number(installment.paidAmount || 0) + canPay,
        };
        coveredAmount += canPay;
        remainingAmount -= canPay;
        break; // No more full installments can be covered
      } else {
        break; // No more amount to cover
      }
    }

    return { paidInstallmentDetails, partialInstallment, remainingAmount };
  }

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

    //consulta los datos de la  moneda y tasa de cambio
    // const setting = await this.db.query.systemSettings.findFirst({
    //   where: eq(systemSettings.key, 'moneda'),
    // });
    // const entryDate = new Date().toISOString().split('T')[0];
    // const exchangeRateData = await this.db.query.exchangeRates.findFirst({
    //   where: eq(exchangeRates.date, entryDate),
    // });

    // Start transaction
    await this.db.transaction(async (tx) => {
      const { paidInstallmentDetails, partialInstallment, remainingAmount } =
        await this._calculateCoveredInstallments(loanId, amount);

      const customReference = await this.generateCustomReference(); //genera la referencia
      const totalPending = await this._calculateBalancePending(amount, loanId); //calcula total pendiente

      const [InsertLoanPayment] = await tx
        .insert(loanPayments)
        .values({
          loanId: String(loanId),
          paymentDate,
          paymentType,
          amount: amount,
          balancePending: String(totalPending),
          bankId:
            bankId !== undefined && bankId !== null
              ? Number(bankId)
              : undefined,
          paymentMethod,
          transactionReference,
          comment,
          createdById: Number(userId),
          customReference: customReference,
        })
        .returning({ id: loans.id });

      // Insert into loanPaymentsDetails for each fully paid installment
      for (const installment of paidInstallmentDetails) {
        await tx.insert(loanPaymentsDetails).values({
          loanPaymentId: String(InsertLoanPayment.id),
          installmentId: String(installment.id),
          amount: String(installment.amount),
          createdById: String(userId),
        });

        // Update loanAmortizationSchedule for fully paid installments
        await tx
          .update(loanAmortizationSchedule)
          .set({
            paymentStatus: 'PAID',
            updatedById: Number(userId),
            paidAmount: sql`total_installment_amount`, // Update paidAmount with totalInstallmentAmount
          })
          .where(eq(loanAmortizationSchedule.id, installment.id));
      }

      // Update loanAmortizationSchedule for partially paid installment
      if (partialInstallment) {
        await tx
          .update(loanAmortizationSchedule)
          .set({
            paymentStatus: 'PARTIAL',
            paidAmount: String(partialInstallment.paidAmount),
            updatedById: Number(userId),
          })
          .where(eq(loanAmortizationSchedule.id, partialInstallment.id));

        // Insert loanPaymentDetails record for the partial payment
        await tx.insert(loanPaymentsDetails).values({
          loanPaymentId: String(InsertLoanPayment.id),
          installmentId: partialInstallment.id,
          amount: partialInstallment.paidAmount,
          createdById: Number(userId),
        });
      }

      // Handle remaining amount as a negative paidAmount for the loan
      if (remainingAmount > 0) {
        // Find the last installment to potentially apply the overpayment
        const lastInstallment =
          await tx.query.loanAmortizationSchedule.findFirst({
            where: eq(loanAmortizationSchedule.loanId, loanId),
            orderBy: [sql`installment_number DESC`],
          });

        if (lastInstallment) {
          await tx
            .update(loanAmortizationSchedule)
            .set({
              paidAmount: sql`${loanAmortizationSchedule.paidAmount}`,
              paymentStatus:
                lastInstallment.paymentStatus === 'PAID' ? 'PAID' : 'PARTIAL', // Keep status if already paid
              updatedById: Number(userId),
            })
            .where(eq(loanAmortizationSchedule.id, lastInstallment.id));

          await tx
            .update(loans)
            .set({
              status: 'PAID',
              balanceInFavor: String(remainingAmount.toFixed(2)),
              updatedById: Number(userId),
            })
            .where(eq(loans.id, loanId));
        }
      }
    });

    return {
      message: 'laon paid create success',
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
      })
      .from(loanPayments)
      .where(searchCondition)
      .leftJoin(bankDirectory, eq(bankDirectory.id, loanPayments.bankId))
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
      data: data,
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
    try {
      const associate = await this.db
        .select({
          id: associates.id,
          cedula: associates.cedula,
          fullname: associates.fullname,
          phone: associates.phone,
          email: associates.email,
        })
        .from(associates)
        .where(
          and(eq(associates.cedula, cedula), eq(associates.status, 'ACTIVE')),
        );

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

      return {
        id: associate[0].id,
        cedula: associate[0].cedula,
        fullname: associate[0].fullname,
        phone: associate[0].phone,
        email: associate[0].email,
        loanId: result[0]?.loanId,
        loanType: result[0]?.loanType,
        loanTotalAmount: String(totalPendingAmount.toFixed(2)),
        loanModality: result[0]?.loanModality,
        loanAmortization: loanAmortization || [],
      };
    } catch (error) {
      console.log(error);

      return new InternalServerErrorException(
        'Error fetching loan request details.',
      );
    }
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
  //             ? String(totalInterest.toFixed(2))
  //             : undefined, // Usa undefined en vez de null
  //         totalPayable:
  //           totalPayable !== null && totalPayable !== undefined
  //             ? String(totalPayable.toFixed(2))
  //             : undefined, // Usa undefined en vez de null
  //         installmentAmount:
  //           totalQuota !== null && totalQuota !== undefined
  //             ? String(totalQuota.toFixed(2))
  //             : undefined, // Usa undefined en vez de null
  //         expensesAmount:
  //           installmentAmount !== null && installmentAmount !== undefined
  //             ? String(installmentAmount.toFixed(2))
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
