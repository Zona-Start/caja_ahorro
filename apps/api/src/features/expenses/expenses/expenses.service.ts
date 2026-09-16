import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import { ExchangeRateService } from '@/features/core/exchange-rate/exchange-rate.service';
import { CurrencyCodeEnum } from '@/types/enum';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, asc, eq, sql } from 'drizzle-orm';
import { CreateExpenseDto, FilterExpenseDto } from './dto/expenses.schema';

type Transaction = Parameters<Parameters<DrizzleDatabase['transaction']>[0]>[0];
type ExpenseRow = typeof schema.expenses.$inferSelect;

const round = (value: number, decimals: number) =>
  Number(value.toFixed(decimals));

// Calcula la próxima fecha de pago según la frecuencia
function computeNextDueDate(base: Date, frequency: string | null): Date | null {
  if (!frequency) return null;
  const DAY = 24 * 60 * 60 * 1000;
  if (frequency === 'BIWEEKLY') {
    return new Date(base.getTime() + 14 * DAY);
  }
  const months =
    frequency === 'QUARTERLY' ? 3 : frequency === 'ANNUAL' ? 12 : 1;
  return new Date(
    Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth() + months,
      base.getUTCDate(),
    ),
  );
}

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
    private readonly accountingEntriesService: AccountingEntriesService,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly bankMovementsService: BankMovementsService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  //  CONFIG (IVA / ISLR / Tasa BCV del día)
  // ──────────────────────────────────────────────────────────────

  async getExpenseConfig(tenantId: string) {
    const [vatSetting, islrSetting] = await Promise.all([
      this.getSetting(undefined, tenantId, 'VAT_RATE'),
      this.getSetting(undefined, tenantId, 'ISLR_RATE'),
    ]);

    const vatValue =
      vatSetting ??
      (await this.getSetting(undefined, tenantId, 'TAX_PURCHASES'));

    const today = new Date();
    const exchangeRates: Record<string, number | null> = {};
    for (const code of [CurrencyCodeEnum.USD, CurrencyCodeEnum.EUR]) {
      try {
        exchangeRates[code] = await this.exchangeRateService.getRate(
          tenantId,
          today,
          code,
        );
      } catch {
        exchangeRates[code] = null;
      }
    }

    return {
      vatRate: vatValue != null ? Number(vatValue) : null,
      islrRate: islrSetting != null ? Number(islrSetting) : null,
      exchangeRates,
      exchangeRateDate: today.toISOString(),
    };
  }

  async getMode(tenantId: string) {
    const tenant = await this.getTenantBusinessType(tenantId);
    const activeModules = await this.getActiveModules(tenantId);
    const isCorporate =
      tenant === 'CAJA_AHORRO' || activeModules.has('ACCOUNTING');

    return {
      mode: isCorporate ? 'CORPORATE' : 'AGILE',
      businessType: tenant,
      hasAccounting: activeModules.has('ACCOUNTING'),
      activeModules: Array.from(activeModules),
    };
  }

  async findAllByPagination(tenantId: string, dto?: FilterExpenseDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      categoryId,
      costCenterId,
      paymentSource,
      type,
      nature,
      status,
      startDate,
      endDate,
    } = dto || {};
    const offset = (page - 1) * limit;

    const conditions = [
      eq(schema.expenses.tenantId, tenantId),
      sql`${schema.expenses.deletedAt} IS NULL`,
      ...(categoryId ? [eq(schema.expenses.categoryId, categoryId)] : []),
      ...(costCenterId ? [eq(schema.expenses.costCenterId, costCenterId)] : []),
      ...(paymentSource
        ? [eq(schema.expenses.paymentSource, paymentSource)]
        : []),
      ...(type ? [eq(schema.expenses.type, type)] : []),
      ...(nature ? [eq(schema.expenses.nature, nature)] : []),
      ...(status ? [eq(schema.expenses.status, status)] : []),
      ...(startDate
        ? [sql`${schema.expenses.createdAt} >= ${new Date(startDate)}`]
        : []),
      ...(endDate
        ? [sql`${schema.expenses.createdAt} <= ${new Date(endDate)}`]
        : []),
      ...(search
        ? [
            sql`(${schema.expenses.description} ILIKE ${'%' + search + '%'} OR ${schema.expenses.receiptNumber} ILIKE ${'%' + search + '%'})`,
          ]
        : []),
    ];

    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.expenses)
      .where(whereClause);

    const totalCount = Number(totalResult.count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select({
        id: schema.expenses.id,
        tenantId: schema.expenses.tenantId,
        supplierId: schema.expenses.supplierId,
        costCenterId: schema.expenses.costCenterId,
        categoryId: schema.expenses.categoryId,
        categoryName: schema.expenseCategories.name,
        paymentSource: schema.expenses.paymentSource,
        type: schema.expenses.type,
        nature: schema.expenses.nature,
        status: schema.expenses.status,
        paymentStatus: schema.expenses.paymentStatus,
        dueDate: schema.expenses.dueDate,
        frequency: schema.expenses.frequency,
        nextDueDate: schema.expenses.nextDueDate,
        amountBase: schema.expenses.amountBase,
        taxAmountBase: schema.expenses.taxAmountBase,
        currencyCode: schema.expenses.currencyCode,
        exchangeRate: schema.expenses.exchangeRate,
        islrWithholdingAmount: schema.expenses.islrWithholdingAmount,
        vatWithholdingAmount: schema.expenses.vatWithholdingAmount,
        receiptNumber: schema.expenses.receiptNumber,
        receiptImageUrl: schema.expenses.receiptImageUrl,
        description: schema.expenses.description,
        approvedByUserId: schema.expenses.approvedByUserId,
        approvedAt: schema.expenses.approvedAt,
        rejectedByUserId: schema.expenses.rejectedByUserId,
        rejectedAt: schema.expenses.rejectedAt,
        rejectionReason: schema.expenses.rejectionReason,
        paidByUserId: schema.expenses.paidByUserId,
        paidAt: schema.expenses.paidAt,
        createdAt: schema.expenses.createdAt,
      })
      .from(schema.expenses)
      .leftJoin(
        schema.expenseCategories,
        eq(schema.expenseCategories.id, schema.expenses.categoryId),
      )
      .where(whereClause)
      .orderBy(sql`${schema.expenses.createdAt} desc`)
      .limit(limit)
      .offset(offset);

    return {
      data: data.map((d) => ({ ...d, amountBase: Number(d.amountBase) })),
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    return this.findOneWithDetails(id, tenantId);
  }

  async findOneWithDetails(id: string, tenantId: string) {
    const expense = await this.getRawExpense(id, tenantId);
    const details = await this.db
      .select({
        id: schema.expenseDetails.id,
        categoryId: schema.expenseDetails.categoryId,
        categoryName: schema.expenseCategories.name,
        description: schema.expenseDetails.description,
        amount: schema.expenseDetails.amount,
        taxRate: schema.expenseDetails.taxRate,
        taxAmount: schema.expenseDetails.taxAmount,
        isExempt: schema.expenseDetails.isExempt,
      })
      .from(schema.expenseDetails)
      .leftJoin(
        schema.expenseCategories,
        eq(schema.expenseCategories.id, schema.expenseDetails.categoryId),
      )
      .where(eq(schema.expenseDetails.expenseId, id))
      .orderBy(asc(schema.expenseDetails.createdAt));

    let supplierName: string | null = null;
    if (expense.supplierId) {
      const [supplier] = await this.db
        .select({ name: schema.suppliers.name })
        .from(schema.suppliers)
        .where(eq(schema.suppliers.id, expense.supplierId));
      supplierName = supplier?.name ?? null;
    }

    return {
      ...expense,
      amountBase: Number(expense.amountBase),
      supplierName,
      details,
    };
  }

  async findDetails(id: string, tenantId: string) {
    const expense = await this.getRawExpense(id, tenantId);
    return await this.db
      .select()
      .from(schema.expenseDetails)
      .where(eq(schema.expenseDetails.expenseId, expense.id))
      .orderBy(asc(schema.expenseDetails.createdAt));
  }

  // ──────────────────────────────────────────────────────────────
  //  CREATE: todo gasto nace PENDING_APPROVAL (no deduce nada)
  // ──────────────────────────────────────────────────────────────

  async create(
    userId: string,
    tenantId: string,
    userPermissions: string[],
    dto: CreateExpenseDto,
  ) {
    const result = await this.db.transaction(async (tx) => {
      const businessType = await this.getTenantBusinessType(tenantId, tx);
      const activeModules = await this.getActiveModules(tenantId, tx);
      const isCorporate =
        businessType === 'CAJA_AHORRO' || activeModules.has('ACCOUNTING');

      // 1. Validar categoría principal y las categorías de cada línea
      const categoryIds = [
        dto.categoryId,
        ...(dto.details ?? []).map((d) => d.categoryId),
      ];
      for (const categoryId of [...new Set(categoryIds)]) {
        await this.validateCategory(tx, tenantId, categoryId);
      }

      // 2. Validar disponible en la fuente de financiamiento (sin deducir)
      if (dto.paymentSource === 'CASH_REGISTER') {
        await this.validateCashSession(
          tx,
          tenantId,
          dto.cashRegisterSessionId!,
          dto.amount,
        );
      } else if (dto.paymentSource === 'BANK_ACCOUNT') {
        await this.validateBankAccount(
          tx,
          tenantId,
          dto.bankAccountId!,
          dto.amount,
        );
      } else if (dto.paymentSource === 'PETTY_CASH') {
        await this.validatePettyCash(
          tx,
          tenantId,
          dto.pettyCashFundId!,
          dto.amount,
        );
      }

      // 3. Validaciones corporativas (centro de costo + presupuesto)
      if (isCorporate) {
        const costCenter = await this.validateCostCenterForCreate(tx, dto);
        await this.validateBudget(
          tx,
          tenantId,
          costCenter.id,
          dto.amount,
          costCenter.monthlyBudget,
          dto.overrideBudget,
          userPermissions,
        );
      }

      // 4. Insertar el gasto en estado PENDING_APPROVAL
      const [expense] = await tx
        .insert(schema.expenses)
        .values({
          tenantId,
          supplierId: dto.supplierId ?? null,
          costCenterId: isCorporate ? (dto.costCenterId ?? null) : null,
          categoryId: dto.categoryId,
          paymentSource: dto.paymentSource,
          cashRegisterSessionId:
            dto.paymentSource === 'CASH_REGISTER'
              ? dto.cashRegisterSessionId
              : null,
          bankAccountId:
            dto.paymentSource === 'BANK_ACCOUNT' ? dto.bankAccountId : null,
          pettyCashFundId:
            dto.paymentSource === 'PETTY_CASH' ? dto.pettyCashFundId : null,
          type: dto.type ?? 'EXPRESS',
          paymentStatus: 'PENDING',
          status: 'PENDING_APPROVAL',
          nature: dto.nature ?? 'VARIABLE',
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          frequency: dto.nature === 'FIXED' ? (dto.frequency ?? null) : null,
          nextDueDate:
            dto.nature === 'FIXED' && dto.dueDate
              ? computeNextDueDate(new Date(dto.dueDate), dto.frequency ?? null)
              : null,
          amountBase: String(dto.amount),
          taxAmountBase: String(dto.taxAmountBase ?? 0),
          currencyCode: dto.currencyCode,
          exchangeRate: String(dto.exchangeRate ?? 1),
          receiptNumber: dto.receiptNumber || null,
          receiptImageUrl: dto.receiptImageUrl || null,
          description: dto.description,
          createdById: userId,
        })
        .returning();

      // 5. Líneas de detalle (varios conceptos por gasto)
      if (dto.details && dto.details.length > 0) {
        await tx.insert(schema.expenseDetails).values(
          dto.details.map((line) => {
            const taxRate = line.isExempt ? 0 : (line.taxRate ?? 0);
            const taxAmount = round((line.amount * taxRate) / 100, 4);
            return {
              expenseId: expense.id,
              tenantId,
              categoryId: line.categoryId,
              description: line.description,
              amount: String(line.amount),
              taxRate: String(taxRate),
              taxAmount: String(taxAmount),
              isExempt: line.isExempt ?? false,
            };
          }),
        );
      }

      // 6. Si es un gasto FIJO, se programa en el automatizador (plantilla
      // recurrente) para autogenerar la próxima ocurrencia en su fecha.
      if (dto.nature === 'FIXED' && dto.dueDate && dto.frequency) {
        const runBase = new Date(dto.dueDate);
        const [template] = await tx
          .insert(schema.recurringExpenseTemplates)
          .values({
            tenantId,
            name: dto.description.slice(0, 255),
            description: `${dto.description} (plantilla de gasto fijo)`,
            categoryId: dto.categoryId,
            supplierId: dto.supplierId ?? null,
            costCenterId: dto.costCenterId ?? null,
            amount: String(dto.amount),
            currencyCode: dto.currencyCode,
            paymentSource: dto.paymentSource,
            bankAccountId:
              dto.paymentSource === 'BANK_ACCOUNT'
                ? (dto.bankAccountId ?? null)
                : null,
            pettyCashFundId:
              dto.paymentSource === 'PETTY_CASH'
                ? (dto.pettyCashFundId ?? null)
                : null,
            frequency: dto.frequency,
            dayOfMonth:
              dto.frequency === 'BIWEEKLY'
                ? null
                : Math.min(Math.max(runBase.getUTCDate(), 1), 28),
            nextRunDate: computeNextDueDate(runBase, dto.frequency),
            autoCreate: true,
            isActive: true,
            createdById: userId,
          })
          .returning({ id: schema.recurringExpenseTemplates.id });

        await tx
          .update(schema.expenses)
          .set({ recurringTemplateId: template.id, updatedById: userId })
          .where(eq(schema.expenses.id, expense.id));

        expense.recurringTemplateId = template.id;
      }

      return expense;
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'INSERT',
        tableName: 'expenses',
        recordId: result.id,
        description: `Gasto registrado (pendiente de aprobación): ${result.description}`,
        area: 'Expenses',
        newData: result,
        tenantId,
      }),
    );

    return result;
  }

  // ──────────────────────────────────────────────────────────────
  //  APPROVE: valida y deja el gasto "Por Pagar".
  //  Excepción: si la fuente es Caja POS o Fondo Fijo, el dinero ya
  //  salió físicamente, por lo que se liquida al instante (PAID).
  // ──────────────────────────────────────────────────────────────

  // ──────────────────────────────────────────────────────────────
  //  APPROVE: solo cambia el estado a "Aprobado / Por Pagar".
  //  NO mueve dinero. Habilita el botón Pagar. El descuento ocurre
  //  únicamente al registrar el pago.
  // ──────────────────────────────────────────────────────────────

  async approve(
    id: string,
    userId: string,
    tenantId: string,
    userPermissions: string[],
  ) {
    const approved = await this.db.transaction(async (tx) => {
      const businessType = await this.getTenantBusinessType(tenantId, tx);
      const activeModules = await this.getActiveModules(tenantId, tx);
      const isCorporate =
        businessType === 'CAJA_AHORRO' || activeModules.has('ACCOUNTING');

      const expense = await this.getRawExpenseInTx(tx, id, tenantId);
      this.assertPending(expense);

      const amount = Number(expense.amountBase);

      // Validaciones corporativas (presupuesto + retenciones). No descuenta.
      let islrWithholding = 0;
      let vatWithholding = 0;
      if (isCorporate) {
        if (!expense.costCenterId) {
          throw new BadRequestException(
            'El centro de costo es requerido en modo corporativo',
          );
        }
        const [costCenter] = await tx
          .select()
          .from(schema.costCenters)
          .where(
            and(
              eq(schema.costCenters.id, expense.costCenterId),
              eq(schema.costCenters.tenantId, tenantId),
              eq(schema.costCenters.isActive, true),
            ),
          );
        if (!costCenter) {
          throw new BadRequestException('El centro de costo no es válido');
        }
        await this.validateBudget(
          tx,
          tenantId,
          costCenter.id,
          amount,
          costCenter.monthlyBudget,
          false,
          userPermissions,
          id,
        );
        const rates = await this.getWithholdingRates(tx, tenantId);
        vatWithholding = round(amount * rates.vatRate, 4);
        islrWithholding = round(amount * rates.islrRate, 4);
      }

      const now = new Date();
      const [updated] = await tx
        .update(schema.expenses)
        .set({
          status: 'APPROVED',
          paymentStatus: 'PENDING',
          islrWithholdingAmount: String(islrWithholding),
          vatWithholdingAmount: String(vatWithholding),
          approvedByUserId: userId,
          approvedAt: now,
          updatedById: userId,
          updatedAt: now,
        })
        .where(eq(schema.expenses.id, id))
        .returning();

      return updated;
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'expenses',
        recordId: id,
        description: `Gasto aprobado (por pagar): ${approved.description}`,
        area: 'Expenses',
        newData: approved,
        tenantId,
      }),
    );

    return approved;
  }

  // ──────────────────────────────────────────────────────────────
  //  PAY: aquí SÍ se mueve el dinero.
  //  - Caja POS  → descuenta la sesión + movimiento de caja (OUTFLOW)
  //  - Fondo Fijo→ descuenta el saldo del fondo
  //  - Banco     → genera un movimiento bancario (débito) vinculado
  //  Luego dispara el asiento contable (el módulo contable decide).
  // ──────────────────────────────────────────────────────────────

  async pay(id: string, userId: string, tenantId: string) {
    const result = await this.db.transaction(async (tx) => {
      const expense = await this.getRawExpenseInTx(tx, id, tenantId);

      if (expense.status !== 'APPROVED') {
        throw new BadRequestException(
          `Solo los gastos aprobados y por pagar admiten esta operación (estado actual: ${expense.status})`,
        );
      }
      if (
        expense.nature === 'FIXED' &&
        expense.dueDate &&
        new Date(expense.dueDate).getTime() > Date.now()
      ) {
        throw new BadRequestException(
          'Aún no corresponde el pago de este gasto fijo (fecha programada no alcanzada)',
        );
      }

      const amount = Number(expense.amountBase);

      // Si el gasto proviene de un vale de caja ya liquidado, el dinero ya salió
      // del fondo al emitir el vale: no se vuelve a descontar ni a contabilizar.
      let linkedToVoucher = false;
      if (expense.paymentSource === 'PETTY_CASH') {
        const [voucher] = await tx
          .select({ id: schema.pettyCashVouchers.id })
          .from(schema.pettyCashVouchers)
          .where(
            and(
              eq(schema.pettyCashVouchers.expenseId, expense.id),
              eq(schema.pettyCashVouchers.status, 'LIQUIDATED'),
            ),
          )
          .limit(1);
        linkedToVoucher = !!voucher;
      }

      // 1. Procesar el descuento según la fuente del dinero
      if (linkedToVoucher) {
        // Sin descuento: el efectivo ya salió del fondo al emitir el vale
      } else if (expense.paymentSource === 'BANK_ACCOUNT') {
        // Valida saldo disponible y genera el movimiento bancario (débito)
        // vinculado al gasto. El servicio bancario actualiza el saldo.
        await this.validateBankAccount(
          tx,
          tenantId,
          expense.bankAccountId!,
          amount,
        );
        await this.bankMovementsService.createAndReconcile(
          {
            movement: {
              bankAccountId: expense.bankAccountId!,
              transactionDate: new Date(),
              paymentMethod: 'BANK_TRANSFER',
              description: `Pago de gasto: ${expense.description}`,
              category: 'OTHER_EXPENSE',
              creditAmount: 0,
              debitAmount: amount,
              note: `Gasto ${expense.id}`,
            },
            links: [
              {
                internalRecordType: 'GENERAL_EXPENSE',
                internalRecordId: expense.id,
              },
            ],
          },
          userId,
          tenantId,
          tx as unknown as DrizzleDatabase,
        );
      } else {
        // Caja POS / Fondo Fijo: descuento directo del saldo en efectivo
        const sourceBalance = await this.validateSource(
          tx,
          tenantId,
          expense,
          amount,
        );
        await this.applySourceFunding(tx, userId, expense, sourceBalance);
      }

      // 2. Marcar como pagado
      const now = new Date();
      const [updated] = await tx
        .update(schema.expenses)
        .set({
          status: 'PAID',
          paymentStatus: 'PAID',
          paidByUserId: userId,
          paidAt: now,
          updatedById: userId,
          updatedAt: now,
        })
        .where(eq(schema.expenses.id, id))
        .returning();

      return { paid: updated, skipAccounting: linkedToVoucher };
    });

    const paid = result.paid;

    // 3. Asiento contable (el módulo contable decide si aplica o no).
    //    Se omite si el gasto proviene de un vale (ya se contabilizó al rendir).
    if (!result.skipAccounting) {
      await this.generateAccountingEntry(paid, tenantId, userId);
    }

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'expenses',
        recordId: id,
        description: `Gasto pagado: ${paid.description}`,
        area: 'Expenses',
        newData: paid,
        tenantId,
      }),
    );

    return paid;
  }

  // ──────────────────────────────────────────────────────────────
  //  REJECT
  // ──────────────────────────────────────────────────────────────

  async reject(id: string, userId: string, tenantId: string, reason?: string) {
    const expense = await this.getRawExpense(id, tenantId);
    this.assertPending(expense);

    const [rejected] = await this.db
      .update(schema.expenses)
      .set({
        status: 'REJECTED',
        rejectedByUserId: userId,
        rejectedAt: new Date(),
        rejectionReason: reason ?? null,
        updatedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.expenses.id, id))
      .returning();

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'expenses',
        recordId: id,
        description: `Gasto rechazado: ${rejected.description}`,
        area: 'Expenses',
        previousData: expense,
        newData: rejected,
        tenantId,
      }),
    );

    return rejected;
  }

  async softDelete(id: string, userId: string, tenantId: string) {
    const existing = await this.getRawExpense(id, tenantId);

    if (existing.status === 'APPROVED' || existing.status === 'PAID') {
      throw new BadRequestException(
        'No se puede eliminar un gasto aprobado o pagado que ya afectó saldos contables',
      );
    }

    await this.db
      .update(schema.expenses)
      .set({ deletedAt: new Date(), deletedBy: userId })
      .where(
        and(eq(schema.expenses.id, id), eq(schema.expenses.tenantId, tenantId)),
      );

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'DELETE',
        tableName: 'expenses',
        recordId: id,
        description: 'Gasto eliminado (soft delete)',
        area: 'Expenses',
        tenantId,
      }),
    );

    return { message: 'Gasto eliminado correctamente' };
  }

  // ──────────────────────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────────────────────

  private assertPending(expense: ExpenseRow) {
    if (expense.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        `Solo los gastos pendientes de aprobación admiten esta operación (estado actual: ${expense.status})`,
      );
    }
  }

  private async getRawExpense(
    id: string,
    tenantId: string,
  ): Promise<ExpenseRow> {
    const [row] = await this.db
      .select()
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.id, id),
          eq(schema.expenses.tenantId, tenantId),
          sql`${schema.expenses.deletedAt} IS NULL`,
        ),
      );
    if (!row) {
      throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
    }
    return row;
  }

  private async getRawExpenseInTx(
    tx: Transaction,
    id: string,
    tenantId: string,
  ): Promise<ExpenseRow> {
    const [row] = await tx
      .select()
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.id, id),
          eq(schema.expenses.tenantId, tenantId),
          sql`${schema.expenses.deletedAt} IS NULL`,
        ),
      );
    if (!row) {
      throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
    }
    return row;
  }

  private async validateCategory(
    tx: Transaction,
    tenantId: string,
    categoryId: string,
  ) {
    const [category] = await tx
      .select()
      .from(schema.expenseCategories)
      .where(
        and(
          eq(schema.expenseCategories.id, categoryId),
          eq(schema.expenseCategories.tenantId, tenantId),
          eq(schema.expenseCategories.isActive, true),
        ),
      );

    if (!category) {
      throw new BadRequestException(
        'La categoría de gasto seleccionada no es válida',
      );
    }
    return category;
  }

  private async validateCostCenterForCreate(
    tx: Transaction,
    dto: CreateExpenseDto,
  ) {
    if (!dto.costCenterId) {
      throw new BadRequestException(
        'El centro de costo es requerido en modo corporativo',
      );
    }
    const [costCenter] = await tx
      .select()
      .from(schema.costCenters)
      .where(
        and(
          eq(schema.costCenters.id, dto.costCenterId),
          eq(schema.costCenters.isActive, true),
        ),
      );
    if (!costCenter) {
      throw new BadRequestException('El centro de costo no es válido');
    }
    return costCenter;
  }

  private async validateSource(
    tx: Transaction,
    tenantId: string,
    expense: ExpenseRow,
    amount: number,
  ): Promise<number> {
    if (expense.paymentSource === 'CASH_REGISTER') {
      return await this.validateCashSession(
        tx,
        tenantId,
        expense.cashRegisterSessionId!,
        amount,
      );
    }
    if (expense.paymentSource === 'BANK_ACCOUNT') {
      return await this.validateBankAccount(
        tx,
        tenantId,
        expense.bankAccountId!,
        amount,
      );
    }
    if (expense.paymentSource === 'PETTY_CASH') {
      return await this.validatePettyCash(
        tx,
        tenantId,
        expense.pettyCashFundId!,
        amount,
      );
    }
    throw new BadRequestException('Fuente de financiamiento no válida');
  }

  private async getTenantBusinessType(
    tenantId: string,
    tx?: Transaction,
  ): Promise<string> {
    const db = tx ?? this.db;
    const [tenant] = await db
      .select({ businessType: schema.tenants.businessType })
      .from(schema.tenants)
      .where(eq(schema.tenants.id, tenantId));

    return tenant?.businessType ?? 'CAJA_AHORRO';
  }

  private async getActiveModules(
    tenantId: string,
    tx?: Transaction,
  ): Promise<Set<string>> {
    const db = tx ?? this.db;
    const rows = await db
      .select({ moduleCode: schema.tenantModules.moduleCode })
      .from(schema.tenantModules)
      .where(
        and(
          eq(schema.tenantModules.tenantId, tenantId),
          eq(schema.tenantModules.status, 'ENABLED'),
        ),
      );

    return new Set(rows.map((r) => r.moduleCode));
  }

  private async validateCashSession(
    tx: Transaction,
    tenantId: string,
    sessionId: string,
    amount: number,
  ): Promise<number> {
    const [session] = await tx
      .select({
        id: schema.cashRegisterSessions.id,
        systemExpectedBalance:
          schema.cashRegisterSessions.systemExpectedBalance,
        status: schema.cashRegisterSessions.status,
      })
      .from(schema.cashRegisterSessions)
      .innerJoin(
        schema.cashRegisters,
        eq(schema.cashRegisters.id, schema.cashRegisterSessions.cashRegisterId),
      )
      .where(
        and(
          eq(schema.cashRegisterSessions.id, sessionId),
          eq(schema.cashRegisters.tenantId, tenantId),
        ),
      );

    if (!session) {
      throw new NotFoundException('Sesión de caja no encontrada');
    }
    if (session.status !== 'OPEN') {
      throw new BadRequestException(
        'La sesión de caja debe estar abierta para registrar el egreso',
      );
    }

    const balance = Number(session.systemExpectedBalance ?? 0);
    if (amount > balance) {
      throw new BadRequestException(
        'No hay suficiente saldo esperado en la caja para este egreso',
      );
    }
    return balance;
  }

  private async validateBankAccount(
    tx: Transaction,
    tenantId: string,
    accountId: string,
    amount: number,
  ): Promise<number> {
    const [account] = await tx
      .select({
        id: schema.bankAccounts.id,
        currentBalance: schema.bankAccounts.currentBalance,
        linkedChartAccountId: schema.bankAccounts.linkedChartAccountId,
      })
      .from(schema.bankAccounts)
      .where(
        and(
          eq(schema.bankAccounts.id, accountId),
          eq(schema.bankAccounts.tenantId, tenantId),
          eq(schema.bankAccounts.isActive, true),
        ),
      );

    if (!account) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    const balance = Number(account.currentBalance ?? 0);
    if (amount > balance) {
      throw new BadRequestException(
        'No hay saldo suficiente en la cuenta bancaria',
      );
    }
    return balance;
  }

  private async validatePettyCash(
    tx: Transaction,
    tenantId: string,
    fundId: string,
    amount: number,
  ): Promise<number> {
    const [fund] = await tx
      .select({
        id: schema.pettyCashFunds.id,
        currentBalance: schema.pettyCashFunds.currentBalance,
      })
      .from(schema.pettyCashFunds)
      .where(
        and(
          eq(schema.pettyCashFunds.id, fundId),
          eq(schema.pettyCashFunds.tenantId, tenantId),
          eq(schema.pettyCashFunds.isActive, true),
        ),
      );

    if (!fund) {
      throw new NotFoundException('Fondo fijo no encontrado');
    }

    const balance = Number(fund.currentBalance ?? 0);
    if (amount > balance) {
      throw new BadRequestException('No hay saldo suficiente en el fondo fijo');
    }
    return balance;
  }

  private async validateBudget(
    tx: Transaction,
    tenantId: string,
    costCenterId: string,
    amount: number,
    monthlyBudget: string | null,
    overrideBudget: boolean,
    userPermissions: string[],
    excludeExpenseId?: string,
  ): Promise<void> {
    if (!monthlyBudget) return;

    const period = new Date().toISOString().slice(0, 7);
    const [usage] = await tx
      .select({
        total: sql<number>`COALESCE(SUM(${schema.expenses.amountBase}), 0)`,
      })
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.costCenterId, costCenterId),
          eq(schema.expenses.tenantId, tenantId),
          sql`TO_CHAR(${schema.expenses.createdAt}, 'YYYY-MM') = ${period}`,
          sql`${schema.expenses.deletedAt} IS NULL`,
          sql`${schema.expenses.status} != 'REJECTED'`,
          ...(excludeExpenseId
            ? [sql`${schema.expenses.id} != ${excludeExpenseId}`]
            : []),
        ),
      );

    const used = Number(usage?.total ?? 0);
    const budget = Number(monthlyBudget);
    const hasOverride =
      userPermissions.some(
        (p) => p === '*:*:all' || p === 'treasury:expenses:approve',
      ) || overrideBudget;

    if (!hasOverride && used + amount > budget) {
      throw new ForbiddenException(
        `El gasto excede el presupuesto mensual del centro de costo. Consumido: ${used.toFixed(2)} / ${budget.toFixed(2)}. Se requiere permiso de aprobación para exceder el límite.`,
      );
    }
  }

  private async getWithholdingRates(tx: Transaction, tenantId: string) {
    const [vat, islr] = await Promise.all([
      this.getSetting(tx, tenantId, 'VAT_RATE'),
      this.getSetting(tx, tenantId, 'ISLR_RATE'),
    ]);

    const vatValue =
      vat ?? (await this.getSetting(tx, tenantId, 'TAX_PURCHASES'));
    return {
      vatRate: Number(vatValue ?? '16') / 100,
      islrRate: Number(islr ?? '3') / 100,
    };
  }

  private async getSetting(
    tx: Transaction | undefined,
    tenantId: string,
    key: string,
  ): Promise<string | null> {
    const db = tx ?? this.db;
    const [row] = await db
      .select({ value: schema.tenantSettings.value })
      .from(schema.tenantSettings)
      .where(
        and(
          eq(schema.tenantSettings.tenantId, tenantId),
          eq(schema.tenantSettings.key, key),
        ),
      );
    return row?.value ?? null;
  }

  // Descuenta la fuente en efectivo y registra el movimiento de caja cuando
  // aplica. El Banco NO se maneja aquí: se procesa vía movimiento bancario.
  private async applySourceFunding(
    tx: Transaction,
    userId: string,
    expense: ExpenseRow,
    sourceBalance: number,
  ): Promise<void> {
    const amount = Number(expense.amountBase);

    if (expense.paymentSource === 'CASH_REGISTER') {
      const newBalance = sourceBalance - amount;
      await tx
        .update(schema.cashRegisterSessions)
        .set({
          systemExpectedBalance: String(newBalance),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(
          eq(schema.cashRegisterSessions.id, expense.cashRegisterSessionId!),
        );

      await tx.insert(schema.cashMovements).values({
        sessionId: expense.cashRegisterSessionId!,
        type: 'OUTFLOW',
        amount: String(amount),
        concept: expense.description,
        referenceType: 'EXPENSE',
        referenceId: expense.id,
        createdById: userId,
      });
    } else if (expense.paymentSource === 'PETTY_CASH') {
      const newBalance = sourceBalance - amount;
      await tx
        .update(schema.pettyCashFunds)
        .set({
          currentBalance: String(newBalance),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.pettyCashFunds.id, expense.pettyCashFundId!));
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  ASIENTO CONTABLE (auto-posting)
  //  1) Valida el gate de moduleSettings vía el motor de asientos
  //  2) Envía los parámetros al módulo contable, que resuelve la
  //     REGLA CONTABLE (débito/crédito/auxiliares) automáticamente
  //  3) Si no existe regla, aplica el fallback simple
  // ──────────────────────────────────────────────────────────────

  private async generateAccountingEntry(
    expense: ExpenseRow,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const amount = Number(expense.amountBase);
    const tax = Number(expense.taxAmountBase ?? 0);
    const vatWith = Number(expense.vatWithholdingAmount ?? 0);
    const islrWith = Number(expense.islrWithholdingAmount ?? 0);
    const total = Number((amount + tax).toFixed(2));

    // Cuenta principal: se define en la categoría del gasto.
    const [category] = await this.db
      .select({
        accountingAccountId: schema.expenseCategories.accountingAccountId,
      })
      .from(schema.expenseCategories)
      .where(eq(schema.expenseCategories.id, expense.categoryId))
      .limit(1);

    if (!category?.accountingAccountId) {
      this.logger.warn(
        `El gasto ${expense.id} no tiene una cuenta principal en su categoría; se usa el asiento de respaldo`,
      );
      try {
        await this.createFallbackEntry(expense, tenantId, userId);
      } catch (fallbackError) {
        this.logger.warn(
          `Asiento contable omitido para el gasto ${expense.id}: ${(fallbackError as Error).message}`,
        );
      }
      return;
    }

    try {
      const entry = await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'expenses',
          submodule: 'expenses',
          category: 'ADMINISTRATIVE',
          operationType: 'EXPENSE',
          description: `Gasto: ${expense.description}`,
          entryDate: expense.paidAt ?? new Date(),
          autoPostKey: 'AUTO_POST_ENTRY_EXPENSES',
          currencyCode: expense.currencyCode as CurrencyCodeEnum,
          exchangeRate: Number(expense.exchangeRate),
          originReferenceId: expense.id,
          originType: 'EXPENSE',
          globalDescriptions: { EXPENSE_AMOUNT: expense.description },
          roleAliases: { EXPENSE_AMOUNT: 'TOTAL' },
          // La cuenta principal (débito) viene de la categoría del gasto.
          // La regla contable ADMINISTRATIVE/EXPENSE solo aporta la contrapartida.
          explicitDetails: [
            {
              accountPlanId: category.accountingAccountId,
              movementType: 'DEBIT',
              amount: total,
              description: expense.description,
              supplierId: expense.supplierId ?? undefined,
            },
          ],
          items: [
            {
              supplierId: expense.supplierId ?? undefined,
              amounts: {
                EXPENSE_AMOUNT: amount,
                EXPENSE_TAX: tax,
                TOTAL_AMOUNT: total,
                VAT_WITHHOLDING: vatWith,
                ISLR_WITHHOLDING: islrWith,
                EXPENSE_COUNTERPART: total,
              },
              description: expense.description,
              descriptions: {
                EXPENSE_AMOUNT: expense.description,
                TOTAL_AMOUNT: expense.description,
                EXPENSE_COUNTERPART: expense.description,
              },
            },
          ],
        },
      );

      if (entry) {
        this.logger.log(
          `Asiento contable ${entry.id} generado para el gasto ${expense.id}`,
        );
        return;
      }
      this.logger.log(
        `Auto-posting desactivado: se omite asiento del gasto ${expense.id}`,
      );
      return;
    } catch (error) {
      const msg = (error as Error).message ?? '';
      if (!msg.includes('No existe una regla contable')) {
        this.logger.error(
          `Error generando asiento automático del gasto: ${msg}`,
        );
        return;
      }
      // Sin regla configurada → fallback simple
      try {
        await this.createFallbackEntry(expense, tenantId, userId);
      } catch (fallbackError) {
        this.logger.warn(
          `Asiento contable omitido para el gasto ${expense.id}: ${(fallbackError as Error).message}`,
        );
      }
    }
  }

  private async createFallbackEntry(
    expense: ExpenseRow,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const amount = Number(expense.amountBase);
    const period = (expense.paidAt ?? new Date()).toISOString().split('T')[0];

    const [cycle] = await this.db
      .select()
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.tenantId, tenantId),
          eq(schema.accountingCycles.status, 'OPEN'),
          sql`${schema.accountingCycles.startDate} <= ${period}`,
          sql`${schema.accountingCycles.endDate} >= ${period}`,
        ),
      )
      .limit(1);

    if (!cycle) {
      this.logger.warn(
        `No hay ciclo contable abierto para el tenant ${tenantId}; se omite el asiento del gasto`,
      );
      return;
    }

    const [category] = await this.db
      .select()
      .from(schema.expenseCategories)
      .where(eq(schema.expenseCategories.id, expense.categoryId));

    const debitAccountId =
      category?.accountingAccountId ??
      (
        await this.db
          .select({ id: schema.accountPlan.id })
          .from(schema.accountPlan)
          .where(
            and(
              eq(schema.accountPlan.tenantId, tenantId),
              eq(schema.accountPlan.accountType, 'EXPENSE'),
              eq(schema.accountPlan.allowsMovements, true),
              eq(schema.accountPlan.isActive, true),
            ),
          )
          .limit(1)
      )[0]?.id;

    if (!debitAccountId) {
      this.logger.warn(
        'No se encontró una cuenta de gastos en el plan de cuentas; se omite el asiento',
      );
      return;
    }

    let creditAccountId: string | null = null;
    if (expense.paymentSource === 'BANK_ACCOUNT' && expense.bankAccountId) {
      const [account] = await this.db
        .select({ linked: schema.bankAccounts.linkedChartAccountId })
        .from(schema.bankAccounts)
        .where(eq(schema.bankAccounts.id, expense.bankAccountId));
      creditAccountId = account?.linked ?? null;
    }
    if (!creditAccountId) {
      const [asset] = await this.db
        .select({ id: schema.accountPlan.id })
        .from(schema.accountPlan)
        .where(
          and(
            eq(schema.accountPlan.tenantId, tenantId),
            eq(schema.accountPlan.accountType, 'ASSET'),
            eq(schema.accountPlan.allowsMovements, true),
            eq(schema.accountPlan.isActive, true),
          ),
        )
        .limit(1);
      creditAccountId = asset?.id ?? null;
    }

    if (!creditAccountId) {
      this.logger.warn(
        'No se encontró una cuenta de contrapartida; se omite el asiento',
      );
      return;
    }

    const [voucherRow] = await this.db
      .select({
        max: sql<number>`COALESCE(MAX(${schema.accountingEntries.voucherNo}), 0)`,
      })
      .from(schema.accountingEntries)
      .where(eq(schema.accountingEntries.tenantId, tenantId));

    const voucherNo = Number(voucherRow?.max ?? 0) + 1;
    const desc = `Gasto: ${expense.description}`;
    const exchangeRate = Number(expense.exchangeRate);

    const [entry] = await this.db
      .insert(schema.accountingEntries)
      .values({
        tenantId,
        accountingCycleId: cycle.id,
        entryDate: period,
        description: desc,
        currencyCode: expense.currencyCode as never,
        baseCurrencyCode: expense.currencyCode as never,
        originReferenceId: expense.id,
        originType: 'EXPENSE',
        voucherNo,
        status: 'POSTED',
        postedAt: new Date(),
        createdById: userId,
      })
      .returning();

    await this.db.insert(schema.accountingEntryDetails).values([
      {
        accountingEntryId: entry.id,
        accountPlanId: debitAccountId,
        debit: String(amount),
        credit: '0',
        debitBase: String(amount),
        creditBase: '0',
        debitForeign: String(amount),
        creditForeign: '0',
        exchangeRate: String(exchangeRate),
        currencyCode: expense.currencyCode as never,
        description: desc,
        createdById: userId,
      },
      {
        accountingEntryId: entry.id,
        accountPlanId: creditAccountId,
        debit: '0',
        credit: String(amount),
        debitBase: '0',
        creditBase: String(amount),
        debitForeign: '0',
        creditForeign: String(amount),
        exchangeRate: String(exchangeRate),
        currencyCode: expense.currencyCode as never,
        description: desc,
        createdById: userId,
      },
    ]);

    this.logger.log(`Asiento de respaldo generado para el gasto ${expense.id}`);
  }
}
