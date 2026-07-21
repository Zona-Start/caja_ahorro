import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  accountsPayable,
  purchaseOrders,
  supplierAdvances,
  supplierCreditNotes,
  supplierInvoices,
  supplierPaymentLines,
  supplierPayments,
  suppliers,
  supplierTransactionApplications,
  supplierTransactions,
} from '@/database/schema';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  BankTransactionCategory,
  paymentAccountsPayableEnum,
  paymentMethodEnum,
  supplierTransactionsTypeEnum,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class SupplierPaymentsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly bankMovementsService: BankMovementsService,
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  async findAll(paginationDto: any, tenantId: string) {
    const { page = 1, limit = 10, search = '', status } = paginationDto;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [
      eq(supplierPayments.tenantId, tenantId),
    ];
    if (search) {
      conditions.push(ilike(supplierPayments.paymentNumber, `%${search}%`));
    }
    if (status) {
      conditions.push(eq(supplierPayments.status, status));
    }

    const whereCondition = and(...conditions);

    const [total] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(supplierPayments)
      .where(whereCondition);

    const data = await this.db
      .select()
      .from(supplierPayments)
      .where(whereCondition)
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        totalCount: Number(total.count),
        page,
        limit,
        totalPages: Math.ceil(Number(total.count) / limit),
      },
    };
  }

  async findAllPaymentBySuppliers(paginationDto: any, tenantId: string) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'asc',
      supplierIds,
      startDate,
      endDate,
    } = paginationDto;
    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [
      eq(supplierPayments.tenantId, tenantId),
    ];

    let parsedSupplierIds: string[] = [];
    if (supplierIds) {
      if (Array.isArray(supplierIds)) {
        parsedSupplierIds = supplierIds;
      } else if (typeof supplierIds === 'string') {
        parsedSupplierIds = [supplierIds];
      }

      if (parsedSupplierIds.length > 0) {
        searchConditions.push(
          inArray(supplierPayments.supplierId, parsedSupplierIds),
        );
      }
    }

    if (startDate) {
      searchConditions.push(
        sql`${supplierPayments.requestedAt} >= ${startDate instanceof Date ? startDate.toISOString() : startDate}`,
      );
    }
    if (endDate) {
      searchConditions.push(
        sql`${supplierPayments.requestedAt} <= ${endDate instanceof Date ? endDate.toISOString() : endDate}`,
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${supplierPayments[sortBy as keyof typeof supplierPayments]} asc`
        : sql`${supplierPayments[sortBy as keyof typeof supplierPayments]} desc`;

    const totalCountResult = await this.db
      .select({
        count: sql<number>`count(DISTINCT ${supplierPayments.id})`,
      })
      .from(supplierPayments)
      .leftJoin(
        supplierPaymentLines,
        eq(supplierPayments.id, supplierPaymentLines.supplierPaymentId),
      )
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const rawPayments = await this.db
      .select({
        payment: supplierPayments,
        supplier: suppliers,
        line: supplierPaymentLines,
        accountPayable: accountsPayable,
      })
      .from(supplierPayments)
      .leftJoin(suppliers, eq(supplierPayments.supplierId, suppliers.id))
      .leftJoin(
        supplierPaymentLines,
        eq(supplierPayments.id, supplierPaymentLines.supplierPaymentId),
      )
      .leftJoin(
        accountsPayable,
        eq(accountsPayable.id, supplierPaymentLines.accountsPayableId),
      )
      .limit(limit)
      .offset(offset)
      .where(searchCondition)
      .orderBy(orderBy);

    const groupedPayments = new Map<string, any>();

    for (const row of rawPayments) {
      const paymentId = row.payment.id;

      if (!groupedPayments.has(paymentId)) {
        let referen = '';
        if (row.line?.accountsPayableId === null) {
          const [get] = await this.db
            .select({
              transactionNumber: supplierTransactions.transactionNumber,
            })
            .from(supplierTransactions)
            .where(
              eq(supplierTransactions.id, String(row.line.relatedAdvanceId)),
            );

          referen = get?.transactionNumber ?? '';
        }

        groupedPayments.set(paymentId, {
          ...row.payment,
          totalAmount: Number(row.payment.totalAmount),
          supplierName: row.supplier?.name,
          lines: [],
          accountPayableNumber:
            row.accountPayable?.accountsPayableNumber ?? referen,
        });
      }

      if (row.line) {
        groupedPayments.get(paymentId).lines.push({
          ...row.line,
          amount: Number(row.line.amount),
        });
      }
    }

    const data = Array.from(groupedPayments.values());

    const meta = {
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data, meta };
  }

  async getPaymentPending(paginationDto: any, tenantId: string) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'dueDate',
      sortOrder = 'asc',
      supplierId,
      supplierInvoiceId,
      status,
    } = paginationDto;
    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [
      eq(accountsPayable.tenantId, tenantId),
    ];
    const searchConditionsAdvance: SQL<unknown>[] = [
      eq(supplierAdvances.tenantId, tenantId),
    ];

    if (search) {
      searchConditions.push(
        ilike(accountsPayable.accountsPayableNumber, `%${search}%`),
      );
      searchConditionsAdvance.push(
        ilike(supplierTransactions.transactionNumber, `%${search}%`),
      );
    }
    if (supplierId) {
      searchConditions.push(eq(accountsPayable.supplierId, supplierId));
      searchConditionsAdvance.push(eq(supplierAdvances.supplierId, supplierId));
    }
    if (supplierInvoiceId) {
      searchConditions.push(
        eq(accountsPayable.supplierInvoiceId, supplierInvoiceId),
      );
    }

    let parsedSupplierStatus: paymentAccountsPayableEnum[] = [];
    if (status) {
      if (Array.isArray(status)) {
        if (status.length === 1 && status[0].includes(',')) {
          parsedSupplierStatus = status[0].split(
            ',',
          ) as paymentAccountsPayableEnum[];
        } else {
          parsedSupplierStatus = status as paymentAccountsPayableEnum[];
        }
      } else if (typeof status === 'string') {
        parsedSupplierStatus = status.split(
          ',',
        ) as paymentAccountsPayableEnum[];
      }

      if (parsedSupplierStatus.length > 0) {
        searchConditions.push(
          inArray(accountsPayable.status, parsedSupplierStatus),
        );
      }

      if (
        parsedSupplierStatus.includes('PENDING' as paymentAccountsPayableEnum)
      ) {
        searchConditionsAdvance.push(
          eq(supplierAdvances.statusPayment, 'PENDING'),
        );
      }
    }

    const searchCondition = and(
      ...searchConditions,
      eq(accountsPayable.isAuthorizePayment, true),
    );

    const searchConditionAdvanceFinal = and(
      ...searchConditionsAdvance,
      eq(supplierAdvances.statusPayment, 'PENDING'),
    );

    const accountsPayableSelect = this.db
      .select({
        id: accountsPayable.id,
        supplierId: accountsPayable.supplierId,
        supplierName: suppliers.name,
        reference:
          sql<string>`COALESCE(${accountsPayable.accountsPayableNumber}, '')`.as(
            'reference',
          ),
        amount:
          sql<string>`COALESCE(${accountsPayable.remainingAmount}, '0.00')`.as(
            'amount',
          ),
        status:
          sql<string>`COALESCE(${accountsPayable.status}::text, 'PENDING')`.as(
            'status',
          ),
        date: accountsPayable.dueDate!,
        type: sql<string>`'ACCOUNTS_PAYABLE'`.as('type'),
      })
      .from(accountsPayable)
      .leftJoin(suppliers, eq(accountsPayable.supplierId, suppliers.id))
      .where(searchCondition);

    const advanceSelect = this.db
      .select({
        id: supplierAdvances.transactionId,
        supplierId: supplierAdvances.supplierId,
        supplierName: suppliers.name,
        reference:
          sql<string>`COALESCE(${supplierTransactions.transactionNumber}, '')`.as(
            'reference',
          ),
        amount:
          sql<string>`COALESCE(${supplierAdvances.availableAmount}, '0.00')`.as(
            'amount',
          ),
        status:
          sql<string>`COALESCE(${supplierAdvances.statusPayment}::text, 'PENDING')`.as(
            'status',
          ),
        date: supplierTransactions.transactionDate!,
        type: sql<string>`'ADVANCE'`.as('type'),
      })
      .from(supplierAdvances)
      .leftJoin(suppliers, eq(supplierAdvances.supplierId, suppliers.id))
      .leftJoin(
        supplierTransactions,
        eq(supplierTransactions.id, supplierAdvances.transactionId),
      )
      .where(searchConditionAdvanceFinal);

    const combinedData = this.db
      .$with('combined_data')
      .as(accountsPayableSelect.unionAll(advanceSelect));

    const combinedSchema = combinedData._.selectedFields;
    const orderByColumn =
      combinedSchema[sortBy as keyof typeof combinedSchema] ??
      combinedSchema.date;
    const finalOrderBy =
      sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

    const result = await this.db
      .with(combinedData)
      .select({
        ...combinedSchema,
        totalCount: sql<number>`count(*) over()`.as('totalCount'),
      })
      .from(combinedData)
      .orderBy(finalOrderBy)
      .limit(limit)
      .offset(offset);

    const data = result.map(({ totalCount, ...rest }) => rest);
    const totalCount = result.length > 0 ? result[0].totalCount : 0;
    const totalPages = Math.ceil(totalCount / limit);

    const meta = {
      page: Number(page),
      limit: Number(limit),
      totalCount: Number(totalCount),
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data, meta };
  }

  async createPayAdvance(
    dto: any,
    userId: string,
    tenantId: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx || this.db;
    const getTransiction = await db
      .select()
      .from(supplierTransactions)
      .where(eq(supplierTransactions.id, dto.transactionId));

    if (getTransiction.length === 0) {
      throw new NotFoundException(
        `Transaction Advance with ID ${dto.transactionId} not found`,
      );
    }

    return db.transaction(async (tx) => {
      const paymentNumber =
        await this.generateCodeService.generateNextReference(
          'PAG-P',
          tenantId,
          'purchasing',
          'payments',
          tx,
        );

      const [newPayment] = await tx
        .insert(supplierPayments)
        .values({
          tenantId,
          supplierId: dto.supplierId,
          paymentNumber: paymentNumber,
          totalAmount: dto.amount.toString(),
          currencyCode: 'VES',
          paymentMethod: dto.paymentMethod as paymentMethodEnum,
          bankAccountId: dto.bankAccountId,
          status: 'PROCESSED',
          requestedAt: new Date().toISOString(),
          createdById: userId,
          bankDescription: dto.paymentDescription,
          bankReference: dto.bankReference,
          bankTransactionDate: dto.transactionDate
            ? dto.transactionDate instanceof Date
              ? dto.transactionDate.toISOString()
              : String(dto.transactionDate)
            : new Date().toISOString(),
          observations: 'Pago de Anticipo',
          processedAt: new Date().toISOString(),
        })
        .returning({
          id: supplierPayments.id,
          reference: supplierPayments.paymentNumber,
        });

      await tx.insert(supplierPaymentLines).values({
        supplierPaymentId: newPayment.id,
        relatedAdvanceId: dto.transactionId,
        amount: dto.amount.toString(),
        description: dto.paymentDescription,
        createdById: userId,
      });

      await tx
        .update(supplierAdvances)
        .set({
          statusPayment: 'PAID',
          updatedById: userId,
        })
        .where(eq(supplierAdvances.transactionId, dto.transactionId));

      await tx
        .update(supplierTransactions)
        .set({
          paymentMethod: dto.paymentMethod as paymentMethodEnum,
          bankAccountId: dto.bankAccountId,
          bankReference: dto.bankReference,
          bankTransactionDate: dto.transactionDate
            ? dto.transactionDate instanceof Date
              ? dto.transactionDate.toISOString()
              : String(dto.transactionDate)
            : new Date().toISOString(),
          updatedById: userId,
        })
        .where(eq(supplierTransactions.id, dto.transactionId));

      return newPayment;
    });
  }

  async getOneSupplierPaymentByAccountId(id: string, tenantId: string) {
    const account = await this.db
      .select({
        id: accountsPayable.id,
        supplierId: accountsPayable.supplierId,
        supplierName: suppliers.name,
        accountsPayableNumber: accountsPayable.accountsPayableNumber,
        amount: accountsPayable.originalAmount,
        paidAmount: accountsPayable.paidAmount,
        remaingAmount: accountsPayable.remainingAmount,
        invoiceNumber: supplierInvoices.invoiceNumber,
      })
      .from(accountsPayable)
      .leftJoin(suppliers, eq(accountsPayable.supplierId, suppliers.id))
      .leftJoin(
        supplierInvoices,
        eq(accountsPayable.supplierInvoiceId, supplierInvoices.id),
      )
      .where(
        and(eq(accountsPayable.id, id), eq(accountsPayable.tenantId, tenantId)),
      );

    const note = await this.db
      .select({
        id: supplierTransactionApplications.id,
        referenceNote: supplierTransactions.transactionNumber,
        appliedAmount: supplierTransactionApplications.appliedAmount,
      })
      .from(supplierTransactionApplications)
      .innerJoin(
        supplierTransactions,
        eq(
          supplierTransactions.id,
          supplierTransactionApplications.transactionId,
        ),
      )
      .where(
        and(
          eq(supplierTransactionApplications.accountsPayableId, id),
          eq(supplierTransactionApplications.tenantId, tenantId),
        ),
      );

    return {
      data: {
        account: account[0],
        note: note ? note : null,
      },
    };
  }

  async getSupplierAvailableCredits(id: string, tenantId: string) {
    const advances = await this.db
      .select({
        id: supplierTransactions.id,
        transactionNumber: supplierTransactions.transactionNumber,
        transactionType: supplierTransactions.transactionType,
        availableAmount: supplierAdvances.availableAmount,
      })
      .from(supplierTransactions)
      .leftJoin(
        supplierAdvances,
        eq(supplierTransactions.id, supplierAdvances.transactionId),
      )
      .where(
        and(
          eq(supplierTransactions.tenantId, tenantId),
          eq(supplierTransactions.transactionType, 'ADVANCE'),
          or(
            eq(supplierTransactions.status, 'ACTIVE'),
            eq(supplierTransactions.status, 'PARTIALLY_APPLIED'),
          ),
          eq(supplierAdvances.statusPayment, 'PAID'),
          eq(supplierTransactions.supplierId, id),
        ),
      );

    const noteCredit = await this.db
      .select({
        id: supplierTransactions.id,
        transactionNumber: supplierTransactions.transactionNumber,
        transactionType: supplierTransactions.transactionType,
        availableAmount: supplierCreditNotes.availableAmount,
      })
      .from(supplierTransactions)
      .leftJoin(
        supplierCreditNotes,
        eq(supplierTransactions.id, supplierCreditNotes.transactionId),
      )
      .where(
        and(
          eq(supplierTransactions.tenantId, tenantId),
          eq(supplierTransactions.transactionType, 'CREDIT_NOTE'),
          or(
            eq(supplierTransactions.status, 'ACTIVE'),
            eq(supplierTransactions.status, 'PARTIALLY_APPLIED'),
          ),
          eq(supplierTransactions.supplierId, id),
        ),
      );

    return [...advances, ...noteCredit];
  }

  async createAndExecutePayment(
    dto: any,
    userId: string,
    tenantId: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx || this.db;

    const validatePayment = await db
      .select()
      .from(supplierPayments)
      .where(
        and(
          eq(supplierPayments.tenantId, tenantId),
          eq(supplierPayments.supplierId, dto.supplierId),
          eq(supplierPayments.bankAccountId, dto.bankAccountId),
          eq(
            supplierPayments.paymentMethod,
            dto.paymentMethod as paymentMethodEnum,
          ),
          eq(supplierPayments.bankReference, dto.bankReference),
        ),
      );

    if (validatePayment.length !== 0) {
      throw new NotFoundException(`Payment with the same data already exists`);
    }

    const [cxp] = await db
      .select()
      .from(accountsPayable)
      .where(
        and(
          eq(accountsPayable.id, dto.accountPayableId),
          eq(accountsPayable.tenantId, tenantId),
        ),
      );

    return db.transaction(async (tx) => {
      const paymentNumber =
        await this.generateCodeService.generateNextReference(
          'PAG-P',
          tenantId,
          'purchasing',
          'payments',
          tx,
        );

      const [newPayment] = await tx
        .insert(supplierPayments)
        .values({
          tenantId,
          supplierId: dto.supplierId,
          paymentNumber: paymentNumber,
          totalAmount: dto.amount.toString(),
          currencyCode: 'VES',
          paymentMethod: dto.paymentMethod as paymentMethodEnum,
          bankAccountId: dto.bankAccountId,
          status: 'PROCESSED',
          requestedAt: new Date().toISOString(),
          createdById: userId,
          bankDescription: dto.paymentDescription,
          bankReference: dto.bankReference,
          bankTransactionDate:
            dto.transactionDate instanceof Date
              ? dto.transactionDate.toISOString()
              : String(dto.transactionDate),
          observations: `Pago cta. por pagar N°${cxp.accountsPayableNumber}`,
        })
        .returning({
          id: supplierPayments.id,
          reference: supplierPayments.paymentNumber,
        });

      await tx.insert(supplierPaymentLines).values({
        supplierPaymentId: newPayment.id,
        accountsPayableId: dto.accountPayableId,
        amount: dto.amount.toString(),
        description: dto.paymentDescription,
        createdById: userId,
      });

      const transactionNumber =
        await this.generateCodeService.generateNextReference(
          'TRS-P',
          tenantId,
          'purchasing',
          'transactions',
        );

      const [newTransaction] = await tx
        .insert(supplierTransactions)
        .values({
          tenantId,
          supplierId: dto.supplierId,
          transactionNumber: transactionNumber,
          transactionType: 'PAYMENT',
          transactionDate:
            dto.transactionDate instanceof Date
              ? dto.transactionDate.toISOString()
              : String(dto.transactionDate),
          amount: dto.amount.toString(),
          currencyCode: 'VES',
          status: 'APPLIED',
          paymentMethod: dto.paymentMethod as paymentMethodEnum,
          bankAccountId: dto.bankAccountId,
          bankReference: dto.bankReference,
          bankTransactionDate:
            dto.transactionDate instanceof Date
              ? dto.transactionDate.toISOString()
              : String(dto.transactionDate),
          observations: `Pago de Cuenta por Pagar N° ${cxp.accountsPayableNumber} con referencia a pago N° ${newPayment.reference}`,
          createdById: userId,
        })
        .returning({
          id: supplierTransactions.id,
          reference: supplierTransactions.transactionNumber,
        });

      await tx.insert(supplierTransactionApplications).values({
        tenantId,
        transactionId: newTransaction.id,
        accountsPayableId: dto.accountPayableId,
        appliedAmount: dto.amount.toString(),
        applicationDate: new Date().toISOString(),
        createdById: userId,
      });

      if (dto.creditAplied && dto.creditAplied.length !== 0) {
        for (const line of dto.creditAplied) {
          const [credit] = await tx
            .select()
            .from(supplierTransactions)
            .where(
              and(
                eq(supplierTransactions.id, line.id),
                eq(supplierTransactions.tenantId, tenantId),
                eq(
                  supplierTransactions.transactionType,
                  line.transactionType as supplierTransactionsTypeEnum,
                ),
              ),
            );
          const available = Number(credit.amount) - Number(line.appliedAmount);

          if (line.transactionType === 'CREDIT_NOTE') {
            await tx
              .update(supplierTransactions)
              .set({
                status: available === 0 ? 'APPLIED' : 'PARTIALLY_APPLIED',
                updatedById: userId,
              })
              .where(eq(supplierTransactions.id, line.id));

            await tx
              .update(supplierCreditNotes)
              .set({
                availableAmount: String(available),
                updatedById: userId,
              })
              .where(eq(supplierCreditNotes.transactionId, line.id));

            await tx.insert(supplierTransactionApplications).values({
              tenantId,
              transactionId: line.id,
              accountsPayableId: dto.accountPayableId,
              appliedAmount: String(line.appliedAmount),
              applicationDate: new Date().toISOString(),
              createdById: userId,
            });
          } else {
            await tx
              .update(supplierTransactions)
              .set({
                status: available === 0 ? 'APPLIED' : 'PARTIALLY_APPLIED',
                updatedById: userId,
              })
              .where(eq(supplierTransactions.id, line.id));

            await tx.update(supplierAdvances).set({
              availableAmount: String(available),
              updatedById: userId,
            });

            await tx.insert(supplierTransactionApplications).values({
              tenantId,
              transactionId: line.id,
              accountsPayableId: dto.accountPayableId,
              appliedAmount: String(line.appliedAmount),
              applicationDate: new Date().toISOString(),
              createdById: userId,
            });
          }
        }
      }

      const dataBank = {
        movement: {
          bankAccountId: dto.bankAccountId,
          transactionDate: dto.transactionDate ?? new Date(),
          paymentMethod: dto.paymentMethod as paymentMethodEnum,
          description: dto.paymentDescription ?? 'Pago proveedor',
          bankReference: dto?.bankReference ?? undefined,
          category: 'SUPPLIER_PAYMENT' as BankTransactionCategory,
          creditAmount: 0,
          debitAmount: dto.amount,
          createdById: userId,
        },
        links: [
          {
            internalRecordType: 'SUPPLIER_PAYMENT',
            internalRecordId: newTransaction.id,
          },
        ],
      };
      await this.bankMovementsService.createAndReconcile(
        dataBank as any,
        userId,
        tx as any,
      );

      const cashAmount = Number(dto.amount);
      const creditTotal = (dto.creditAplied || []).reduce(
        (sum: number, c: any) => sum + Number(c.appliedAmount),
        0,
      );

      const totalApplied = cashAmount + creditTotal;
      const newPaid = Number(cxp.paidAmount) + totalApplied;
      const newRem = Number(cxp.remainingAmount) - newPaid;

      let newStatus: string = 'PARTIALLY_PAID';
      if (newRem <= 0) newStatus = 'PAID';

      await tx
        .update(accountsPayable)
        .set({
          paidAmount: String(newPaid),
          remainingAmount: String(newRem),
          status: newStatus as paymentAccountsPayableEnum,
          updatedById: userId,
        })
        .where(eq(accountsPayable.id, dto.accountPayableId));

      if (newStatus === 'PAID' && cxp.supplierInvoiceId) {
        await tx
          .update(supplierInvoices)
          .set({
            status: 'PAID',
            updatedById: userId,
          })
          .where(eq(supplierInvoices.id, cxp.supplierInvoiceId));
      }

      if (!cxp.supplierInvoiceId) {
        return { data: newPayment };
      }

      const [supplierInvoice] = await tx
        .select({
          purchaseorderId: supplierInvoices.purchaseOrderId,
        })
        .from(supplierInvoices)
        .where(eq(supplierInvoices.id, cxp.supplierInvoiceId));

      if (supplierInvoice?.purchaseorderId) {
        if (newStatus === 'PAID') {
          await tx
            .update(purchaseOrders)
            .set({
              status: 'CLOSED',
              updatedById: userId,
            })
            .where(eq(purchaseOrders.id, supplierInvoice.purchaseorderId));
        }
      }

      return {
        data: newPayment,
      };
    });
  }

  async getPaymentHistory(accountsPayableId: string, tenantId: string) {
    const paymentLines = await this.db
      .select({
        paymentId: supplierPaymentLines.supplierPaymentId,
        amount: supplierPaymentLines.amount,
        description: supplierPaymentLines.description,
      })
      .from(supplierPaymentLines)
      .leftJoin(
        supplierPayments,
        eq(supplierPaymentLines.supplierPaymentId, supplierPayments.id),
      )
      .where(
        and(
          eq(supplierPaymentLines.accountsPayableId, accountsPayableId),
          eq(supplierPayments.tenantId, tenantId),
        ),
      );

    if (paymentLines.length === 0) {
      return [];
    }

    const paymentIds = paymentLines.map((line) => line.paymentId);

    const payments = await this.db
      .select()
      .from(supplierPayments)
      .where(inArray(supplierPayments.id, paymentIds));

    return payments.map((payment) => ({
      ...payment,
      lines: paymentLines.filter((line) => line.paymentId === payment.id),
    }));
  }

  async findOne(
    id: string,
    tenantId: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx || this.db;

    const [paymentRow] = await db
      .select({
        id: supplierPayments.id,
        paymentNumber: supplierPayments.paymentNumber,
        status: supplierPayments.status,
        totalAmount: supplierPayments.totalAmount,
        currencyCode: supplierPayments.currencyCode,
        paymentMethod: supplierPayments.paymentMethod,
        bankAccountId: supplierPayments.bankAccountId,
        bankTransactionDate: supplierPayments.bankTransactionDate,
        bankReference: supplierPayments.bankReference,
        observations: supplierPayments.observations,
        supplierId: suppliers.id,
        supplierName: suppliers.name,
        supplierTaxId: suppliers.taxId,
      })
      .from(supplierPayments)
      .leftJoin(suppliers, eq(supplierPayments.supplierId, suppliers.id))
      .where(
        and(
          eq(supplierPayments.id, id),
          eq(supplierPayments.tenantId, tenantId),
        ),
      );

    if (!paymentRow) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    const lines = await db
      .select({
        id: supplierPaymentLines.id,
        amount: supplierPaymentLines.amount,
        description: supplierPaymentLines.description,
        accountsPayableId: supplierPaymentLines.accountsPayableId,
        relatedAdvanceId: supplierPaymentLines.relatedAdvanceId,
      })
      .from(supplierPaymentLines)
      .where(eq(supplierPaymentLines.supplierPaymentId, id));

    return {
      ...paymentRow,
      supplier: {
        id: paymentRow.supplierId,
        name: paymentRow.supplierName,
        taxId: paymentRow.supplierTaxId,
      },
      lines,
    };
  }

  async reverse(dto: any, userId: string, tenantId: string) {
    const { paymentIds } = dto;

    if (!paymentIds || paymentIds.length === 0) {
      throw new BadRequestException('No payment IDs provided for reversal.');
    }

    return this.db.transaction(async (tx) => {
      const reversedPaymentsInfo: any[] = [];

      for (const paymentId of paymentIds) {
        const payment = await tx
          .select()
          .from(supplierPayments)
          .leftJoin(suppliers, eq(supplierPayments.supplierId, suppliers.id))
          .where(
            and(
              eq(supplierPayments.id, paymentId),
              eq(supplierPayments.tenantId, tenantId),
            ),
          );

        const paymentLines = await tx
          .select()
          .from(supplierPaymentLines)
          .where(eq(supplierPaymentLines.supplierPaymentId, paymentId));

        if (payment.length === 0) {
          throw new NotFoundException(
            `Payment with ID ${paymentId} not found.`,
          );
        }

        if (payment[0].supplier_payments.status !== 'PROCESSED') {
          throw new BadRequestException(
            `Payment with ID ${paymentId} is not in PROCESSED state and cannot be reversed.`,
          );
        }

        const reversedPaymentNumber = `REV-${payment[0].supplier_payments.paymentNumber}`;
        const [reversedPayment] = await tx
          .insert(supplierPayments)
          .values({
            tenantId,
            paymentNumber: reversedPaymentNumber,
            supplierId:
              payment[0]?.suppliers?.id ??
              payment[0].supplier_payments.supplierId,
            totalAmount: (-parseFloat(
              payment[0].supplier_payments.totalAmount,
            )).toString(),
            currencyCode: 'VES',
            paymentMethod: payment[0].supplier_payments.paymentMethod ?? null,
            bankAccountId: payment[0].supplier_payments.bankAccountId,
            status: 'REVERSED',
            requestedAt: payment[0].supplier_payments.requestedAt,
            processedAt: payment[0].supplier_payments.processedAt,
            reversedAt: new Date().toISOString(),
            observations: `REVERSA DE PAGO ${payment[0].supplier_payments.paymentNumber}`,
            createdById: userId,
            bankReference: payment[0].supplier_payments.bankReference ?? null,
            bankDescription:
              payment[0].supplier_payments.bankDescription ?? null,
            bankTransactionDate:
              payment[0].supplier_payments.bankTransactionDate ?? null,
          })
          .returning();

        const reversedLines = paymentLines.map((line) => ({
          supplierPaymentId: reversedPayment.id,
          accountsPayableId: line.accountsPayableId,
          amount: line.amount,
          description: `LÍNEA DE REVERSIÓN PARA PAGO ${payment[0].supplier_payments.paymentNumber}`,
          createdById: userId,
        }));
        await tx.insert(supplierPaymentLines).values(reversedLines);

        for (const line of paymentLines) {
          const accountPayableData = await tx
            .select()
            .from(accountsPayable)
            .leftJoin(
              supplierInvoices,
              eq(accountsPayable.supplierInvoiceId, supplierInvoices.id),
            )
            .where(
              and(eq(accountsPayable.id, line.accountsPayableId as string)),
            );

          if (accountPayableData.length > 0) {
            const originalPaidAmount = parseFloat(
              accountPayableData[0].accounts_payable.paidAmount,
            );
            const lineAmount = parseFloat(line.amount);

            const newPaidAmount = originalPaidAmount - lineAmount;
            const newRemainingAmount =
              parseFloat(
                accountPayableData[0].accounts_payable.remainingAmount,
              ) + lineAmount;

            await tx
              .update(accountsPayable)
              .set({
                paidAmount: newPaidAmount.toString(),
                remainingAmount: newRemainingAmount.toString(),
                status: 'PENDING',
                updatedById: userId,
              })
              .where(
                eq(
                  accountsPayable.id,
                  accountPayableData[0].accounts_payable.id,
                ),
              );

            if (accountPayableData[0].accounts_payable.supplierInvoiceId) {
              await tx
                .update(supplierInvoices)
                .set({ status: 'APPROVED', updatedById: userId })
                .where(
                  eq(
                    supplierInvoices.id,
                    accountPayableData[0].accounts_payable.supplierInvoiceId,
                  ),
                );

              if (accountPayableData[0]?.supplier_invoices?.purchaseOrderId) {
                await tx
                  .update(purchaseOrders)
                  .set({ status: 'RECEIVED', updatedById: userId })
                  .where(
                    eq(
                      purchaseOrders.id,
                      accountPayableData[0]?.supplier_invoices?.purchaseOrderId,
                    ),
                  );
              }
            }
          }
        }

        reversedPaymentsInfo.push({ id: paymentId, status: 'REVERSED' });
      }

      return {
        message: 'Payments reversed successfully.',
        reversedPayments: reversedPaymentsInfo,
      };
    });
  }
}
