import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
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
  CreatePettyCashVoucherDto,
  FilterPettyCashVoucherDto,
  LiquidatePettyCashVoucherDto,
  UpdatePettyCashVoucherDto,
} from './dto/petty-cash-vouchers.schema';

const round = (value: number, decimals: number) =>
  Number(value.toFixed(decimals));

@Injectable()
export class PettyCashVouchersService {
  private readonly logger = new Logger(PettyCashVouchersService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly eventEmitter: EventEmitter2,
    private readonly accountingEntriesService: AccountingEntriesService,
  ) {}

  async findAllByPagination(tenantId: string, dto?: FilterPettyCashVoucherDto) {
    const { page = 1, limit = 10, fundId, status, search = '' } = dto || {};
    const offset = (page - 1) * limit;

    const conditions = [
      eq(schema.pettyCashVouchers.tenantId, tenantId),
      ...(fundId ? [eq(schema.pettyCashVouchers.fundId, fundId)] : []),
      ...(status ? [eq(schema.pettyCashVouchers.status, status)] : []),
      ...(search
        ? [
            or(
              ilike(schema.pettyCashVouchers.beneficiaryName, `%${search}%`),
              ilike(schema.pettyCashVouchers.concept, `%${search}%`),
            ),
          ]
        : []),
    ];
    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.pettyCashVouchers)
      .where(whereClause);
    const totalCount = Number(totalResult.count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.db
      .select({
        id: schema.pettyCashVouchers.id,
        tenantId: schema.pettyCashVouchers.tenantId,
        fundId: schema.pettyCashVouchers.fundId,
        fundName: schema.pettyCashFunds.name,
        voucherNumber: schema.pettyCashVouchers.voucherNumber,
        beneficiaryName: schema.pettyCashVouchers.beneficiaryName,
        amount: schema.pettyCashVouchers.amount,
        concept: schema.pettyCashVouchers.concept,
        ticketImageUrl: schema.pettyCashVouchers.ticketImageUrl,
        voucherDate: schema.pettyCashVouchers.voucherDate,
        status: schema.pettyCashVouchers.status,
        expenseId: schema.pettyCashVouchers.expenseId,
        liquidatedAt: schema.pettyCashVouchers.liquidatedAt,
        createdAt: schema.pettyCashVouchers.createdAt,
      })
      .from(schema.pettyCashVouchers)
      .leftJoin(
        schema.pettyCashFunds,
        eq(schema.pettyCashFunds.id, schema.pettyCashVouchers.fundId),
      )
      .where(whereClause)
      .orderBy(sql`${schema.pettyCashVouchers.voucherDate} desc`)
      .limit(limit)
      .offset(offset);

    return {
      data: data.map((d) => ({ ...d, amount: Number(d.amount) })),
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
      .from(schema.pettyCashVouchers)
      .where(
        and(
          eq(schema.pettyCashVouchers.id, id),
          eq(schema.pettyCashVouchers.tenantId, tenantId),
        ),
      );
    if (!row) {
      throw new NotFoundException(`Vale de caja con ID ${id} no encontrado`);
    }
    return { ...row, amount: Number(row.amount) };
  }

  async create(
    userId: string,
    tenantId: string,
    dto: CreatePettyCashVoucherDto,
  ) {
    const result = await this.db.transaction(async (tx) => {
      const [fund] = await tx
        .select()
        .from(schema.pettyCashFunds)
        .where(
          and(
            eq(schema.pettyCashFunds.id, dto.fundId),
            eq(schema.pettyCashFunds.tenantId, tenantId),
            eq(schema.pettyCashFunds.isActive, true),
          ),
        );
      if (!fund) {
        throw new NotFoundException('Fondo fijo no encontrado');
      }
      if (dto.amount > Number(fund.currentBalance)) {
        throw new BadRequestException(
          'No hay saldo suficiente en el fondo para este vale',
        );
      }

      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(schema.pettyCashVouchers)
        .where(eq(schema.pettyCashVouchers.tenantId, tenantId));
      const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
      const voucherNumber = `VALE-${yearMonth}-${String(Number(count) + 1).padStart(4, '0')}`;

      const newBalance = Number(fund.currentBalance) - dto.amount;
      await tx
        .update(schema.pettyCashFunds)
        .set({
          currentBalance: String(newBalance),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.pettyCashFunds.id, fund.id));

      const [voucher] = await tx
        .insert(schema.pettyCashVouchers)
        .values({
          tenantId,
          fundId: fund.id,
          voucherNumber,
          beneficiaryName: dto.beneficiaryName,
          amount: String(dto.amount),
          concept: dto.concept,
          ticketImageUrl: dto.ticketImageUrl || null,
          status: 'OPEN',
          createdById: userId,
        })
        .returning();

      return voucher;
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'INSERT',
        tableName: 'petty_cash_vouchers',
        recordId: result.id,
        description: `Vale de caja emitido: ${result.voucherNumber} (${result.beneficiaryName})`,
        area: 'Expenses',
        newData: result,
        tenantId,
      }),
    );

    return { ...result, amount: Number(result.amount) };
  }

  async update(
    id: string,
    userId: string,
    tenantId: string,
    dto: UpdatePettyCashVoucherDto,
  ) {
    const voucher = await this.findOne(id, tenantId);
    if (voucher.status !== 'OPEN') {
      throw new BadRequestException(
        'Solo los vales abiertos pueden ser editados',
      );
    }

    const [updated] = await this.db
      .update(schema.pettyCashVouchers)
      .set({
        ...(dto.beneficiaryName !== undefined
          ? { beneficiaryName: dto.beneficiaryName }
          : {}),
        ...(dto.concept !== undefined ? { concept: dto.concept } : {}),
        ...(dto.amount !== undefined ? { amount: String(dto.amount) } : {}),
        ...(dto.ticketImageUrl !== undefined
          ? { ticketImageUrl: dto.ticketImageUrl || null }
          : {}),
        updatedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.pettyCashVouchers.id, id))
      .returning();

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'petty_cash_vouchers',
        recordId: id,
        description: `Vale de caja actualizado: ${updated.voucherNumber}`,
        area: 'Expenses',
        newData: updated,
        tenantId,
      }),
    );

    return { ...updated, amount: Number(updated.amount) };
  }

  // Anula el vale (devuelve el dinero al fondo)
  async voidVoucher(id: string, userId: string, tenantId: string) {
    const voucher = await this.findOne(id, tenantId);
    if (voucher.status !== 'OPEN') {
      throw new BadRequestException('Solo los vales abiertos pueden anularse');
    }

    const result = await this.db.transaction(async (tx) => {
      const [fund] = await tx
        .select()
        .from(schema.pettyCashFunds)
        .where(eq(schema.pettyCashFunds.id, voucher.fundId));
      if (!fund) {
        throw new NotFoundException('Fondo fijo no encontrado');
      }

      const newBalance = Number(fund.currentBalance) + Number(voucher.amount);
      await tx
        .update(schema.pettyCashFunds)
        .set({
          currentBalance: String(newBalance),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.pettyCashFunds.id, fund.id));

      await tx
        .delete(schema.pettyCashVouchers)
        .where(eq(schema.pettyCashVouchers.id, id));

      return {
        message: 'Vale anulado correctamente y saldo devuelto al fondo',
      };
    });

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'DELETE',
        tableName: 'petty_cash_vouchers',
        recordId: id,
        description: `Vale de caja anulado: ${voucher.voucherNumber}`,
        area: 'Expenses',
        previousData: voucher,
        tenantId,
      }),
    );

    return result;
  }

  // Liquida el vale: lo convierte en un gasto formal (ya descontado al emitir)
  async liquidate(
    id: string,
    userId: string,
    tenantId: string,
    dto: LiquidatePettyCashVoucherDto,
  ) {
    const voucher = await this.findOne(id, tenantId);
    if (voucher.status !== 'OPEN') {
      throw new BadRequestException('El vale ya fue liquidado');
    }

    const result = await this.db.transaction(async (tx) => {
      const [fund] = await tx
        .select()
        .from(schema.pettyCashFunds)
        .where(eq(schema.pettyCashFunds.id, voucher.fundId));
      if (!fund) {
        throw new NotFoundException('Fondo fijo no encontrado');
      }

      const [category] = await tx
        .select()
        .from(schema.expenseCategories)
        .where(
          and(
            eq(schema.expenseCategories.id, dto.categoryId),
            eq(schema.expenseCategories.tenantId, tenantId),
            eq(schema.expenseCategories.isActive, true),
          ),
        );
      if (!category) {
        throw new BadRequestException(
          'La categoría de gasto seleccionada no es válida',
        );
      }

      // El dinero ya salió del fondo al emitir el vale: el gasto nace aprobado
      const [expense] = await tx
        .insert(schema.expenses)
        .values({
          tenantId,
          costCenterId: null,
          categoryId: dto.categoryId,
          paymentSource: 'PETTY_CASH',
          pettyCashFundId: voucher.fundId,
          type: 'EXPRESS',
          paymentStatus: 'PAID',
          status: 'APPROVED',
          amountBase: String(voucher.amount),
          taxAmountBase: '0.0000',
          currencyCode: fund.currencyCode,
          exchangeRate: '1',
          receiptImageUrl: voucher.ticketImageUrl,
          description: dto.description || voucher.concept,
          createdById: userId,
          approvedByUserId: userId,
          approvedAt: new Date(),
        })
        .returning();

      const [updatedVoucher] = await tx
        .update(schema.pettyCashVouchers)
        .set({
          status: 'LIQUIDATED',
          expenseId: expense.id,
          liquidatedAt: new Date(),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(schema.pettyCashVouchers.id, voucher.id))
        .returning();

      void round;
      return { voucher: updatedVoucher, expense };
    });

    // Asiento contable (idéntico al flujo de gastos, tolerante a fallos)
    try {
      await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'expenses',
          submodule: 'petty-cash-vouchers',
          category: 'ADMINISTRATIVE',
          operationType: 'EXPENSE',
          description: `Vale liquidado: ${result.voucher.voucherNumber} - ${voucher.beneficiaryName}`,
          entryDate: new Date(),
          autoPostKey: 'AUTO_POST_ENTRY_EXPENSES',
          currencyCode: result.expense.currencyCode as CurrencyCodeEnum,
          exchangeRate: 1,
          originReferenceId: result.expense.id,
          originType: 'EXPENSE',
          globalDescriptions: { EXPENSE_AMOUNT: result.expense.description },
          roleAliases: { EXPENSE_AMOUNT: 'TOTAL' },
          items: [
            {
              supplierId: undefined,
              amounts: {
                EXPENSE_AMOUNT: Number(result.expense.amountBase),
                EXPENSE_TAX: 0,
                TOTAL_AMOUNT: Number(result.expense.amountBase),
                VAT_WITHHOLDING: 0,
                ISLR_WITHHOLDING: 0,
              },
              description: result.expense.description,
              descriptions: {
                EXPENSE_AMOUNT: result.expense.description,
                TOTAL_AMOUNT: result.expense.description,
              },
            },
          ],
        },
      );
    } catch (error) {
      this.logger.warn(
        `Asiento contable omitido para el vale ${voucher.voucherNumber}: ${(error as Error).message}`,
      );
    }

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'petty_cash_vouchers',
        recordId: result.voucher.id,
        description: `Vale liquidado como gasto: ${result.voucher.voucherNumber}`,
        area: 'Expenses',
        newData: result,
        tenantId,
      }),
    );

    return result;
  }
}
