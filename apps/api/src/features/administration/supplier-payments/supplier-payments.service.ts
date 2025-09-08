import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  CurrencyCodeEnum,
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
import { and, eq, ilike, inArray, ne, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { AccountsPayableService } from '../accounts-payable/accounts-payable.service';
import { SupplierInvoicesService } from '../supplier-invoices/supplier-invoices.service';
import { CreateAdvancePaymentDto } from './dto/create-advance-payment.dto';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { FilterSupplierPaymentDto } from './dto/filter-supplier-payment.dto';
import { ReversePaymentsDto } from './dto/reverse-payments.dto';
import { UpdateSupplierPaymentDto } from './dto/update-supplier-payment.dto';

@Injectable()
export class SupplierPaymentsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly bankMovementsService: BankMovementsService,
    private readonly accountsPayableService: AccountsPayableService,
    private readonly generateCodeService: GenerateCodeService,
    private readonly supplierInvoicesService: SupplierInvoicesService,
  ) {}

  async createDraft(
    dto: CreateSupplierPaymentDto,
    userId?: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx || this.db;
    return db.transaction(async (tx) => {
      const paymentNumber =
        await this.generateCodeService.generateNextReference('PAG-P', tx);
      const [newPayment] = await tx
        .insert(schema.supplierPayments)
        .values({
          supplierId: dto.supplierId,
          paymentNumber: paymentNumber,
          totalAmount: dto.totalAmount.toString(),
          currencyCode: 'VES',
          paymentMethod: dto.paymentMethod as paymentMethodEnum,
          bankAccountId: dto.bankAccountId,
          status: 'DRAFT',
          requestedAt: new Date().toISOString(),
          createdById: userId,
          bankDescription: dto.bankDescription,
          bankReference: dto.bankReference,
          bankTransactionDate: dto.bankTransactionDate.toISOString(),
          observations:
            dto.observations ?? `PAGO DE CTA. POR PAGAR  ${paymentNumber}`,
        })
        .returning();

      const paymentLines = dto.lines.map((line) => ({
        ...line,
        accountsPayableId: line.accountsPayableId,
        amount: line.amount.toString(),
        createdById: userId,
        supplierPaymentId: newPayment.id,
      }));

      await tx.insert(schema.supplierPaymentLines).values(paymentLines);

      return newPayment;
    });
  }

  async findAll(paginationDto: FilterSupplierPaymentDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      supplierIds,
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
    if (supplierIds && supplierIds.length > 0) {
      searchConditions.push(
        inArray(schema.supplierPayments.supplierId, supplierIds),
      );
    }
    if (status) {
      searchConditions.push(eq(schema.supplierPayments.status, status as any));
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

  async updateDraft(
    id: number,
    updateSupplierPaymentDto: UpdateSupplierPaymentDto,
  ) {
    const payment = await this.findOne(id);
    if (payment.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT payments can be edited.');
    }

    // Lógica para actualizar cabecera y líneas (simplificado)
    return this.db
      .update(schema.supplierPayments)
      .set(updateSupplierPaymentDto)
      .where(eq(schema.supplierPayments.id, id))
      .returning();
  }

  async validate(
    id: number,
    userId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx || this.db;
    const payment = await this.findOne(id, tx);
    if (payment.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT payments can be validated.');
    }

    // TODO: Verificar totales, cuentas bancarias, disponibilidad de fondos, etc.
    //console.log('Validating payment...');

    return db
      .update(schema.supplierPayments)
      .set({ status: 'PENDING', updatedById: userId })
      .where(eq(schema.supplierPayments.id, id))
      .returning({
        id: schema.supplierPayments.id,
        status: schema.supplierPayments.status,
      });
  }

  // async generateBatch(id: number) {
  //   const payment = await this.findOne(id);
  //   // TODO: Lógica para generar el archivo TXT del lote bancario
  //   console.log('Generating batch file...');

  //   return this.db
  //     .update(schema.supplierPayments)
  //     .set({ status: 'SENT_TO_BANK' })
  //     .where(eq(schema.supplierPayments.id, id))
  //     .returning();
  // }

  // async processResponse(id: number, response: any) {
  //   const payment = await this.findOne(id);
  //   // TODO: Lógica para leer y procesar el archivo de respuesta del banco
  //   const isOk = true; // Simulación
  //   console.log('Processing bank response...');

  //   if (isOk) {
  //     return this.execute(id);
  //   }
  //   // else: manejar el error, cambiar estado a REJECTED, etc.
  // }

  async execute(
    id: number,
    userId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx || this.db;
    const payment = await this.findOne(id, tx);

    if (payment.status !== 'PENDING' && payment.status !== 'SENT_TO_BANK') {
      throw new BadRequestException('Only PENDING payments can be executed.');
    }

    return db.transaction(async (tx) => {
      // 1. Crear movimiento bancario (placeholder)

      const movementBank = await this.bankMovementsService.create(
        {
          bankAccountId: Number(payment.bankAccountId),
          transactionDate:
            payment.bankTransactionDate || new Date().toISOString(),
          description: payment.observations ?? 'null',
          debitAmount: Number(payment.totalAmount),
          bankReference: payment.bankReference ?? 'null',
          transactionType: payment.paymentMethod as paymentMethodEnum,
          category: 'INTERNAL_TRANSFER',
          createdById: userId,
        },
        userId,
        tx,
      );

      // 2. Crear supplierTransactions (una por línea)
      const transactions = await Promise.all(
        payment.lines?.map(async (line) => {
          const accountsPayable = await db.query.accountsPayable.findFirst({
            where: eq(
              schema.accountsPayable.id,
              line.accountsPayableId as number,
            ),
          });

          const transactionType =
            accountsPayable?.status === 'ADVANCE' ? 'ADVANCE' : 'PAYMENT';

          return {
            accountsPayableId: line.accountsPayableId,
            transactionNumber:
              await this.generateCodeService.generateNextReference('TRS-P', tx),
            transactionType: transactionType as supplierTransactionsTypeEnum,
            transactionDate: new Date().toISOString(),
            amount: line.amount,
            direction: 'CR' as 'CR' | 'DR', // CR = pago/abono
            currencyCode: 'VES' as CurrencyCodeEnum,
            paymentMethod: payment.paymentMethod,
            paymentId: payment.id,
            bankMovementId: movementBank.id,
            reference: payment.bankReference,
            createdById: userId,
            ///por definir la referencia
          };
        }),
      );

      await tx.insert(schema.supplierTransactions).values(transactions);

      const dataPayment = payment.lines.map((line) => {
        return {
          accountsPayableId: line.accountsPayableId,
          amount: line.amount,
        };
      });

      // 3. Actualizar saldos de CxP (placeholder)
      const updateAccountPayable =
        await this.accountsPayableService.updateBalances(
          dataPayment,
          userId,
          tx,
        );

      // Verifica si updateAccountPayable existe y no es 'undefined' antes de usarlo.
      if (updateAccountPayable) {
        const invoiceLines = payment.lines.filter(
          (line) => !updateAccountPayable.get(line.accountsPayableId as number),
        );
        const advanceLines = payment.lines.filter((line) =>
          updateAccountPayable.get(line.accountsPayableId as number),
        );

        let invoicePayableNumber = 'N/A';
        if (invoiceLines.length > 0) {
          const [invoicePayable] = await tx
            .select()
            .from(schema.accountsPayable)
            .where(
              eq(
                schema.accountsPayable.id,
                invoiceLines[0].accountsPayableId as number,
              ),
            );
          invoicePayableNumber = invoicePayable?.accountsPayableNumber ?? 'N/A';
        }

        for (const [id, newValues] of updateAccountPayable) {
          if (newValues.status === 'ADVANCE') {
            const newRemainingAmount = newValues.newRemainingAmount;
            const newStatus =
              newRemainingAmount === 0 ? 'ADVANCE_APPLIED' : 'ADVANCE';

            const [currentAdvance] = await tx
              .select()
              .from(schema.accountsPayable)
              .where(eq(schema.accountsPayable.id, id));

            await tx
              .update(schema.accountsPayable)
              .set({
                paidAmount: '0.00',
                remainingAmount: newRemainingAmount.toString(),
                status: newStatus,
                observations: `${currentAdvance.observations} | ANTICIPO APLICADO A ${invoicePayableNumber}`,
              })
              .where(eq(schema.accountsPayable.id, id));
          } else {
            // Llama al servicio SOLO cuando el saldo restante es 0
            if (newValues.newRemainingAmount === 0) {
              this.supplierInvoicesService.updateStatusToPaid(
                newValues.invoiceId,
                tx,
              );
            }
          }
        }
      }

      // 4. Pasa orden a PROCESSED
      const [processedPayment] = await tx
        .update(schema.supplierPayments)
        .set({ status: 'PROCESSED', processedAt: new Date().toISOString() })
        .where(eq(schema.supplierPayments.id, id))
        .returning({
          id: schema.supplierPayments.id,
          paymentNumber: schema.supplierPayments.paymentNumber,
          supplierId: schema.supplierPayments.supplierId,
          totalAmount: schema.supplierPayments.totalAmount,
          currencyCode: schema.supplierPayments.currencyCode,
          paymentMethod: schema.supplierPayments.paymentMethod,
          bankAccountId: schema.supplierPayments.bankAccountId,
          status: schema.supplierPayments.status,
          requestedAt: schema.supplierPayments.requestedAt, // date as string
          processedAt: schema.supplierPayments.processedAt,
          reversedAt: schema.supplierPayments.requestedAt,
          observations: schema.supplierPayments.observations,
        });

      return processedPayment;
    });
  }

  async createAndExecutePayment(dto: CreateSupplierPaymentDto, userId: number) {
    return this.db.transaction(async (tx) => {
      // 1. Crear el pago en estado DRAFT
      const newPayment = await this.createDraft(dto, userId, tx);

      // 2. Validar el pago
      const validatedPayment = await this.validate(newPayment.id, userId, tx);

      // 3. Ejecutar el pago
      const executedPayment = await this.execute(
        Number(validatedPayment[0].id),
        userId,
        tx,
      );

      return executedPayment;
    });
  }

  async createAndExecuteBulkPayments(
    dtos: CreateSupplierPaymentDto[],
    userId: number,
  ) {
    if (!dtos || dtos.length === 0) {
      throw new BadRequestException('No payment data provided.');
    }

    const payload = dtos.map((dto) => ({
      ...dto,
      bankTransactionDate: new Date(dto.bankTransactionDate),
    }));

    // Usar una transacción maestra para asegurar que todo el proceso sea atómico
    // Si una parte falla, todo se revierte.
    return this.db.transaction(async (tx) => {
      const results: any[] = [];
      for (const dto of payload) {
        // Lógica para procesar un solo pago dentro del bucle

        const newPayment = await this.createDraft(dto, userId, tx);
        const validatedPayment = await this.validate(newPayment.id, userId, tx);
        const executedPayment = await this.execute(
          Number(validatedPayment[0].id),
          userId,
          tx,
        );
        results.push(executedPayment);
      }
      return {
        message: 'Payments processed successfully',
      };
    });
  }

  async createAdvancePayment(dto: CreateAdvancePaymentDto, userId: number) {
    return this.db.transaction(async (tx) => {
      // 1. Crear la cuenta por pagar con saldo negativo y estado ADVANCE
      const accountsPayableNumber =
        await this.generateCodeService.generateNextReference('ADV-P', tx);
      const [newAccountPayable] = await tx
        .insert(schema.accountsPayable)
        .values({
          supplierId: dto.supplierId,
          accountsPayableNumber: accountsPayableNumber,
          originalAmount: (dto.amount * -1).toString(), // Saldo negativo
          paidAmount: '0.00',
          remainingAmount: (dto.amount * -1).toString(), // Saldo negativo
          currencyCode: 'VES',
          status: paymentAccountsPayableEnum.ADVANCE,
          observations:
            dto.observations ?? `ANTICIPO A PROVEEDOR ${accountsPayableNumber}`,
          createdById: userId,
          dueDate: null, // Fecha actual para anticipos
        })
        .returning();

      // 2. Crear el pago asociado a este anticipo
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
          status: 'DRAFT',
          requestedAt: new Date().toISOString(),
          createdById: userId,
          bankDescription: dto.bankDescription,
          bankReference: dto.bankReference,
          bankTransactionDate: dto.bankTransactionDate.toISOString(),
          observations:
            dto.observations ?? `ANTICIPO A PROVEEDOR ${paymentNumber}`,
        })
        .returning();

      // 3. Crear la línea de pago vinculada a la cuenta por pagar de anticipo
      await tx.insert(schema.supplierPaymentLines).values({
        supplierPaymentId: newPayment.id,
        accountsPayableId: newAccountPayable.id,
        amount: dto.amount.toString(),
        description: `ANTICIPO A PROVEEDOR ${newAccountPayable.accountsPayableNumber}`,
        createdById: userId,
      });

      // 4. Validar y ejecutar el pago del anticipo
      const validatedPayment = await this.validate(newPayment.id, userId, tx);
      const executedPayment = await this.execute(
        Number(validatedPayment[0].id),
        userId,
        tx,
      );

      return executedPayment;
    });
  }

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
            ...payment[0].supplier_payments,
            paymentNumber: reversedPaymentNumber,
            totalAmount: (-parseFloat(
              payment[0].supplier_payments.totalAmount,
            )).toString(),
            status: 'REVERSED',
            observations: `REVERSA DE PAGO ${payment[0].supplier_payments.paymentNumber}`,
            reversedAt: new Date().toISOString(),
            createdById: userId,
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
          await tx.insert(schema.supplierTransactions).values({
            accountsPayableId: line.accountsPayableId,
            transactionNumber: `REV-TR-${payment[0].supplier_payments.paymentNumber}-${line.id}`,
            transactionType: 'REVERSED',
            transactionDate: new Date().toISOString(),
            amount: line.amount,
            direction: 'DR', // Debit to reverse the original credit
            currencyCode: 'VES',
            status: 'REVERSED',
            paymentId: reversedPayment.id, // Link to the new reversed payment
            createdById: userId,
          });

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
                or(
                  ne(schema.accountsPayable.status, 'ADVANCE'),
                  ne(schema.accountsPayable.status, 'ADVANCE_APPLIED'),
                ),
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
