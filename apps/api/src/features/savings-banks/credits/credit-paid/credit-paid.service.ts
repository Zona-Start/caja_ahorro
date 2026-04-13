import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import {
  associates,
  auditLogs,
  bankDirectory,
  creditAmortizationSchedule,
  creditPayments,
  creditPaymentsDetails,
  credits,
  creditsTypes,
} from '@/database/index';
 import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CreditStatusEnum,
  CurrencyCodeEnum,
  loanPaymetTypeEnum,
  paymentMethodEnum,
} from '@/types/enum';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { and, eq, ilike, inArray, ne, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import { CreateCreditPaidDto } from './dto/create-credit.dto';
import { FilterCreditPaidDto } from './dto/filter-credit-paid.dto';
import { ModuleRef } from '@nestjs/core';

// Define una tolerancia para comparar montos monetarios después de redondeo.
// Esto es para CUADRAR el pago si hay una diferencia mínima causada por el toFixed(2) del usuario.
// Por ejemplo, si la cuota es 17.666667 y el usuario paga 17.67, la diferencia es 0.003333.
// Queremos que 17.67 sea "suficiente" para 17.666667.
const ROUNDING_ACCEPTANCE_TOLERANCE = 0.005; // Permite hasta medio centavo de ajuste
const EPSILON_COMPARISON = 0.05; // Para errores de punto flotante muy pequeños

@Injectable()
export class CreditPaidService implements OnModuleInit {

  // Declara la variable aquí arriba en lugar de en el constructor
  private bankMovementsService: BankMovementsService;


  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly associateAccountsMovementsService: AssociateAccountsMovementsService,
    private readonly generateCodeService: GenerateCodeService,
    
    private moduleRef: ModuleRef,
  ) {}

  // Este método se ejecuta automáticamente cuando NestJS ya leyó todos los archivos
  onModuleInit() {
    this.bankMovementsService = this.moduleRef.get(BankMovementsService, { strict: false });
  }

  // calculate balance pending
  private async _calculateBalancePending(creditId: number): Promise<number> {
    const creditAmortization = await this.db
      .select({
        quotaAmount: creditAmortizationSchedule.totalInstallmentAmount,
        paidAmount: creditAmortizationSchedule.paidAmount,
        quotaStatus: creditAmortizationSchedule.paymentStatus,
      })
      .from(creditAmortizationSchedule)
      .where(eq(creditAmortizationSchedule.creditId, creditId))
      .orderBy(sql<string>`
      CASE payment_status
        WHEN 'PARTIAL' THEN 1
        WHEN 'PENDING' THEN 2
        WHEN 'PAID' THEN 3
        ELSE 4
      END ASC,
      id ASC`);

    const totalRemainingExact = creditAmortization.reduce((acc, item) => {
      const total = Number(item.quotaAmount);
      const paid = Number(item.paidAmount || 0);
      const remaining = total - paid;
      return acc + (remaining > EPSILON_COMPARISON ? remaining : 0);
    }, 0);

    return parseFloat(totalRemainingExact.toFixed(6));
  }

  // calculate page quotas
  private async _calculateCoveredInstallments(
    creditId: number,
    amount: number,
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
      await this.db.query.creditAmortizationSchedule.findMany({
        where: and(
          eq(creditAmortizationSchedule.creditId, creditId),
          inArray(creditAmortizationSchedule.paymentStatus, [
            'PENDING',
            'PARTIAL',
          ]),
        ),
        orderBy: creditAmortizationSchedule.installmentNumber,
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

  async create(dto: CreateCreditPaidDto, userId: number, tx?: NodePgDatabase<typeof schema>,liquidationActive?: boolean) {
    const {
      amount,
      bankId,
      creditId,
      paymentDate,
      paymentMethod,
      paymentType,
      comment,
      transactionReference,
    } = dto;

    // Las líneas comentadas para moneda y tasa de cambio no son parte de la lógica central
    // de pago del crédito, pero las dejo si son necesarias para otras funcionalidades.
    // const setting = await this.db.query.systemSettings.findFirst({
    //   where: eq(systemSettings.key, 'moneda'),
    // });
    // const entryDate = new Date().toISOString().split('T')[0];
    // const exchangeRateData = await this.db.query.exchangeRates.findFirst({
    //   where: eq(exchangeRates.date, entryDate),
    // });

    const db = tx || this.db;

    // Inicia la transacción para asegurar la atomicidad de las operaciones
    const result = await db.transaction(async (tx) => {
      const { paidInstallmentDetails, partialInstallment, remainingAmount } =
        await this._calculateCoveredInstallments(creditId, amount);

      const currentBalanceCalculatedFromInstallments =
        await this._calculateBalancePending(creditId);

      const appliedAmountExact = amount - remainingAmount;

      let newBalancePending = Math.max(
        0,
        currentBalanceCalculatedFromInstallments - appliedAmountExact,
      );

      if (newBalancePending < EPSILON_COMPARISON) {
        newBalancePending = 0;
      }

      const customReference =
        await this.generateCodeService.generateNextReference('CRE-PAG');

      // 4. Inserta el registro principal del pago en la tabla 'creditPayments'
      const [insertedPayment] = await tx
        .insert(creditPayments)
        .values({
          creditId: creditId,
          paymentDate,
          paymentType,
          amount: String(amount),
          balancePending: String(newBalancePending.toFixed(6)), // Guarda el nuevo saldo pendiente
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
        .returning({
          id: creditPayments.id,
          customReference: creditPayments.customReference,
        });

      // 5. Procesa las cuotas que fueron PAGADAS COMPLETAMENTE
      for (const installment of paidInstallmentDetails) {
        // Registra el detalle del pago para esta cuota
        await tx.insert(creditPaymentsDetails).values({
          creditPaymentId: insertedPayment.id,
          installmentId: installment.id,
          amount: String(installment.amount),
          createdById: userId,
        });

        // Actualiza el estado de la cuota en la tabla de amortización a 'PAID'
        await tx
          .update(creditAmortizationSchedule)
          .set({
            paymentStatus: 'PAID',
            updatedById: Number(userId),
            paidAmount: sql`total_installment_amount`, // Marcar como pagado el total de la cuota
          })
          .where(eq(creditAmortizationSchedule.id, installment.id));
      }

      // 6. Procesa la cuota que fue PAGADA PARCIALMENTE (si existe)
      if (partialInstallment) {
        // Actualiza el estado de la cuota en la tabla de amortización a 'PARTIAL'
        await tx
          .update(creditAmortizationSchedule)
          .set({
            paymentStatus: 'PARTIAL',
            paidAmount: String(partialInstallment.paidAmount),
            updatedById: Number(userId),
          })
          .where(eq(creditAmortizationSchedule.id, partialInstallment.id));

        const amountAppliedToPartial =
          partialInstallment.paidAmount - partialInstallment.originalPaidAmount;

        // Registra el detalle del pago parcial para esta cuota
        await tx.insert(creditPaymentsDetails).values({
          creditPaymentId: insertedPayment.id,
          installmentId: partialInstallment.id,
          amount: String(amountAppliedToPartial.toFixed(6)),
          createdById: Number(userId),
        });
      }

      // 7. Lógica para ACTUALIZAR el estado del CRÉDITO principal y el SALDO A FAVOR
      let newCreditStatus = 'APPROVED';
      let balanceInFavorValue = remainingAmount;

      // Si el saldo pendiente del crédito es cero o insignificante (manejo de flotantes)
      if (newBalancePending <= 0) {
        newCreditStatus = 'PAID'; // El crédito está completamente saldado
      } else {
        newCreditStatus = 'IN_PAYMENT';
      }

      // Realiza la actualización final del registro del crédito principal
      await tx
        .update(credits)
        .set({
          status: newCreditStatus as CreditStatusEnum,
          balanceInFavor: String(balanceInFavorValue.toFixed(6)),
          updatedById: Number(userId),
        })
        .where(eq(credits.id, creditId));

      const paylodAuditData = {
        creditId: String(creditId),
        paymentDate,
        paymentType,
        amount: amount,
        balancePending: String(newBalancePending.toFixed(6)), // Guarda el nuevo saldo pendiente
        bankId:
          bankId !== undefined && bankId !== null ? Number(bankId) : undefined,
        paymentMethod,
        transactionReference,
        comment,
        createdById: Number(userId),
        customReference: customReference,
      };

      await tx.insert(auditLogs).values({
        tableName: 'creditsPayments',
        recordId: String(insertedPayment.id),
        action: 'INSERT',
        userId: Number(userId),
        area: 'CREDITOS',
        description: `Pago de Crédito`,
        newData: [paylodAuditData],
      });

      return {
        transation: true,
        insertedPaymentId: insertedPayment.id,
        customReference: insertedPayment.customReference,
        balanceInFavorValue: balanceInFavorValue,
      };
    });

    // si transaccion se genero satifactoria se registra el movimiento en cuenta asocaido
    if (result.transation) {
      const resutAccount = await db
        .select({
          id: schema.associateAccounts.id,
          referenceLoans: credits.customReference,
        })
        .from(schema.credits)
        .leftJoin(
          schema.associateAccounts,
          eq(schema.associateAccounts.associateId, schema.credits.associateId),
        )
        .where(eq(schema.credits.id, creditId));

      const payloadMovementLoan = {
        associateAccountId: Number(resutAccount[0].id),
        movementType:
          'COMMERCIAL_CREDIT_PAYMENT_DEBIT' as AssociateMovementTypeEnum,
        amount: amount,
        currencyCode: 'VES' as CurrencyCodeEnum,
        transactionDate: paymentDate ? paymentDate : undefined,
        description: 'Pago Crédito',
        referenceId: String(result.insertedPaymentId),
        referenceType: 'creditPayments',
        referenceNumber: result.customReference ?? undefined,
        area: 'CREDITOS',
      };

       if (!liquidationActive){
         await this.associateAccountsMovementsService.create(
        userId,
        payloadMovementLoan,
      );
       }

     

      const dataBank = {
        movement: {
          bankAccountId: Number(bankId),
          transactionDate: paymentDate ?? new Date(),
          paymentMethod: paymentMethod as paymentMethodEnum,
          description: `Pago de Cuota Crédito`,
          bankReference: transactionReference,
          category: 'CREDIT_PAYMENT' as BankTransactionCategory,
          creditAmount: amount,
          debitAmount: 0,
          createdById: userId,
        },
        links: [
          {
            internalRecordType: 'CREDIT_PAYMENT',
            internalRecordId: Number(resutAccount[0].id),
          },
        ],
      };

       if (!liquidationActive){
         await this.bankMovementsService.createAndReconcile(dataBank, userId);
       }

        if (!liquidationActive){
           if (result.balanceInFavorValue !== 0) {
        const payloadMovementLoan = {
          associateAccountId: Number(resutAccount[0].id),
          movementType:
            'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT' as AssociateMovementTypeEnum,
          amount: result.balanceInFavorValue,
          currencyCode: 'VES' as CurrencyCodeEnum,
          transactionDate: paymentDate ? paymentDate : undefined,
          description: 'CREDITO SOBREGIRO PAGO DE CREDITO',
          referenceId: String(creditId),
          referenceType: 'credits',
          referenceNumber: undefined,
          area: 'CREDITOS',
        };

        await this.associateAccountsMovementsService.create(
          userId,
          payloadMovementLoan,
        );
      }
        }
     
    }

    // Retorna una respuesta de éxito
    return {
      message: 'Credit paid create success',
    };
  }

  async findAll(paginationDto: FilterCreditPaidDto) {
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
      searchConditions.push(
        ilike(creditPayments.customReference, `%${search}%`),
      );
    }

    if (bank !== '') {
      searchConditions.push(eq(creditPayments.bankId, Number(bank)));
    }

    if (type !== '') {
      searchConditions.push(
        eq(creditPayments.paymentType, type as loanPaymetTypeEnum),
      );
    }

    if (method) {
      searchConditions.push(
        eq(creditPayments.paymentMethod, method as paymentMethodEnum),
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${creditPayments[sortBy as keyof typeof creditPayments]} asc`
        : sql`${creditPayments[sortBy as keyof typeof creditPayments]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(creditPayments)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
    const data = await this.db
      .select({
        id: creditPayments.id,
        customReference: creditPayments.customReference,
        paymentDate: creditPayments.paymentDate,
        paymentType: creditPayments.paymentType,
        paymentMethod: creditPayments.paymentMethod,
        bankName: bankDirectory.name,
        transactionReference: creditPayments.transactionReference,
        amount: creditPayments.amount,
        balancePending: creditPayments.balancePending,
        associateCedula: associates.cedula,
        associatesFullname: associates.fullname,
      })
      .from(creditPayments)
      .where(searchCondition)
      .leftJoin(bankDirectory, eq(bankDirectory.id, creditPayments.bankId))
      .leftJoin(credits, eq(credits.id, creditPayments.creditId))
      .leftJoin(associates, eq(associates.id, credits.associateId))
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
        amount: Number(item.amount).toFixed(2),
      })),
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
        creditId: credits.id,
        creditType: creditsTypes.name,
        creditTotalAmount: credits.totalPayable,
        creditModality: credits.creditModality,
      })
      .from(credits)
      .where(
        and(
          eq(credits.associateId, associate[0].id),
          ne(credits.status, CreditStatusEnum.PAID),
        ),
      )
      .leftJoin(creditsTypes, eq(credits.creditTypeId, creditsTypes.id))
      .leftJoin(
        creditAmortizationSchedule,
        eq(credits.id, creditAmortizationSchedule.creditId),
      );

    const creditAmortization = await this.db
      .select({
        id: creditAmortizationSchedule.id,
        quotaNumber: creditAmortizationSchedule.installmentNumber,
        quotaAmount: creditAmortizationSchedule.totalInstallmentAmount,
        quotaDate: creditAmortizationSchedule.dueDate,
        quotaStatus: creditAmortizationSchedule.paymentStatus,
        quotaPartial: creditAmortizationSchedule.paidAmount,
        principalBalancePending:
          creditAmortizationSchedule.principalBalancePending,
        paidAmount: creditAmortizationSchedule.paidAmount,
      })
      .from(creditAmortizationSchedule)
      .where(eq(creditAmortizationSchedule.creditId, result[0]?.creditId))
      .orderBy(sql<string>`
    CASE payment_status
      WHEN 'PARTIAL' THEN 1
      WHEN 'PENDING' THEN 2
      WHEN 'PAID' THEN 3
      ELSE 4
    END ASC,
    id ASC`);

    const pendingQuotas = creditAmortization.filter(
      (item) => item.quotaStatus === 'PENDING',
    );

    const partialQuotas = creditAmortization.filter(
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
    const transformCreditAmortization = creditAmortization.map((item) => ({
      ...item,
      quotaAmount: Number(item.quotaAmount).toFixed(2),
      paidAmount: Number(item.paidAmount).toFixed(2),
    }));

    return {
      id: associate[0].id,
      cedula: associate[0].cedula,
      fullname: associate[0].fullname,
      phone: associate[0].phone,
      email: associate[0].email,
      creditId: result.length === 0 ? null : result[0]?.creditId,
      creditType: result.length === 0 ? null : result[0]?.creditType,
      creditTotalAmount: String(totalPendingAmount.toFixed(2)),
      creditModality: result.length === 0 ? null : result[0]?.creditModality,
      creditAmortization: transformCreditAmortization || null,
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
  //       .delete(creditAmortizationSchedule)
  //       .where(eq(creditAmortizationSchedule.loanId, id));

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
  //       await tx.insert(creditAmortizationSchedule).values(
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

  async applyPaymentFromBankReconciliation(
    paymentId: number,
    tx: NodePgDatabase<typeof schema>,
  ) {
    await tx
      .update(creditPayments)
      .set({ status: 'DONE' })
      .where(eq(creditPayments.id, paymentId));
  }
}

