import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
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

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
    private readonly accountingEntriesService: AccountingEntriesService,
    private readonly exchangeRateService: ExchangeRateService,
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
        status: schema.expenses.status,
        paymentStatus: schema.expenses.paymentStatus,
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
      .select()
      .from(schema.expenseDetails)
      .where(eq(schema.expenseDetails.expenseId, id))
      .orderBy(asc(schema.expenseDetails.createdAt));

    return { ...expense, amountBase: Number(expense.amountBase), details };
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
  //  APPROVE: re-valida, deduce fuente, genera movimiento y asiento
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

      // 1. Re-validar disponible en la fuente (se descuenta al aprobar)
      const sourceBalance = await this.validateSource(
        tx,
        tenantId,
        expense,
        amount,
      );

      // 2. Validaciones corporativas
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

      // 3. Aprobar el gasto
      const [updated] = await tx
        .update(schema.expenses)
        .set({
          status: 'APPROVED',
          paymentStatus: 'PAID',
          islrWithholdingAmount: String(islrWithholding),
          vatWithholdingAmount: String(vatWithholding),
          approvedByUserId: userId,
          approvedAt: new Date(),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.expenses.id, id))
        .returning();

      // 4. Afectar la fuente de financiamiento (descuento + movimiento de caja)
      await this.applySourceFunding(tx, userId, expense, sourceBalance);

      return updated;
    });

    // 5. Asiento contable (fuera de la tx: si falla no revierte la aprobación)
    await this.generateAccountingEntry(
      approved,
      tenantId,
      approved.createdById ?? '',
    );

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'expenses',
        recordId: id,
        description: `Gasto aprobado: ${approved.description}`,
        area: 'Expenses',
        newData: approved,
        tenantId,
      }),
    );

    return approved;
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

    if (existing.status === 'APPROVED') {
      throw new BadRequestException(
        'No se puede eliminar un gasto aprobado que ya afectó saldos contables',
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

  // Descuenta la fuente y registra el movimiento de caja cuando aplica
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
    } else if (expense.paymentSource === 'BANK_ACCOUNT') {
      const newBalance = sourceBalance - amount;
      await tx
        .update(schema.bankAccounts)
        .set({
          currentBalance: String(newBalance),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.bankAccounts.id, expense.bankAccountId!));
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
    try {
      const amount = Number(expense.amountBase);
      const tax = Number(expense.taxAmountBase ?? 0);
      const vatWith = Number(expense.vatWithholdingAmount ?? 0);
      const islrWith = Number(expense.islrWithholdingAmount ?? 0);

      const entry = await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'expenses',
          submodule: 'expenses',
          category: 'ADMINISTRATIVE',
          operationType: 'EXPENSE',
          description: `Gasto: ${expense.description}`,
          entryDate: expense.approvedAt ?? new Date(),
          autoPostKey: 'AUTO_POST_ENTRY_EXPENSES',
          currencyCode: expense.currencyCode as CurrencyCodeEnum,
          exchangeRate: Number(expense.exchangeRate),
          originReferenceId: expense.id,
          originType: 'EXPENSE',
          globalDescriptions: { EXPENSE_AMOUNT: expense.description },
          roleAliases: { EXPENSE_AMOUNT: 'TOTAL' },
          items: [
            {
              supplierId: expense.supplierId ?? undefined,
              amounts: {
                EXPENSE_AMOUNT: amount,
                EXPENSE_TAX: tax,
                TOTAL_AMOUNT: amount + tax,
                VAT_WITHHOLDING: vatWith,
                ISLR_WITHHOLDING: islrWith,
              },
              description: expense.description,
              descriptions: {
                EXPENSE_AMOUNT: expense.description,
                TOTAL_AMOUNT: expense.description,
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
    const period = (expense.approvedAt ?? new Date())
      .toISOString()
      .split('T')[0];

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
