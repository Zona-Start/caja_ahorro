import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
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
import { and, eq, ilike, inArray, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { AccountsPayableService } from '../accounts-payable/accounts-payable.service';
import { SupplierInvoicesService } from '../supplier-invoices/supplier-invoices.service';
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

  async getSupplierAvailableCredits(id: number) {
    // 1. Get available advances from accountsPayable
    const advances = await this.db
      .select({
        id: schema.accountsPayable.id,
        accountsPayableNumber: schema.accountsPayable.accountsPayableNumber,
        remainingAmount: schema.accountsPayable.remainingAmount,
        currencyCode: schema.accountsPayable.currencyCode,
      })
      .from(schema.accountsPayable)
      .where(
        and(
          eq(schema.accountsPayable.supplierId, id),
          eq(schema.accountsPayable.isAuthorizePayment, true),
          ilike(schema.accountsPayable.accountsPayableNumber, 'ADV-P%'),
          or(eq(schema.accountsPayable.status, 'PAID')),
        ),
      );

    const advanceCredits = advances
      .filter((a) => Number(a.remainingAmount) > 0)
      .map((item) => ({
        amount: Number(item.remainingAmount),
        cxpId: item.id,
        cxpNumber: item.accountsPayableNumber,
        origin: 'ADVANCE' as const,
        currencyCode: item.currencyCode,
      }));

    // 2. Get available Credit Notes from supplierTransactions
    const creditNotesQuery = sql`
        SELECT 
            st.id, 
            st.transaction_number, 
            st.amount, 
            ap.supplier_id,
            st.currency_code,
            (SELECT SUM(sta.amount) 
             FROM administration.supplier_transactions sta 
             WHERE sta.transaction_type = 'CREDIT_NOTE_APPLIED' 
             AND sta.reference = st.transaction_number) as applied_amount
        FROM administration.supplier_transactions st
        JOIN administration.accounts_payable ap ON st.accounts_payable_id = ap.id
        WHERE ap.supplier_id = ${id} AND st.transaction_type = 'CREDIT_NOTE' AND st.status = 'ACTIVE';
    `;
    const creditNotesQueryResult = await this.db.execute(creditNotesQuery);
    const creditNotesResult: any[] = creditNotesQueryResult.rows;

    const creditNoteCredits = creditNotesResult
      .map((cn) => ({
        originalAmount: Number(cn.amount),
        appliedAmount: Number(cn.applied_amount || 0),
        cxpId: cn.id, // Note: This is the transaction ID
        cxpNumber: cn.transaction_number,
        origin: 'CREDIT_NOTE' as const,
        currencyCode: cn.currency_code,
      }))
      .filter((cn) => cn.originalAmount > cn.appliedAmount)
      .map((cn) => ({
        ...cn,
        amount: cn.originalAmount - cn.appliedAmount,
      }));

    const allCredits = [...advanceCredits, ...creditNoteCredits];

    if (allCredits.length === 0) {
      return null;
    }

    const totalAvailableCredit = allCredits.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    // Assuming all credits for a supplier are in the same currency for simplicity
    const [supplierInfo] = await this.db
      .select()
      .from(schema.suppliers)
      .where(eq(schema.suppliers.id, id));

    const response = [
      {
        availableCredit: totalAvailableCredit.toString(),
        credits: allCredits,
        currencyCode: allCredits[0]?.currencyCode ?? '',
        supplierId: id,
        supplierName: supplierInfo?.name ?? '',
        taxId: supplierInfo?.taxId ?? '',
      },
    ];

    return response;
  }

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
          observations: dto.observations ?? `PAGO DE CTA. POR PAGAR`,
        })
        .returning();

      const accountPayableFilter = dto.lines.map((l) => {
        if (l.relatedAdvanceId === null || l.relatedAdvanceId === undefined)
          return {
            accountsPayableId: l.accountsPayableId,
          };
      });

      const paymentLines = dto.lines.map((line) => ({
        ...line,
        accountsPayableId: accountPayableFilter[0]?.accountsPayableId,
        amount: line.amount.toString(),
        createdById: userId,
        supplierPaymentId: newPayment.id,
        description:
          line.description ?? `PAGO DE FACTURA N° ${line.accountsPayableId}`,
        relatedAdvanceId: line.relatedAdvanceId ?? null,
      }));

      await tx.insert(schema.supplierPaymentLines).values(paymentLines);

      return newPayment;
    });
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

  async execute(
    id: number,
    userId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx || this.db;
    const payment = await this.findOne(id, tx);

    const accountPayableFilter = payment.lines.map((l) => {
      if (l.relatedAdvanceId === null)
        return {
          accountsPayableId: l.accountsPayableId,
        };
    });

    if (payment.status !== 'PENDING' && payment.status !== 'SENT_TO_BANK') {
      throw new BadRequestException(
        'Only PENDING or SENT_TO_BANK payments can be executed.',
      );
    }

    // Validaciones del payload
    const lines = payment.lines ?? [];
    if (!lines.length) {
      throw new BadRequestException('Payment has no lines.');
    }

    // Todos los montos deben ser positivos
    for (const l of lines) {
      if (Number(l.amount) <= 0) {
        throw new BadRequestException(
          'All payment line amounts must be positive.',
        );
      }
    }

    // Validar suma de líneas == totalAmount
    const sumLines = lines.reduce((s, l) => s + Number(l.amount), 0);
    if (Number(payment.totalAmount) !== sumLines) {
      throw new BadRequestException(
        'Sum of payment lines must equal totalAmount.',
      );
    }

    // Obtener todas las cuentas por pagar a tocar (con lock idealmente)
    const accountsPayableIds = lines
      .map((line) => line.accountsPayableId)
      .filter(Boolean) as number[];
    let accountsPayableMap = new Map<
      number,
      typeof schema.accountsPayable.$inferSelect
    >();
    if (accountsPayableIds.length > 0) {
      // Nota: si tu driver soporta FOR UPDATE, úsalo aquí para evitar race conditions.
      const accountsPayableRecords = await db
        .select()
        .from(schema.accountsPayable)
        .where(inArray(schema.accountsPayable.id, accountsPayableIds));
      accountsPayableMap = new Map(
        accountsPayableRecords.map((ap) => [ap.id, ap]),
      );
    }

    return db.transaction(async (tx) => {
      // 1) Crear movimiento bancario (tu servicio)
      // --- calcular efectivo que sale por banco: total menos los montos que son "aplicación de anticipo"
      const totalAppliedFromAdvances = lines
        .filter((l: any) => !!l.relatedAdvanceId) // líneas que son aplicaciones de anticipos
        .reduce((s, l) => s + Number(l.amount), 0);

      const cashOutAmount =
        Number(payment.totalAmount) - totalAppliedFromAdvances;

      // 1) Crear movimiento bancario (solo si hay efectivo saliente)

      const movementBank = await this.bankMovementsService.create(
        {
          bankAccountId: Number(payment.bankAccountId),
          transactionDate:
            payment.bankTransactionDate || new Date().toISOString(),
          description: payment.observations ?? 'Pago proveedor',
          debitAmount: cashOutAmount, // <--- usar solo efectivo saliente
          creditAmount: 0,
          bankReference: payment?.bankReference ?? undefined,
          transactionType: payment.paymentMethod as paymentMethodEnum,
          category: 'INTERNAL_TRANSFER',
          createdById: userId,
        },
        userId,
        tx,
      );

      const existingLines = await tx
        .select({
          accountsPayableId: schema.supplierPaymentLines.accountsPayableId,
        })
        .from(schema.supplierPaymentLines)
        .where(eq(schema.supplierPaymentLines.supplierPaymentId, payment.id));

      const existingIds = new Set(
        existingLines.map((l) => l.accountsPayableId),
      );

      // 2) Insertar supplier_payment_lines (todas positivas)
      // Insertar solo las líneas que aún no existen
      const paymentLinesToInsert = lines
        .filter((line) => !existingIds.has(line.accountsPayableId))
        .map((line: any) => ({
          supplierPaymentId: payment.id,
          accountsPayableId: line.accountsPayableId,
          amount: String(line.amount),
          description: line.description ?? null,
          createdById: userId,
          updatedById: userId,
        }));

      if (paymentLinesToInsert.length) {
        await tx
          .insert(schema.supplierPaymentLines)
          .values(paymentLinesToInsert);
      }

      // 3) Crear supplier_transactions (1 por payment line)
      const transactions = await Promise.all(
        lines.map(async (line: any) => {
          const ap = accountsPayableMap.get(line.accountsPayableId as number);
          const transactionNumber =
            await this.generateCodeService.generateNextReference('TRS-P');
          const isAdvance =
            ap?.accountsPayableNumber?.startsWith?.('ADV-P') ?? false;

          // Si la línea viene con relatedAdvanceId (aplicación de anticipo), usarla.
          const relatedAdvanceId = line.relatedAdvanceId ?? null;

          // Determinar tipo:
          // - Si la CxP apuntada es un anticipo y el payment line corresponde a pagarlo -> ADVANCE
          // - Si la línea es una aplicación (tiene relatedAdvanceId) -> ADVANCE (aplicación)
          // - En otro caso -> PAYMENT
          const transactionType: supplierTransactionsTypeEnum = relatedAdvanceId
            ? supplierTransactionsTypeEnum.ADVANCE_APPLIED // si es aplicacion -> ADVANCE_APPLIED
            : isAdvance
              ? supplierTransactionsTypeEnum.ADVANCE // si es solo pago de anticipo -> ADVANCE
              : supplierTransactionsTypeEnum.PAYMENT;

          return {
            accountsPayableId: accountPayableFilter[0]?.accountsPayableId,
            relatedAdvanceId: relatedAdvanceId,
            transactionNumber,
            transactionType,
            transactionDate: new Date().toISOString(),
            amount: String(line.amount),
            direction: 'CR' as const, // los pagos/anticipos aplicados reducen la deuda (CR)
            currencyCode: payment.currencyCode,
            paymentMethod: payment.paymentMethod,
            paymentId: payment.id,
            bankMovementId: movementBank.id,
            reference: payment.bankReference ?? null,
            createdById: userId,
            updatedById: userId,
          };
        }),
      );

      if (transactions.length) {
        //await tx.insert(schema.supplierTransactions).values(transactions);
      }

      // 4) Calcular y devolver updates llamando a updateBalances (no aplica estados complejos aquí)
      // updateBalances devolverá un Map con id -> { newPaidAmount, newRemainingAmount, invoiceId, status, isAdvance }
      const dataPayment = lines.map((l: any) => ({
        accountsPayableId: l.accountsPayableId,
        amount: Number(l.amount),
        relatedAdvanceId: l.relatedAdvanceId ?? null,
        description: l.description ?? null,
      }));

      const updates = await this.accountsPayableService.updateBalances(
        dataPayment,
        userId,
        tx,
      );
      // updates is a Map<number, { newPaidAmount, newRemainingAmount, invoiceId, status, isAdvance }>

      // 5) Aplicar estados y observaciones finales basados en contexto del payment lines
      //    - Si la línea fue pago directo de un anticipo (la CxP apuntada es ADVANCE y la línea apunta a ella),
      //      marcamos el anticipo como PAID (sin tocar montos si así se definió).
      //    - Si la línea fue la aplicación de un anticipo contra una factura, ajustamos ambos estados.
      //    - Si fue pago de factura, marcamos PAID o IN_PROGRESS según remaining.

      // Para poder mapear las cuentas afectadas, leer las CxP actuales (otra vez) o usar accountsPayableMap

      //  newPaidAmount,
      //     newRemainingAmount,
      //     invoiceId: (account.supplierInvoiceId as number) ?? null,
      //     status: newStatus,
      //     isAdvance: true,

      for (const [apId, calc] of updates) {
        const apRecord = accountsPayableMap.get(apId);
        const isAdvance = calc.isAdvance;

        if (isAdvance) {
          // Si la CxP es un anticipo y la operación fue "pago directo" (es decir, la payment line
          // tenía accountsPayableId = anticipo.id) -> marcar PAID (sin tocar montos si tu política lo requiere).
          // Sin embargo, si la updateBalances devolvió newRemainingAmount (por aplicación), aplicarlo.
          if (calc.status === 'PAID') {
            await tx
              .update(schema.accountsPayable)
              .set({
                status: calc.status,
                updatedById: userId,
              })
              .where(eq(schema.accountsPayable.id, apId));
          } else {
            // Si queda saldo (parcial)
            await tx
              .update(schema.accountsPayable)
              .set({
                remainingAmount: String(calc.newRemainingAmount),
                paidAmount: String(calc.newPaidAmount),
                status: calc.status,
                updatedById: userId,
              })
              .where(eq(schema.accountsPayable.id, apId));
          }
        } else {
          // Caso factura normal:

          await tx
            .update(schema.accountsPayable)
            .set({
              remainingAmount: String(calc.newRemainingAmount),
              paidAmount: String(calc.newPaidAmount),
              status: calc.newRemainingAmount === 0 ? 'PAID' : 'IN_PROGRESS',
              updatedById: userId,
            })
            .where(eq(schema.accountsPayable.id, apId));

          // Si la factura se quedó en 0 y está relacionada a un supplierInvoice, actualizar su estatus
          if (calc.newRemainingAmount === 0 && calc.invoiceId) {
            await this.supplierInvoicesService.updateStatusToPaid(
              calc.invoiceId,
              tx,
            );
          }
        }
      }

      // 6) Finalmente actualizar supplierPayments.status a PROCESSED y devolver info
      const [processedPayment] = await tx
        .update(schema.supplierPayments)
        .set({
          status: 'PROCESSED',
          processedAt: new Date().toISOString(),
          updatedById: userId,
        })
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
          requestedAt: schema.supplierPayments.requestedAt,
          processedAt: schema.supplierPayments.processedAt,
          observations: schema.supplierPayments.observations,
        });

      return processedPayment;
    });
  }

  //metodo para ejecutar un pago
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
