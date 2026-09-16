import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import { CurrencyCodeEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
import {
  FilterExpenseReportDto,
  PayExpenseReportDto,
  UpdateExpenseReportDto,
} from './dto/expense-reports.schema';

const round = (value: number, decimals: number) =>
  Number(value.toFixed(decimals));

@Injectable()
export class ExpenseReportsService {
  private readonly logger = new Logger(ExpenseReportsService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
    private readonly accountingEntriesService: AccountingEntriesService,
    private readonly bankMovementsService: BankMovementsService,
  ) {}

  async findAllByPagination(tenantId: string, dto?: FilterExpenseReportDto) {
    const {
      page = 1,
      limit = 10,
      status,
      employeeUserId,
      search = '',
    } = dto || {};
    const offset = (page - 1) * limit;

    const conditions = [
      eq(schema.expenseReports.tenantId, tenantId),
      ...(status ? [eq(schema.expenseReports.status, status)] : []),
      ...(employeeUserId
        ? [eq(schema.expenseReports.employeeUserId, employeeUserId)]
        : []),
      ...(search
        ? [
            or(
              ilike(schema.expenseReports.title, `%${search}%`),
              ilike(schema.users.fullname, `%${search}%`),
            ),
          ]
        : []),
    ];
    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.expenseReports)
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.expenseReports.employeeUserId),
      )
      .where(whereClause);
    const totalCount = Number(totalResult.count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select({
        id: schema.expenseReports.id,
        tenantId: schema.expenseReports.tenantId,
        employeeUserId: schema.expenseReports.employeeUserId,
        employeeName: schema.users.fullname,
        title: schema.expenseReports.title,
        description: schema.expenseReports.description,
        totalAmount: schema.expenseReports.totalAmount,
        currencyCode: schema.expenseReports.currencyCode,
        status: schema.expenseReports.status,
        paymentSource: schema.expenseReports.paymentSource,
        bankAccountId: schema.expenseReports.bankAccountId,
        pettyCashFundId: schema.expenseReports.pettyCashFundId,
        approvedByUserId: schema.expenseReports.approvedByUserId,
        approvedAt: schema.expenseReports.approvedAt,
        rejectedByUserId: schema.expenseReports.rejectedByUserId,
        rejectedAt: schema.expenseReports.rejectedAt,
        rejectionReason: schema.expenseReports.rejectionReason,
        paidAt: schema.expenseReports.paidAt,
        paidExpenseId: schema.expenseReports.paidExpenseId,
        createdAt: schema.expenseReports.createdAt,
      })
      .from(schema.expenseReports)
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.expenseReports.employeeUserId),
      )
      .where(whereClause)
      .orderBy(sql`${schema.expenseReports.createdAt} desc`)
      .limit(limit)
      .offset(offset);

    return {
      data: data.map((r) => ({ ...r, totalAmount: Number(r.totalAmount) })),
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

  /** Detalle de un reporte con sus items (tickets). */
  async findOneWithItems(id: string, tenantId: string) {
    const [report] = await this.db
      .select({
        id: schema.expenseReports.id,
        tenantId: schema.expenseReports.tenantId,
        employeeUserId: schema.expenseReports.employeeUserId,
        employeeName: schema.users.fullname,
        title: schema.expenseReports.title,
        description: schema.expenseReports.description,
        totalAmount: schema.expenseReports.totalAmount,
        currencyCode: schema.expenseReports.currencyCode,
        status: schema.expenseReports.status,
        paymentSource: schema.expenseReports.paymentSource,
        bankAccountId: schema.expenseReports.bankAccountId,
        pettyCashFundId: schema.expenseReports.pettyCashFundId,
        approvedByUserId: schema.expenseReports.approvedByUserId,
        approvedAt: schema.expenseReports.approvedAt,
        rejectedByUserId: schema.expenseReports.rejectedByUserId,
        rejectedAt: schema.expenseReports.rejectedAt,
        rejectionReason: schema.expenseReports.rejectionReason,
        paidAt: schema.expenseReports.paidAt,
        paidExpenseId: schema.expenseReports.paidExpenseId,
        createdAt: schema.expenseReports.createdAt,
      })
      .from(schema.expenseReports)
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.expenseReports.employeeUserId),
      )
      .where(
        and(
          eq(schema.expenseReports.id, id),
          eq(schema.expenseReports.tenantId, tenantId),
        ),
      );

    if (!report) {
      throw new NotFoundException(
        `Reporte de gastos con ID ${id} no encontrado`,
      );
    }

    const items = await this.db
      .select()
      .from(schema.expenseReportItems)
      .where(eq(schema.expenseReportItems.reportId, id));

    return {
      ...report,
      totalAmount: Number(report.totalAmount),
      items: items.map((it) => ({ ...it, amount: Number(it.amount) })),
    };
  }

  async create(
    userId: string,
    tenantId: string,
    dto: {
      employeeUserId?: string;
      title: string;
      description?: string;
      currencyCode: 'VES' | 'USD' | 'EUR';
      items: Array<{
        categoryId: string;
        description: string;
        amount: number;
        receiptImageUrl?: string;
        expenseDate?: string;
      }>;
    },
  ) {
    const result = await this.db.transaction(async (tx) => {
      const employeeUserId = dto.employeeUserId ?? userId;

      // Valida las categorías usadas
      const categoryIds = [...new Set(dto.items.map((i) => i.categoryId))];
      for (const categoryId of categoryIds) {
        const [category] = await tx
          .select({ id: schema.expenseCategories.id })
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
            'Una de las categorías del reporte no es válida',
          );
        }
      }

      const totalAmount = round(
        dto.items.reduce((sum, item) => sum + item.amount, 0),
        4,
      );

      const [report] = await tx
        .insert(schema.expenseReports)
        .values({
          tenantId,
          employeeUserId,
          title: dto.title,
          description: dto.description ?? null,
          totalAmount: String(totalAmount),
          currencyCode: dto.currencyCode,
          status: 'PENDING',
          createdById: userId,
        })
        .returning();

      await tx.insert(schema.expenseReportItems).values(
        dto.items.map((item) => ({
          reportId: report.id,
          categoryId: item.categoryId,
          description: item.description,
          amount: String(item.amount),
          receiptImageUrl: item.receiptImageUrl || null,
          expenseDate: item.expenseDate
            ? new Date(item.expenseDate)
            : new Date(),
        })),
      );

      return report;
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'INSERT',
        tableName: 'expense_reports',
        recordId: result.id,
        description: `Reporte de reembolso creado: ${result.title}`,
        area: 'Expenses',
        newData: result,
        tenantId,
      }),
    );

    return { ...result, totalAmount: Number(result.totalAmount) };
  }

  async update(
    id: string,
    userId: string,
    tenantId: string,
    dto: UpdateExpenseReportDto,
  ) {
    const report = await this.getRawReport(id, tenantId);
    if (report.status !== 'PENDING') {
      throw new BadRequestException(
        'Solo los reportes pendientes pueden editarse',
      );
    }

    const result = await this.db.transaction(async (tx) => {
      let totalAmount = Number(report.totalAmount);

      if (dto.items) {
        await tx
          .delete(schema.expenseReportItems)
          .where(eq(schema.expenseReportItems.reportId, id));

        const categoryIds = [...new Set(dto.items.map((i) => i.categoryId))];
        for (const categoryId of categoryIds) {
          const [category] = await tx
            .select({ id: schema.expenseCategories.id })
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
              'Una de las categorías del reporte no es válida',
            );
          }
        }

        await tx.insert(schema.expenseReportItems).values(
          dto.items.map((item) => ({
            reportId: id,
            categoryId: item.categoryId,
            description: item.description,
            amount: String(item.amount),
            receiptImageUrl: item.receiptImageUrl || null,
            expenseDate: item.expenseDate
              ? new Date(item.expenseDate)
              : new Date(),
          })),
        );

        totalAmount = round(
          dto.items.reduce((sum, item) => sum + item.amount, 0),
          4,
        );
      }

      const [updated] = await tx
        .update(schema.expenseReports)
        .set({
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description ?? null }
            : {}),
          totalAmount: String(totalAmount),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.expenseReports.id, id))
        .returning();

      return updated;
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'expense_reports',
        recordId: id,
        description: `Reporte de reembolso actualizado: ${result.title}`,
        area: 'Expenses',
        newData: result,
        tenantId,
      }),
    );

    return { ...result, totalAmount: Number(result.totalAmount) };
  }

  async approve(id: string, userId: string, tenantId: string) {
    const report = await this.getRawReport(id, tenantId);
    if (report.status !== 'PENDING') {
      throw new BadRequestException(
        `Solo los reportes pendientes pueden aprobarse (estado actual: ${report.status})`,
      );
    }

    const [approved] = await this.db
      .update(schema.expenseReports)
      .set({
        status: 'APPROVED',
        approvedByUserId: userId,
        approvedAt: new Date(),
        updatedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.expenseReports.id, id))
      .returning();

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'expense_reports',
        recordId: id,
        description: `Reporte aprobado: ${approved.title}`,
        area: 'Expenses',
        newData: approved,
        tenantId,
      }),
    );

    return { ...approved, totalAmount: Number(approved.totalAmount) };
  }

  async reject(id: string, userId: string, tenantId: string, reason?: string) {
    const report = await this.getRawReport(id, tenantId);
    if (report.status !== 'PENDING') {
      throw new BadRequestException(
        'Solo los reportes pendientes pueden rechazarse',
      );
    }

    const [rejected] = await this.db
      .update(schema.expenseReports)
      .set({
        status: 'REJECTED',
        rejectedByUserId: userId,
        rejectedAt: new Date(),
        rejectionReason: reason ?? null,
        updatedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.expenseReports.id, id))
      .returning();

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'expense_reports',
        recordId: id,
        description: `Reporte rechazado: ${rejected.title}`,
        area: 'Expenses',
        previousData: report,
        newData: rejected,
        tenantId,
      }),
    );

    return { ...rejected, totalAmount: Number(rejected.totalAmount) };
  }

  // Paga el reporte aprobado: deduce la fuente y genera el gasto formal
  async pay(
    id: string,
    userId: string,
    tenantId: string,
    dto: PayExpenseReportDto,
  ) {
    const report = await this.getRawReport(id, tenantId);
    if (report.status !== 'APPROVED') {
      throw new BadRequestException(
        'Solo los reportes aprobados pueden pagarse. El reporte pasa primero a la cola de pagos al ser aprobado.',
      );
    }

    const totalAmount = Number(report.totalAmount);
    // El primer item del reporte determina la categoría del gasto formal
    const [firstItem] = await this.db
      .select()
      .from(schema.expenseReportItems)
      .where(eq(schema.expenseReportItems.reportId, id))
      .limit(1);
    if (!firstItem) {
      throw new BadRequestException(
        'El reporte no tiene items para generar el gasto',
      );
    }

    const result = await this.db.transaction(async (tx) => {
      // 1. Valida y descuenta la fuente de pago
      if (dto.paymentSource === 'BANK_ACCOUNT') {
        const [account] = await tx
          .select()
          .from(schema.bankAccounts)
          .where(
            and(
              eq(schema.bankAccounts.id, dto.bankAccountId!),
              eq(schema.bankAccounts.tenantId, tenantId),
              eq(schema.bankAccounts.isActive, true),
            ),
          );
        if (!account) {
          throw new NotFoundException('Cuenta bancaria no encontrada');
        }
        if (totalAmount > Number(account.currentBalance ?? 0)) {
          throw new BadRequestException(
            'No hay saldo suficiente en la cuenta bancaria',
          );
        }
        // Movimiento bancario (débito) vinculado al reembolso. El servicio
        // bancario actualiza el saldo de la cuenta.
        await this.bankMovementsService.createAndReconcile(
          {
            movement: {
              bankAccountId: dto.bankAccountId!,
              transactionDate: new Date(),
              paymentMethod: 'BANK_TRANSFER',
              description: `Pago de reembolso: ${report.title}`,
              category: 'OTHER_EXPENSE',
              creditAmount: 0,
              debitAmount: totalAmount,
              note: `Reembolso ${report.id}`,
            },
            links: [
              {
                internalRecordType: 'EXPENSE_REPORT',
                internalRecordId: report.id,
              },
            ],
          },
          userId,
          tenantId,
          tx as unknown as DrizzleDatabase,
        );
      } else {
        const [fund] = await tx
          .select()
          .from(schema.pettyCashFunds)
          .where(
            and(
              eq(schema.pettyCashFunds.id, dto.pettyCashFundId!),
              eq(schema.pettyCashFunds.tenantId, tenantId),
              eq(schema.pettyCashFunds.isActive, true),
            ),
          );
        if (!fund) {
          throw new NotFoundException('Fondo fijo no encontrado');
        }
        if (totalAmount > Number(fund.currentBalance ?? 0)) {
          throw new BadRequestException(
            'No hay saldo suficiente en el fondo fijo',
          );
        }
        await tx
          .update(schema.pettyCashFunds)
          .set({
            currentBalance: String(Number(fund.currentBalance) - totalAmount),
            updatedById: userId,
            updatedAt: new Date(),
          })
          .where(eq(schema.pettyCashFunds.id, fund.id));
      }

      // 2. Genera el gasto formal (beneficiario: el empleado)
      const [expense] = await tx
        .insert(schema.expenses)
        .values({
          tenantId,
          costCenterId: null,
          categoryId: firstItem.categoryId,
          paymentSource: dto.paymentSource,
          bankAccountId:
            dto.paymentSource === 'BANK_ACCOUNT' ? dto.bankAccountId : null,
          pettyCashFundId:
            dto.paymentSource === 'PETTY_CASH' ? dto.pettyCashFundId : null,
          type: 'EXPRESS',
          paymentStatus: 'PAID',
          status: 'PAID',
          amountBase: String(totalAmount),
          taxAmountBase: '0.0000',
          currencyCode: report.currencyCode,
          exchangeRate: '1',
          receiptImageUrl: null,
          description: `Reembolso: ${report.title} (${report.employeeUserId})`,
          createdById: userId,
          approvedByUserId: userId,
          approvedAt: new Date(),
          paidByUserId: userId,
          paidAt: new Date(),
        })
        .returning();

      void round;
      void expense;

      // 3. Marca el reporte como pagado
      const [paid] = await tx
        .update(schema.expenseReports)
        .set({
          status: 'PAID',
          paymentSource: dto.paymentSource,
          bankAccountId: dto.bankAccountId ?? report.bankAccountId,
          pettyCashFundId: dto.pettyCashFundId ?? report.pettyCashFundId,
          paidExpenseId: expense.id,
          paidAt: new Date(),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.expenseReports.id, id))
        .returning();

      return { report: paid, expenseId: expense.id };
    });

    // 4. Asiento contable (tolerante a fallos)
    try {
      // Cuenta principal del gasto (definida en la categoría)
      const [expenseCategory] = await this.db
        .select({
          accountingAccountId: schema.expenseCategories.accountingAccountId,
        })
        .from(schema.expenseCategories)
        .where(eq(schema.expenseCategories.id, firstItem.categoryId))
        .limit(1);

      await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'expenses',
          submodule: 'expense-reports',
          category: 'ADMINISTRATIVE',
          operationType: 'EXPENSE',
          description: `Reembolso: ${report.title}`,
          entryDate: new Date(),
          autoPostKey: 'AUTO_POST_ENTRY_EXPENSES',
          currencyCode: report.currencyCode as CurrencyCodeEnum,
          exchangeRate: 1,
          originReferenceId: result.expenseId,
          originType: 'EXPENSE_REPORT',
          globalDescriptions: { EXPENSE_AMOUNT: report.title },
          roleAliases: { EXPENSE_AMOUNT: 'TOTAL' },
          explicitDetails: expenseCategory?.accountingAccountId
            ? [
                {
                  accountPlanId: expenseCategory.accountingAccountId,
                  movementType: 'DEBIT' as const,
                  amount: totalAmount,
                  description: report.title,
                },
              ]
            : undefined,
          items: [
            {
              amounts: {
                EXPENSE_AMOUNT: totalAmount,
                EXPENSE_TAX: 0,
                TOTAL_AMOUNT: totalAmount,
                VAT_WITHHOLDING: 0,
                ISLR_WITHHOLDING: 0,
                EXPENSE_COUNTERPART: totalAmount,
              },
              description: report.title,
              descriptions: {
                EXPENSE_AMOUNT: report.title,
                TOTAL_AMOUNT: report.title,
                EXPENSE_COUNTERPART: report.title,
              },
            },
          ],
        },
      );
    } catch (error) {
      this.logger.warn(
        `Asiento contable omitido para el reporte ${id}: ${(error as Error).message}`,
      );
    }

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'expense_reports',
        recordId: id,
        description: `Reembolso pagado: ${report.title}`,
        area: 'Expenses',
        newData: result,
        tenantId,
      }),
    );

    return result;
  }

  async remove(id: string, userId: string, tenantId: string) {
    const report = await this.getRawReport(id, tenantId);
    if (report.status !== 'PENDING') {
      throw new BadRequestException(
        'Solo los reportes pendientes pueden eliminarse',
      );
    }

    await this.db.transaction(async (tx) => {
      await tx
        .delete(schema.expenseReportItems)
        .where(eq(schema.expenseReportItems.reportId, id));
      await tx
        .delete(schema.expenseReports)
        .where(eq(schema.expenseReports.id, id));
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'DELETE',
        tableName: 'expense_reports',
        recordId: id,
        description: `Reporte de reembolso eliminado: ${report.title}`,
        area: 'Expenses',
        previousData: report,
        tenantId,
      }),
    );

    return { message: 'Reporte eliminado correctamente' };
  }

  private async getRawReport(
    id: string,
    tenantId: string,
  ): Promise<typeof schema.expenseReports.$inferSelect> {
    const [row] = await this.db
      .select()
      .from(schema.expenseReports)
      .where(
        and(
          eq(schema.expenseReports.id, id),
          eq(schema.expenseReports.tenantId, tenantId),
        ),
      );
    if (!row) {
      throw new NotFoundException(
        `Reporte de gastos con ID ${id} no encontrado`,
      );
    }
    return row;
  }
}
