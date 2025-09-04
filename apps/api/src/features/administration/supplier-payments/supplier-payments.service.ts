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
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { AccountsPayableService } from '../accounts-payable/accounts-payable.service';
import { SupplierInvoicesService } from '../supplier-invoices/supplier-invoices.service';
import { CreateAdvancePaymentDto } from './dto/create-advance-payment.dto';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
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

  async findAll(query: any) {
    // TODO: Implementar filtros por proveedor, estado, fecha
    return this.db.query.supplierPayments.findMany({
      with: {
        supplier: true,
        lines: true,
      },
    });
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

  // async approve(id: number) {
  //   const payment = await this.findOne(id);
  //   if (payment.status !== 'PENDING') {
  //     throw new BadRequestException('Only PENDING payments can be approved.');
  //   }

  //   // TODO: Lógica de segundo nivel de autorización si aplica
  //   console.log('Approving payment...');

  //   // El estado podría cambiar a PEN_APR si requiere más aprobaciones
  //   return this.db
  //     .update(schema.supplierPayments)
  //     .set({ status: 'PENDING' }) // o 'PEN_APR'
  //     .where(eq(schema.supplierPayments.id, id))
  //     .returning();
  // }

  async generateBatch(id: number) {
    const payment = await this.findOne(id);
    // TODO: Lógica para generar el archivo TXT del lote bancario
    console.log('Generating batch file...');

    return this.db
      .update(schema.supplierPayments)
      .set({ status: 'SENT_TO_BANK' })
      .where(eq(schema.supplierPayments.id, id))
      .returning();
  }

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
            transactionNumber: payment.paymentNumber,
            transactionType: transactionType as supplierTransactionsTypeEnum,
            transactionDate: new Date().toISOString(),
            amount: line.amount,
            direction: 'CR' as 'CR' | 'DR', // CR = pago/abono
            currencyCode: 'VES' as CurrencyCodeEnum,
            paymentMethod: payment.paymentMethod,
            bankMovementId: movementBank.id,
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
        for (const [id, newValues] of updateAccountPayable) {
          // Llama al servicio SOLO cuando el saldo restante es 0
          if (newValues.status !== 'ADVANCE') {
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

  // async reverse(id: number) {
  //   const payment = await this.findOne(id);
  //   if (payment.status !== 'PROCESSED') {
  //     throw new BadRequestException('Only PROCESSED payments can be reversed.');
  //   }

  //   return this.db.transaction(async (tx) => {
  //     console.log('Reversing payment...');
  //     // 1. Crear supplierTransactions reverso
  //     const reverseTransactions = payment.lines.map((line) => ({
  //       accountsPayableId: line.accountsPayableId,
  //       transactionNumber: `REV-TR-PAY-${payment.paymentNumber}-${line.id}`,
  //       transactionType: 'PAYMENT', // O un tipo específico 'PAYMENT_REVERSAL'
  //       transactionDate: new Date(),
  //       amount: line.amount,
  //       direction: 'DR', // DR = se revierte el crédito
  //       currencyCode: payment.currencyCode,
  //       status: 'REVERSED',
  //     }));
  //     await tx.insert(schema.supplierTransactions).values(reverseTransactions);

  //     // 2. Devolver dinero al banco (placeholder)
  //     console.log('Creating reverse bank transaction...');

  //     // 3. Actualizar estado a ANULADO
  //     const [reversedPayment] = await tx
  //       .update(schema.supplierPayments)
  //       .set({ status: 'ANULADO', reversedAt: new Date() })
  //       .where(eq(schema.supplierPayments.id, id))
  //       .returning();

  //     return reversedPayment;
  //   });
  // }

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

  async createAdvancePayment(dto: CreateAdvancePaymentDto, userId: number) {
    return this.db.transaction(async (tx) => {
      // 1. Crear la cuenta por pagar con saldo negativo y estado ADVANCE
      const accountsPayableNumber =
        await this.generateCodeService.generateNextReference('ADV', tx);
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
}
