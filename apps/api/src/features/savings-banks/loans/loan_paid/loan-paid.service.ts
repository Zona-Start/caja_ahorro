import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
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
const EPSILON_COMPARISON = 0.05; // Para errores de punto flotante muy pequeños

@Injectable()
export class LoanPaidService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly bankMovementsService: BankMovementsService,
  ) {}

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
    partialInstallment?: {
      id: number;
      paidAmount: number;
      originalPaidAmount: number;
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

    const paidInstallmentDetails: { id: number; amount: number }[] = [];
    let partialInstallment:
      | { id: number; paidAmount: number; originalPaidAmount: number }
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
        paidInstallmentDetails.push({
          id: installment.id,
          amount: parseFloat(dueAmountExact.toFixed(6)),
        });

        // Ajustamos el remainingPaymentAmount del pago.
        // Si el pago era ligeramente mayor, se reduce por el dueAmountExact.
        // Si el pago era ligeramente menor, se considera que se consumió todo para completar la cuota.
        remainingPaymentAmount = Math.max(
          0,
          remainingPaymentAmount - dueAmountExact,
        );

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

    // --- VALIDACIÓN DE ESTADO DEL PRÉSTAMO ---
    const loan = await this.db.select().from(loans).where(eq(loans.id, loanId));

    if (loan.length === 0) {
      throw new NotFoundException(`The loan was not found.`);
    }

    if (
      loan[0].status !== LoanStatusEnum.DISBURSED &&
      loan[0].status !== LoanStatusEnum.IN_PAYMENT
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
          loanId: String(loanId),
          paymentDate,
          paymentType,
          amount: amount,
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

        const amountAppliedToPartial =
          partialInstallment.paidAmount - partialInstallment.originalPaidAmount;

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
        customReference: customReference,
      };

      await tx.insert(auditLogs).values({
        tableName: 'loansPayments',
        recordId: String(insertedPayment.id),
        action: 'INSERT',
        userId: Number(userId),
        area: 'PRESTAMOS',
        description: 'Pago Prestamo',
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
        description: 'Pago Prestamo',
        referenceId: String(result.insertedPaymentId),
        referenceType: 'loansPayments',
        referenceNumber: result.customReference ?? undefined,
        area: 'PRESTAMOS',
      };

      await this.associateAccountsMovementsService.create(
        userId,
        payloadMovementLoan,
      );
      const dataBank = {
        movement: {
          bankAccountId: bankId,
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
      await this.bankMovementsService.createAndReconcile(dataBank, userId);

      if (result.balanceInFavorValue > EPSILON_COMPARISON) {
        const payloadMovementLoanFavor = {
          associateAccountId: Number(resutAccount[0].id),
          movementType: 'LOAN_OVERPAYMENT_CREDIT' as AssociateMovementTypeEnum,
          amount: result.balanceInFavorValue,
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
        })
        .from(loanPayments)
        .leftJoin(loans, eq(loans.id, loanPayments.loanId))
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

      console.log(paymetCount[0].count);

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
        await this.associateAccountsMovementsService.create(userId, {
          associateAccountId: associateAccount.id,
          movementType:
            'LOAN_PAYMENT_REVERSAL_CREDIT' as AssociateMovementTypeEnum,
          amount: Number(payment.amount),
          currencyCode: 'VES' as CurrencyCodeEnum,
          description: `REVERSO PAGO PRESTAMO - REF: ${payment.customReference}`,
          referenceId: String(payment.id),
          referenceType: 'loanPayments',
          area: 'PRESTAMOS',
        });
      }

      // 7. Registrar en auditoría
      await tx.insert(auditLogs).values({
        tableName: 'loanPayments',
        recordId: String(paymentId),
        action: 'CANCELED',
        userId: userId,
        area: 'PRESTAMOS',
        description: `Cancelación del pago ${payment.customReference}`,
        newData: [{ status: 'CANCELED' }],
      });

      return {
        message: `The payment ${payment.customReference} has been successfully cancelled.`,
      };
    });
  }
}
