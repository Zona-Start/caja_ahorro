import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  paymentAccountsPayableEnum,
  paymentMethodEnum,
  paymentSupplierStatusEnum,
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
import * as schema from 'src/database/index';
import { accountsPayable, supplierAdvances } from 'src/database/index';
import { CreateSupplierPaymenAdvanceDto } from './dto/create-supplier-payment-advance.dto';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { FilterAccountPayableDto } from './dto/filter-account-payable.dto';
import { FilterSupplierPaymentDto } from './dto/filter-supplier-payment.dto';
import { ReversePaymentsDto } from './dto/reverse-payments.dto';

@Injectable()
export class SupplierPaymentsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly bankMovementsService: BankMovementsService,
    private readonly generateCodeService: GenerateCodeService,
  ) {}

  //metodo para listar los pagos realizados
  async findAll(paginationDto: FilterSupplierPaymentDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      status,
      startDate,
      endDate,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(
        ilike(schema.supplierPayments.paymentNumber, `%${search}%`),
      );
    }

    if (status) {
      let parsedSupplierStatus: paymentSupplierStatusEnum[] = [];
      if (Array.isArray(status)) {
        if (status.length === 1 && status[0].includes(',')) {
          // Si es un array con un string con comas, separar
          parsedSupplierStatus = status[0].split(
            ',',
          ) as paymentSupplierStatusEnum[];
        } else {
          parsedSupplierStatus = status as paymentSupplierStatusEnum[];
        }
      } else if (typeof status === 'string') {
        parsedSupplierStatus = status.split(',') as paymentSupplierStatusEnum[];
      }

      // Ahora pasamos array limpio a inArray (o al filtro manual con OR)
      if (parsedSupplierStatus.length > 0) {
        searchConditions.push(
          inArray(schema.supplierPayments.status, parsedSupplierStatus),
        );
      }
    }

    if (startDate) {
      searchConditions.push(
        sql`${schema.supplierPayments.requestedAt} >= ${startDate.toISOString()}`,
      );
    }
    if (endDate) {
      searchConditions.push(
        sql`${schema.supplierPayments.requestedAt} <= ${endDate.toISOString()}`,
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.supplierPayments[sortBy as keyof typeof schema.supplierPayments]} asc`
        : sql`${schema.supplierPayments[sortBy as keyof typeof schema.supplierPayments]} desc`;

    // Step 1: Get total count of unique payments
    const totalCountResult = await this.db
      .select({
        count: sql<number>`count(DISTINCT ${schema.supplierPayments.id})`,
      }) // Count distinct payments
      .from(schema.supplierPayments)
      .leftJoin(
        schema.supplierPaymentLines,
        eq(
          schema.supplierPayments.id,
          schema.supplierPaymentLines.supplierPaymentId,
        ),
      ) // Join lines for filtering if needed
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Step 2: Get payments with pagination and joined lines
    const rawPayments = await this.db
      .select({
        payment: schema.supplierPayments, // Select the whole payment object
        supplier: schema.suppliers, // Select the whole supplier object
        line: schema.supplierPaymentLines, // Select the whole line object
        accountPayable: schema.accountsPayable,
      })
      .from(schema.supplierPayments)
      .leftJoin(
        schema.suppliers,
        eq(schema.supplierPayments.supplierId, schema.suppliers.id),
      )
      .leftJoin(
        schema.supplierPaymentLines,
        eq(
          schema.supplierPayments.id,
          schema.supplierPaymentLines.supplierPaymentId,
        ),
      ) // Join supplierPaymentLines
      .leftJoin(
        schema.accountsPayable,
        eq(
          schema.accountsPayable.id,
          schema.supplierPaymentLines.accountsPayableId,
        ),
      )
      .limit(limit)
      .offset(offset)
      .where(searchCondition)
      .orderBy(orderBy);

    // Step 3: Group raw results into structured payment objects with nested lines
    const groupedPayments = new Map<number, any>();

    for (const row of rawPayments) {
      // ← for…of en lugar de forEach
      const paymentId = row.payment.id;

      if (!groupedPayments.has(paymentId)) {
        let referen = '';
        if (row.line?.accountsPayableId === null) {
          const [get] = await this.db
            .select({
              transactionNumber: schema.supplierTransactions.transactionNumber,
            })
            .from(schema.supplierTransactions)
            .where(
              eq(
                schema.supplierTransactions.id,
                Number(row.line.relatedAdvanceId),
              ),
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

  //metodo listar cxp y anticipos pendientes por pagar
  async getPaymentPending(paginationDto: FilterAccountPayableDto) {
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

    let searchConditions: SQL<unknown>[] = [];
    let searchConditionsAdvance: SQL<unknown>[] = [];

    // --- Lógica de Filtrado (igual que antes) ---
    if (search) {
      searchConditions.push(
        ilike(accountsPayable.accountsPayableNumber, `%${search}%`),
      );
      searchConditionsAdvance.push(
        ilike(schema.supplierTransactions.transactionNumber, `%${search}%`),
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
          inArray(schema.accountsPayable.status, parsedSupplierStatus),
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

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const searchConditionAdvanceFinal = searchConditionsAdvance.length
      ? and(
          ...searchConditionsAdvance,
          eq(supplierAdvances.statusPayment, 'PENDING'),
        )
      : eq(supplierAdvances.statusPayment, 'PENDING');

    // --- Proyecciones ---
    const accountsPayableSelect = this.db
      .select({
        id: schema.accountsPayable.id,
        supplierId: schema.accountsPayable.supplierId,
        supplierName: schema.suppliers.name,
        reference:
          sql<string>`COALESCE(${schema.accountsPayable.accountsPayableNumber}, '')`.as(
            'reference',
          ),
        amount:
          sql<string>`COALESCE(${schema.accountsPayable.remainingAmount}, '0.00')`.as(
            'amount',
          ),
        status:
          sql<string>`COALESCE(${schema.accountsPayable.status}::text, 'PENDING')`.as(
            'status',
          ),
        date: schema.accountsPayable.dueDate!,
        type: sql<string>`'ACCOUNTS_PAYABLE'`.as('type'),
      })
      .from(accountsPayable)
      .leftJoin(
        schema.suppliers,
        eq(accountsPayable.supplierId, schema.suppliers.id),
      )
      .where(searchCondition);

    const advanceSelect = this.db
      .select({
        id: supplierAdvances.transactionId, // ← id único del anticipo
        supplierId: supplierAdvances.supplierId,
        supplierName: schema.suppliers.name,
        reference:
          sql<string>`COALESCE(${schema.supplierTransactions.transactionNumber}, '')`.as(
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
        date: schema.supplierTransactions.transactionDate!,
        type: sql<string>`'ADVANCE'`.as('type'),
      })
      .from(supplierAdvances)
      .leftJoin(
        schema.suppliers,
        eq(supplierAdvances.supplierId, schema.suppliers.id),
      )
      .leftJoin(
        schema.supplierTransactions,
        eq(schema.supplierTransactions.id, supplierAdvances.transactionId),
      )
      .where(searchConditionAdvanceFinal);

    // --- CTE + UNION ALL ---
    const combinedData = this.db
      .$with('combined_data')
      .as(accountsPayableSelect.unionAll(advanceSelect));

    // --- Ordenamiento ---
    const combinedSchema = combinedData._.selectedFields;
    const orderByColumn =
      combinedSchema[sortBy as keyof typeof combinedSchema] ??
      combinedSchema.date;
    const finalOrderBy =
      sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

    // --- Consulta única con CTE adjunta ---
    const result = await this.db
      .with(combinedData) // ← CTE atada al mismo query
      .select({
        ...combinedSchema,
        totalCount: sql<number>`count(*) over()`.as('totalCount'),
      })
      .from(combinedData)
      .orderBy(finalOrderBy)
      .limit(limit)
      .offset(offset);

    // --- Procesar resultado ---
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

  //metodo para crear un pago de anticipo
  async createPayAdvance(
    dto: CreateSupplierPaymenAdvanceDto,
    userId?: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx || this.db;
    const getTransiction = await db
      .select()
      .from(schema.supplierTransactions)
      .where(eq(schema.supplierTransactions.id, dto.transactionId));

    if (getTransiction.length === 0) {
      throw new NotFoundException(
        `Transaction Advance with ID ${dto.transactionId} not found`,
      );
    }

    return db.transaction(async (tx) => {
      const paymentNumber =
        await this.generateCodeService.generateNextReference('PAG-P', tx);

      const [newPayment] = await tx
        .insert(schema.supplierPayments)
        .values({
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
          bankTransactionDate: dto.transactionDate.toISOString(),
          observations: 'Pago de Anticipo',
          processedAt: new Date().toISOString(),
        })
        .returning({
          id: schema.supplierPayments.id,
          reference: schema.supplierPayments.paymentNumber,
        });

      await tx.insert(schema.supplierPaymentLines).values({
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
        .update(schema.supplierTransactions)
        .set({
          paymentMethod: dto.paymentMethod as paymentMethodEnum,
          bankAccountId: dto.bankAccountId,
          bankReference: dto.bankReference,
          bankTransactionDate: dto.transactionDate.toISOString(),
          updatedById: userId,
        })
        .where(eq(schema.supplierTransactions.id, dto.transactionId));

      return newPayment;
    });
  }

  //metodo para consultar una cuenta por pagar
  async getOneSupplierPaymentByAccountId(id: number) {
    const account = await this.db
      .select({
        id: schema.accountsPayable.id,
        supplierId: schema.accountsPayable.supplierId,
        supplierName: schema.suppliers.name,
        accountsPayableNumber: schema.accountsPayable.accountsPayableNumber,
        amount: schema.accountsPayable.originalAmount,
        paidAmount: schema.accountsPayable.paidAmount,
        remaingAmount: schema.accountsPayable.remainingAmount,
        invoiceNumber: schema.supplierInvoices.invoiceNumber,
      })
      .from(accountsPayable)
      .leftJoin(
        schema.suppliers,
        eq(accountsPayable.supplierId, schema.suppliers.id),
      )
      .leftJoin(
        schema.supplierInvoices,
        eq(accountsPayable.supplierInvoiceId, schema.supplierInvoices.id),
      )
      .where(eq(accountsPayable.id, id));

    const note = await this.db
      .select({
        id: schema.supplierTransactionApplications.id,
        referenceNote: schema.supplierTransactions.transactionNumber,
        appliedAmount: schema.supplierTransactionApplications.appliedAmount,
      })
      .from(schema.supplierTransactionApplications)
      .innerJoin(
        schema.supplierTransactions,
        eq(
          schema.supplierTransactions.id,
          schema.supplierTransactionApplications.transactionId,
        ),
      )
      .where(eq(schema.supplierTransactionApplications.accountsPayableId, id));

    return {
      data: {
        account: account[0],
        note: note ? note : null,
      },
    };
  }

  //metodo para devolver los creditos disponibles para un proveedor
  async getSupplierAvailableCredits(id: number) {
    // 1. Get available advances from accountsPayable
    const advances = await this.db
      .select({
        id: schema.supplierTransactions.id,
        transactionNumber: schema.supplierTransactions.transactionNumber,
        transactionType: schema.supplierTransactions.transactionType,
        availableAmount: schema.supplierAdvances.availableAmount,
      })
      .from(schema.supplierTransactions)
      .leftJoin(
        schema.supplierAdvances,
        eq(
          schema.supplierTransactions.id,
          schema.supplierAdvances.transactionId,
        ),
      )
      .where(
        and(
          eq(schema.supplierTransactions.transactionType, 'ADVANCE'),
          or(
            eq(schema.supplierTransactions.status, 'ACTIVE'),
            eq(schema.supplierTransactions.status, 'PARTIALLY_APPLIED'),
          ),
          eq(schema.supplierAdvances.statusPayment, 'PAID'),
          eq(schema.supplierTransactions.supplierId, id),
        ),
      );

    const noteCredit = await this.db
      .select({
        id: schema.supplierTransactions.id,
        transactionNumber: schema.supplierTransactions.transactionNumber,
        transactionType: schema.supplierTransactions.transactionType,
        availableAmount: schema.supplierCreditNotes.availableAmount,
      })
      .from(schema.supplierTransactions)
      .leftJoin(
        schema.supplierCreditNotes,
        eq(
          schema.supplierTransactions.id,
          schema.supplierCreditNotes.transactionId,
        ),
      )
      .where(
        and(
          eq(schema.supplierTransactions.transactionType, 'CREDIT_NOTE'),
          or(
            eq(schema.supplierTransactions.status, 'ACTIVE'),
            eq(schema.supplierTransactions.status, 'PARTIALLY_APPLIED'),
          ),
          eq(schema.supplierTransactions.supplierId, id),
        ),
      );

    // 3. Combine and return
    return [...advances, ...noteCredit];
  }

  //metodo para ejecutar un pago
  async createAndExecutePayment(
    dto: CreateSupplierPaymentDto,
    userId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx || this.db;

    const validatePayment = await db
      .select()
      .from(schema.supplierPayments)
      .where(
        and(
          eq(schema.supplierPayments.supplierId, dto.supplierId),
          eq(schema.supplierPayments.bankAccountId, dto.bankAccountId),
          eq(
            schema.supplierPayments.paymentMethod,
            dto.paymentMethod as paymentMethodEnum,
          ),
          eq(schema.supplierPayments.bankReference, dto.bankReference),
        ),
      );

    if (validatePayment.length !== 0) {
      throw new NotFoundException(`Payment with the same data already exists`);
    }

    const [cxp] = await db
      .select()
      .from(accountsPayable)
      .where(eq(accountsPayable.id, dto.accountPayableId));

    return db.transaction(async (tx) => {
      const paymentNumber =
        await this.generateCodeService.generateNextReference('PAG-P', tx);

      const [newPayment] = await tx
        .insert(schema.supplierPayments)
        .values({
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
          bankTransactionDate: dto.transactionDate.toISOString(),
          observations: `Pago cta. por pagar N°${cxp.accountsPayableNumber}`,
        })
        .returning({
          id: schema.supplierPayments.id,
          reference: schema.supplierPayments.paymentNumber,
        });

      await tx.insert(schema.supplierPaymentLines).values({
        supplierPaymentId: newPayment.id,
        accountsPayableId: dto.accountPayableId,
        amount: dto.amount.toString(),
        description: dto.paymentDescription,
        createdById: userId,
      });

      const transactionNumber =
        await this.generateCodeService.generateNextReference('TRS-P');

      const [newTransaction] = await tx
        .insert(schema.supplierTransactions)
        .values({
          companyId: cxp.companyId,
          supplierId: dto.supplierId,
          transactionNumber: transactionNumber,
          transactionType: 'PAYMENT',
          transactionDate: dto.transactionDate.toISOString(),
          amount: dto.amount.toString(),
          currencyCode: 'VES',
          status: 'APPLIED',
          paymentMethod: dto.paymentMethod as paymentMethodEnum,
          bankAccountId: dto.bankAccountId,
          bankReference: dto.bankReference,
          bankTransactionDate: dto.transactionDate.toISOString(),
          observations: `Pago de Cuenta por Pagar N° ${cxp.accountsPayableNumber} con referencia a pago N° ${newPayment.reference}`,
          createdById: userId,
        })
        .returning({
          id: schema.supplierTransactions.id,
          reference: schema.supplierTransactions.transactionNumber,
        });

      await tx.insert(schema.supplierTransactionApplications).values({
        transactionId: newTransaction.id,
        accountsPayableId: dto.accountPayableId,
        appliedAmount: dto.amount.toString(),
        applicationDate: new Date().toISOString(),
        createdById: userId,
      });

      if (dto.creditAplied.length !== 0) {
        for (const line of dto.creditAplied) {
          const [credit] = await tx
            .select()
            .from(schema.supplierTransactions)
            .where(
              and(
                eq(schema.supplierTransactions.id, line.id),
                eq(
                  schema.supplierTransactions.transactionType,
                  line.transactionType as supplierTransactionsTypeEnum,
                ),
              ),
            );
          const available = Number(credit.amount) - Number(line.appliedAmount);

          if (line.transactionType === 'CREDIT_NOTE') {
            await tx
              .update(schema.supplierTransactions)
              .set({
                status: available === 0 ? 'APPLIED' : 'PARTIALLY_APPLIED',
                updatedById: userId,
              })
              .where(eq(schema.supplierTransactions.id, line.id));

            await tx
              .update(schema.supplierCreditNotes)
              .set({
                availableAmount: String(available),
                updatedById: userId,
              })
              .where(eq(schema.supplierCreditNotes.transactionId, line.id));

            await tx.insert(schema.supplierTransactionApplications).values({
              transactionId: line.id,
              accountsPayableId: dto.accountPayableId,
              appliedAmount: String(line.appliedAmount),
              applicationDate: new Date().toISOString(),
              createdById: userId,
            });
          } else {
            await tx
              .update(schema.supplierTransactions)
              .set({
                status: available === 0 ? 'APPLIED' : 'PARTIALLY_APPLIED',
                updatedById: userId,
              })
              .where(eq(schema.supplierTransactions.id, line.id));

            await tx.update(supplierAdvances).set({
              availableAmount: String(available),
              updatedById: userId,
            });

            await tx.insert(schema.supplierTransactionApplications).values({
              transactionId: line.id,
              accountsPayableId: dto.accountPayableId,
              appliedAmount: String(line.appliedAmount),
              applicationDate: new Date().toISOString(),
              createdById: userId,
            });
          }
        }
      }

      // 1) Crear movimiento bancario (solo si hay efectivo saliente)
      await this.bankMovementsService.create(
        {
          bankAccountId: Number(dto.bankAccountId),
          transactionDate:
            dto.transactionDate.toISOString() || new Date().toISOString(),
          description: dto.paymentDescription ?? 'Pago proveedor',
          debitAmount: dto.amount, // <--- usar solo efectivo saliente
          creditAmount: 0,
          bankReference: dto?.bankReference ?? undefined,
          transactionType: dto.paymentMethod as paymentMethodEnum,
          category: 'INTERNAL_TRANSFER',
          createdById: userId,
          internalRecordType: 'PAYMENT_SUPPLIER',
          internalRecordId: newPayment.id,
        },
        userId,
        tx,
      );

      /** Actualizar la cuenta por pagar ***/

      //calculamos los saldos
      const cashAmount = Number(dto.amount); // pago en efectivo / banco
      const creditTotal = dto.creditAplied.reduce(
        (sum, c) => sum + Number(c.appliedAmount),
        0,
      );

      const totalApplied = cashAmount + creditTotal; // <- lo que baja al pendiente

      // 2. Nuevos saldos
      const newPaid = Number(cxp.paidAmount) + totalApplied;
      const newRem = Number(cxp.remainingAmount) - newPaid;
      // 3. Decidir status
      let newStatus: string = 'IN_PROGRESS';
      if (newRem === 0) newStatus = 'PAID';

      // 4. Actualizar CxP
      await tx
        .update(accountsPayable)
        .set({
          paidAmount: String(newPaid),
          remainingAmount: String(newRem),
          status: newStatus as paymentAccountsPayableEnum,
          updatedById: userId,
        })
        .where(eq(accountsPayable.id, dto.accountPayableId));

      //actualizar la factura si es neesario
      if (newStatus === 'PAID') {
        await tx
          .update(schema.supplierInvoices)
          .set({
            status: 'PAID',
            updatedById: userId,
          })
          .where(eq(schema.supplierInvoices.id, Number(cxp.supplierInvoiceId)));
      }
      //actualizar la orden de compra si es necesario
      const [supplierInvoice] = await tx
        .select({
          purchaseorderId: schema.supplierInvoices.purchaseOrderId,
        })
        .from(schema.supplierInvoices)
        .where(eq(schema.supplierInvoices.id, Number(cxp.supplierInvoiceId)));

      if (supplierInvoice.purchaseorderId) {
        if (newStatus === 'PAID') {
          await tx
            .update(schema.purchaseOrders)
            .set({
              status: 'CLOSED',
              updatedById: userId,
            })
            .where(
              eq(schema.purchaseOrders.id, supplierInvoice.purchaseorderId),
            );
        }
      }

      return {
        data: newPayment,
      };
    });
  }

  async getPaymentHistory(accountsPayableId: number) {
    const paymentLines = await this.db
      .select({
        paymentId: schema.supplierPaymentLines.supplierPaymentId,
        amount: schema.supplierPaymentLines.amount,
        description: schema.supplierPaymentLines.description,
      })
      .from(schema.supplierPaymentLines)
      .where(
        eq(schema.supplierPaymentLines.accountsPayableId, accountsPayableId),
      );

    if (paymentLines.length === 0) {
      return [];
    }

    const paymentIds = paymentLines.map((line) => line.paymentId);

    const payments = await this.db
      .select()
      .from(schema.supplierPayments)
      .where(inArray(schema.supplierPayments.id, paymentIds));

    return payments.map((payment) => ({
      ...payment,
      lines: paymentLines.filter((line) => line.paymentId === payment.id),
    }));
  }

  async findAllPaymentBySuppliers(paginationDto: FilterSupplierPaymentDto) {
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

    let searchConditions: SQL<unknown>[] = [];

    let parsedSupplierIds: number[] = [];
    if (supplierIds) {
      if (Array.isArray(supplierIds)) {
        // Maneja el caso de [1,2,3]
        parsedSupplierIds = supplierIds.map((id) => parseInt(id as any, 10));
      } else if (typeof supplierIds === 'number') {
        // Maneja el caso de un solo número
        parsedSupplierIds = [supplierIds];
      }

      if (parsedSupplierIds.length > 0) {
        searchConditions.push(
          inArray(schema.supplierPayments.supplierId, parsedSupplierIds),
        );
      }
    }

    if (startDate) {
      searchConditions.push(
        sql`${schema.supplierPayments.requestedAt} >= ${startDate.toISOString()}`,
      );
    }
    if (endDate) {
      searchConditions.push(
        sql`${schema.supplierPayments.requestedAt} <= ${endDate.toISOString()}`,
      );
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.supplierPayments[sortBy as keyof typeof schema.supplierPayments]} asc`
        : sql`${schema.supplierPayments[sortBy as keyof typeof schema.supplierPayments]} desc`;

    // Step 1: Get total count of unique payments
    const totalCountResult = await this.db
      .select({
        count: sql<number>`count(DISTINCT ${schema.supplierPayments.id})`,
      }) // Count distinct payments
      .from(schema.supplierPayments)
      .leftJoin(
        schema.supplierPaymentLines,
        eq(
          schema.supplierPayments.id,
          schema.supplierPaymentLines.supplierPaymentId,
        ),
      ) // Join lines for filtering if needed
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Step 2: Get payments with pagination and joined lines
    const rawPayments = await this.db
      .select({
        payment: schema.supplierPayments, // Select the whole payment object
        supplier: schema.suppliers, // Select the whole supplier object
        line: schema.supplierPaymentLines, // Select the whole line object
        accountPayable: schema.accountsPayable,
      })
      .from(schema.supplierPayments)
      .leftJoin(
        schema.suppliers,
        eq(schema.supplierPayments.supplierId, schema.suppliers.id),
      )
      .leftJoin(
        schema.supplierPaymentLines,
        eq(
          schema.supplierPayments.id,
          schema.supplierPaymentLines.supplierPaymentId,
        ),
      ) // Join supplierPaymentLines
      .leftJoin(
        schema.accountsPayable,
        eq(
          schema.accountsPayable.id,
          schema.supplierPaymentLines.accountsPayableId,
        ),
      )
      .limit(limit)
      .offset(offset)
      .where(searchCondition)
      .orderBy(orderBy);

    // Step 3: Group raw results into structured payment objects with nested lines
    const groupedPayments = new Map<number, any>();

    rawPayments.forEach((row) => {
      const paymentId = row.payment.id;
      if (!groupedPayments.has(paymentId)) {
        groupedPayments.set(paymentId, {
          ...row.payment,
          totalAmount: Number(row.payment.totalAmount), // Convert to number
          supplierName: row.supplier?.name, // Add supplier name
          lines: [], // Initialize lines array
          accountPayableNumber: row.accountPayable?.accountsPayableNumber,
        });
      }
      if (row.line) {
        const payment = groupedPayments.get(paymentId);
        payment.lines.push({
          ...row.line,
          amount: Number(row.line.amount), // Convert to number
        });
      }
    });

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

  async findOne(id: number, tx?: NodePgDatabase<typeof schema>) {
    const db = tx || this.db;
    // 1. Cabecera + proveedor
    const [paymentRow] = await db
      .select({
        id: schema.supplierPayments.id,
        paymentNumber: schema.supplierPayments.paymentNumber,
        status: schema.supplierPayments.status,
        totalAmount: schema.supplierPayments.totalAmount,
        currencyCode: schema.supplierPayments.currencyCode,
        paymentMethod: schema.supplierPayments.paymentMethod,
        bankAccountId: schema.supplierPayments.bankAccountId,
        bankTransactionDate: schema.supplierPayments.bankTransactionDate,
        bankReference: schema.supplierPayments.bankReference,
        observations: schema.supplierPayments.observations,
        supplierId: schema.suppliers.id,
        supplierName: schema.suppliers.name,
        supplierTaxId: schema.suppliers.taxId,
      })
      .from(schema.supplierPayments)
      .leftJoin(
        schema.suppliers,
        eq(schema.supplierPayments.supplierId, schema.suppliers.id),
      )
      .where(eq(schema.supplierPayments.id, id));

    if (!paymentRow) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // 2. Líneas
    const lines = await db
      .select({
        id: schema.supplierPaymentLines.id,
        amount: schema.supplierPaymentLines.amount,
        description: schema.supplierPaymentLines.description,
        accountsPayableId: schema.supplierPaymentLines.accountsPayableId,
        relatedAdvanceId: schema.supplierPaymentLines.relatedAdvanceId,
      })
      .from(schema.supplierPaymentLines)
      .where(eq(schema.supplierPaymentLines.supplierPaymentId, id));

    // 3. Ensamblar
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

  // async createAndExecuteBulkPayments(
  //   dtos: CreateSupplierPaymentDto[],
  //   userId: number,
  // ) {
  //   if (!dtos || dtos.length === 0) {
  //     throw new BadRequestException('No payment data provided.');
  //   }

  //   const payload = dtos.map((dto) => ({
  //     ...dto,
  //     bankTransactionDate: new Date(dto.bankTransactionDate),
  //   }));

  //   // Usar una transacción maestra para asegurar que todo el proceso sea atómico
  //   // Si una parte falla, todo se revierte.
  //   return this.db.transaction(async (tx) => {
  //     const results: any[] = [];
  //     for (const dto of payload) {
  //       // Lógica para procesar un solo pago dentro del bucle

  //       const newPayment = await this.createDraft(dto, userId, tx);
  //       const validatedPayment = await this.validate(newPayment.id, userId, tx);
  //       const executedPayment = await this.execute(
  //         Number(validatedPayment[0].id),
  //         userId,
  //         tx,
  //       );
  //       results.push(executedPayment);
  //     }
  //     return {
  //       message: 'Payments processed successfully',
  //     };
  //   });
  // }

  async reverse(reversePaymentsDto: ReversePaymentsDto, userId: number) {
    const { paymentIds } = reversePaymentsDto;

    if (!paymentIds || paymentIds.length === 0) {
      throw new BadRequestException('No payment IDs provided for reversal.');
    }

    return this.db.transaction(async (tx) => {
      const reversedPaymentsInfo: any[] = [];

      for (const paymentId of paymentIds) {
        const payment = await tx
          .select()
          .from(schema.supplierPayments)
          .leftJoin(
            schema.suppliers,
            eq(schema.supplierPayments.supplierId, schema.suppliers.id),
          )
          .where(eq(schema.supplierPayments.id, paymentId));

        const paymentLines = await tx
          .select()
          .from(schema.supplierPaymentLines)
          .where(eq(schema.supplierPaymentLines.supplierPaymentId, paymentId));

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

        // 1. Create the reversed payment header
        const reversedPaymentNumber = `REV-${payment[0].supplier_payments.paymentNumber}`;
        const [reversedPayment] = await tx
          .insert(schema.supplierPayments)
          .values({
            paymentNumber: reversedPaymentNumber,
            supplierId: payment[0]?.suppliers?.id as number,
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

        // 2. Create reversed payment lines
        const reversedLines = paymentLines.map((line) => ({
          supplierPaymentId: reversedPayment.id,
          accountsPayableId: line.accountsPayableId,
          amount: line.amount,
          description: `LÍNEA DE REVERSIÓN PARA PAGO ${payment[0].supplier_payments.paymentNumber}`,
          createdById: userId,
        }));
        await tx.insert(schema.supplierPaymentLines).values(reversedLines);

        // 3. Create reversed supplier transactions and update related entities
        for (const line of paymentLines) {
          // a. Create reversed supplier transaction
          // await tx.insert(schema.supplierTransactions).values({
          //   accountsPayableId: line.accountsPayableId,
          //   transactionNumber: `REV-${payment[0].supplier_payments.paymentNumber}-${line.id}`,
          //   transactionType: 'REVERSED',
          //   transactionDate: new Date().toISOString(),
          //   amount: line.amount,
          //   direction: 'DR', // Debit to reverse the original credit
          //   currencyCode: 'VES',
          //   status: 'REVERSED',
          //   paymentId: reversedPayment.id, // Link to the new reversed payment
          //   createdById: userId,
          // });

          // b. Update accounts payable
          const accountPayable = await tx
            .select()
            .from(schema.accountsPayable)
            .leftJoin(
              schema.supplierInvoices,
              eq(
                schema.accountsPayable.supplierInvoiceId,
                schema.supplierInvoices.id,
              ),
            )
            .where(
              and(
                eq(schema.accountsPayable.id, line.accountsPayableId as number),
                // or(
                //   ne(schema.accountsPayable.status, 'ADVANCE'),
                //   ne(schema.accountsPayable.status, 'ADVANCE_APPLIED'),
                // ),
              ),
            );

          if (accountPayable) {
            const originalPaidAmount = parseFloat(
              accountPayable[0].accounts_payable.paidAmount,
            );
            const lineAmount = parseFloat(line.amount);

            const newPaidAmount = originalPaidAmount - lineAmount;
            const newRemainingAmount =
              parseFloat(accountPayable[0].accounts_payable.remainingAmount) +
              lineAmount;

            await tx
              .update(schema.accountsPayable)
              .set({
                paidAmount: newPaidAmount.toString(),
                remainingAmount: newRemainingAmount.toString(),
                status: 'PENDING', // Revert status to PENDING
                updatedById: userId,
              })
              .where(
                eq(
                  schema.accountsPayable.id,
                  accountPayable[0].accounts_payable.id,
                ),
              );

            // c. Update supplier invoice status
            if (accountPayable[0].accounts_payable.supplierInvoiceId) {
              await tx
                .update(schema.supplierInvoices)
                .set({ status: 'ACCOUNTED_FOR', updatedById: userId })
                .where(
                  eq(
                    schema.supplierInvoices.id,
                    accountPayable[0].accounts_payable
                      .supplierInvoiceId as number,
                  ),
                );

              // d. Update purchase order status if it exists
              if (accountPayable[0]?.supplier_invoices?.purchaseOrderId) {
                await tx
                  .update(schema.purchaseOrders)
                  .set({ status: 'INVOICED', updatedById: userId })
                  .where(
                    eq(
                      schema.purchaseOrders.id,
                      accountPayable[0]?.supplier_invoices?.purchaseOrderId,
                    ),
                  );
              }
            }
          }
        }

        // // 4. Update original payment status to REVERSED
        // await tx
        //   .update(schema.supplierPayments)
        //   .set({
        //     status: 'REVERSED',
        //     reversedAt: new Date(),
        //     updatedById: userId,
        //   })
        //   .where(eq(schema.supplierPayments.id, paymentId));

        reversedPaymentsInfo.push({ id: paymentId, status: 'REVERSED' });
      }

      return {
        message: 'Payments reversed successfully.',
        reversedPayments: reversedPaymentsInfo,
      };
    });
  }
}
