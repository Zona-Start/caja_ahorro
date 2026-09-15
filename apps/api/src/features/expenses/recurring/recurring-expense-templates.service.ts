import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, eq, ilike, sql } from 'drizzle-orm';
import {
  CreateRecurringExpenseTemplateDto,
  FilterRecurringExpenseTemplateDto,
  UpdateRecurringExpenseTemplateDto,
} from './dto/recurring-expense-templates.schema';

type Template = typeof schema.recurringExpenseTemplates.$inferSelect;

const FREQUENCY_MONTHS: Record<string, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  ANNUAL: 12,
};

/**
 * Calcula la próxima ejecución estrictamente posterior a `base`.
 * BIWEEKLY = cada 14 días; el resto por día del mes en múltiplos de meses.
 */
export function nextOccurrence(
  base: Date,
  frequency: string,
  dayOfMonth: number | null,
): Date {
  const DAY = 24 * 60 * 60 * 1000;
  if (frequency === 'BIWEEKLY' || !dayOfMonth) {
    return new Date(base.getTime() + 14 * DAY);
  }

  const months = FREQUENCY_MONTHS[frequency] ?? 1;
  const candidate = new Date(
    Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth() + months,
      Math.min(dayOfMonth, 28),
    ),
  );

  if (candidate.getTime() <= base.getTime()) {
    return new Date(
      Date.UTC(
        base.getUTCFullYear(),
        base.getUTCMonth() + months * 2,
        Math.min(dayOfMonth, 28),
      ),
    );
  }
  return candidate;
}

/** Fecha de la PRIMERA ejecución a partir de la creación. */
export function firstRunDate(
  frequency: string,
  dayOfMonth: number | null,
): Date {
  const now = new Date();
  if (frequency === 'BIWEEKLY' || !dayOfMonth) {
    return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
  const thisMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), Math.min(dayOfMonth, 28)),
  );
  if (thisMonth.getTime() > now.getTime()) return thisMonth;
  return nextOccurrence(now, frequency, dayOfMonth);
}

@Injectable()
export class RecurringExpenseTemplatesService {
  private readonly logger = new Logger('RecurringExpenseTemplatesService');

  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAllByPagination(
    tenantId: string,
    dto?: FilterRecurringExpenseTemplateDto,
  ) {
    const { page = 1, limit = 10, isActive, search = '' } = dto || {};
    const offset = (page - 1) * limit;

    const conditions = [
      eq(schema.recurringExpenseTemplates.tenantId, tenantId),
      ...(isActive !== undefined
        ? [eq(schema.recurringExpenseTemplates.isActive, isActive)]
        : []),
      ...(search
        ? [ilike(schema.recurringExpenseTemplates.name, `%${search}%`)]
        : []),
    ];
    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.recurringExpenseTemplates)
      .where(whereClause);
    const totalCount = Number(totalResult.count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select()
      .from(schema.recurringExpenseTemplates)
      .where(whereClause)
      .orderBy(
        sql`${schema.recurringExpenseTemplates.nextRunDate} asc nulls last`,
      )
      .limit(limit)
      .offset(offset);

    return {
      data: data.map((t) => this.mapNumeric(t)),
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
    const [row] = await this.db
      .select()
      .from(schema.recurringExpenseTemplates)
      .where(
        and(
          eq(schema.recurringExpenseTemplates.id, id),
          eq(schema.recurringExpenseTemplates.tenantId, tenantId),
        ),
      );
    if (!row) {
      throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
    }
    return this.mapNumeric(row);
  }

  async create(
    userId: string,
    tenantId: string,
    dto: CreateRecurringExpenseTemplateDto,
  ) {
    const [created] = await this.db
      .insert(schema.recurringExpenseTemplates)
      .values({
        tenantId,
        name: dto.name,
        description: dto.description ?? null,
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
        dayOfMonth: dto.frequency === 'BIWEEKLY' ? null : dto.dayOfMonth,
        nextRunDate: firstRunDate(dto.frequency, dto.dayOfMonth),
        autoCreate: dto.autoCreate,
        isActive: dto.isActive,
        createdById: userId,
      })
      .returning();

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'INSERT',
        tableName: 'recurring_expense_templates',
        recordId: created.id,
        description: `Plantilla de gasto recurrente creada: ${created.name}`,
        area: 'Expenses',
        newData: created,
        tenantId,
      }),
    );

    return this.mapNumeric(created);
  }

  async update(
    id: string,
    userId: string,
    tenantId: string,
    dto: UpdateRecurringExpenseTemplateDto,
  ) {
    await this.findOne(id, tenantId);

    const [updated] = await this.db
      .update(schema.recurringExpenseTemplates)
      .set({
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description ?? null }
          : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.supplierId !== undefined
          ? { supplierId: dto.supplierId ?? null }
          : {}),
        ...(dto.costCenterId !== undefined
          ? { costCenterId: dto.costCenterId ?? null }
          : {}),
        ...(dto.amount !== undefined ? { amount: String(dto.amount) } : {}),
        ...(dto.currencyCode !== undefined
          ? { currencyCode: dto.currencyCode }
          : {}),
        ...(dto.paymentSource !== undefined
          ? { paymentSource: dto.paymentSource }
          : {}),
        ...(dto.bankAccountId !== undefined
          ? { bankAccountId: dto.bankAccountId ?? null }
          : {}),
        ...(dto.pettyCashFundId !== undefined
          ? { pettyCashFundId: dto.pettyCashFundId ?? null }
          : {}),
        ...(dto.frequency !== undefined ? { frequency: dto.frequency } : {}),
        ...(dto.dayOfMonth !== undefined ? { dayOfMonth: dto.dayOfMonth } : {}),
        ...(dto.autoCreate !== undefined ? { autoCreate: dto.autoCreate } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        updatedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.recurringExpenseTemplates.id, id))
      .returning();

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'recurring_expense_templates',
        recordId: id,
        description: `Plantilla recurrente actualizada: ${updated.name}`,
        area: 'Expenses',
        newData: updated,
        tenantId,
      }),
    );

    return this.mapNumeric(updated);
  }

  async remove(id: string, userId: string, tenantId: string) {
    const template = await this.findOne(id, tenantId);

    await this.db
      .update(schema.recurringExpenseTemplates)
      .set({
        isActive: false,
        updatedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.recurringExpenseTemplates.id, id));

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'DELETE',
        tableName: 'recurring_expense_templates',
        recordId: id,
        description: `Plantilla recurrente desactivada: ${template.name}`,
        area: 'Expenses',
        previousData: template,
        tenantId,
      }),
    );

    return { message: 'Plantilla recurrente desactivada correctamente' };
  }

  /** Genera el gasto pendiente de una plantilla (usado por el scheduler). */
  async generateExpenseForTemplate(template: Template) {
    const today = new Date();

    const result = await this.db.transaction(async (tx) => {
      // Evita duplicados: si ya existe un gasto del período, solo avanza
      const [existing] = await tx
        .select({ id: schema.expenses.id })
        .from(schema.expenses)
        .where(
          and(
            eq(schema.expenses.recurringTemplateId, template.id),
            sql`${schema.expenses.createdAt} >= ${template.nextRunDate}`,
            sql`${schema.expenses.deletedAt} IS NULL`,
          ),
        )
        .limit(1);

      let expenseId: string | null = existing?.id ?? null;
      if (!expenseId && template.autoCreate) {
        const [expense] = await tx
          .insert(schema.expenses)
          .values({
            tenantId: template.tenantId,
            supplierId: template.supplierId,
            costCenterId: template.costCenterId,
            categoryId: template.categoryId,
            paymentSource: template.paymentSource,
            cashRegisterSessionId: null,
            bankAccountId:
              template.paymentSource === 'BANK_ACCOUNT'
                ? template.bankAccountId
                : null,
            pettyCashFundId:
              template.paymentSource === 'PETTY_CASH'
                ? template.pettyCashFundId
                : null,
            type: 'EXPRESS',
            paymentStatus: 'PENDING',
            status: 'PENDING_APPROVAL',
            amountBase: template.amount,
            taxAmountBase: '0.0000',
            currencyCode: template.currencyCode,
            exchangeRate: '1',
            description: `${template.name} (gasto recurrente)`,
            createdById: null,
          })
          .returning({ id: schema.expenses.id });
        expenseId = expense.id;
      }

      const now = new Date();
      const [updatedTemplate] = await tx
        .update(schema.recurringExpenseTemplates)
        .set({
          lastRunAt: now,
          nextRunDate: nextOccurrence(
            template.nextRunDate ?? now,
            template.frequency,
            template.dayOfMonth,
          ),
          updatedAt: now,
        })
        .where(eq(schema.recurringExpenseTemplates.id, template.id))
        .returning();

      return { expenseId, template: updatedTemplate };
    });

    this.logger.log(
      `Plantilla recurrente ${template.name} procesada (gasto: ${result.expenseId ?? 'solo alerta'})`,
    );
    return result;
  }

  /** Plantillas activas cuya fecha de ejecución ya venció. */
  async findDueTemplates(): Promise<Template[]> {
    return await this.db
      .select()
      .from(schema.recurringExpenseTemplates)
      .where(
        and(
          eq(schema.recurringExpenseTemplates.isActive, true),
          sql`${schema.recurringExpenseTemplates.nextRunDate} IS NOT NULL`,
          sql`${schema.recurringExpenseTemplates.nextRunDate} <= now()`,
        ),
      );
  }

  private mapNumeric(template: Template) {
    return {
      ...template,
      amount: Number(template.amount),
      dayOfMonth: template.dayOfMonth ?? null,
      nextRunDate: template.nextRunDate?.toISOString() ?? null,
      lastRunAt: template.lastRunAt?.toISOString() ?? null,
    };
  }
}
