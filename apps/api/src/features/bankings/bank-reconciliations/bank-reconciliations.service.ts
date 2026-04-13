import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { eq, and, sql } from 'drizzle-orm';
import { CreateBankReconciliationDto } from './dto/create-bank-reconciliation.dto';
import { AddReconciliationDetailDto } from './dto/add-reconciliation-detail.dto';
import { FilterBankReconciliationDto } from './dto/filter-bank-reconciliation.dto';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';

@Injectable()
export class BankReconciliationsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly accountingEntriesService: AccountingEntriesService,
  ) {}

  async create(
    createDto: CreateBankReconciliationDto,
    userId: number,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;

    const [bankAccount] = await db
      .select({
        id: schema.bankAccounts.id,
        currentBalance: schema.bankAccounts.currentBalance,
      })
      .from(schema.bankAccounts)
      .where(eq(schema.bankAccounts.id, createDto.bankAccountId));

    if (!bankAccount) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    const [reconciliation] = await db
      .insert(schema.bankReconciliations)
      .values({
        bankAccountId: createDto.bankAccountId,
        statementDate: createDto.statementDate.toISOString(),
        statementEndingBalance: createDto.statementEndingBalance.toString(),
        bookBalanceBefore: bankAccount.currentBalance?.toString() ?? '0',
        preparedByUserId: userId,
        notes: createDto.notes,
        status: 'IN_PROGRESS' as any,
      })
      .returning();

    return reconciliation;
  }

  async addDetail(
    reconciliationId: number,
    detailDto: AddReconciliationDetailDto,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.drizzle;

    const [recon] = await db
      .select()
      .from(schema.bankReconciliations)
      .where(eq(schema.bankReconciliations.id, reconciliationId));

    if (!recon) throw new NotFoundException('Conciliación no encontrada');
    if (recon.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Solo se pueden editar conciliaciones EN PROGRESO',
      );
    }

    const [insertedDetail] = await db
      .insert(schema.bankReconciliationDetails)
      .values({
        bankReconciliationId: reconciliationId,
        bankTransactionId: detailDto.bankTransactionId,
        accountingEntryDetailId: detailDto.accountingEntryDetailId,
        adjustmentType: detailDto.adjustmentType,
        adjustmentAmount: detailDto.adjustmentAmount?.toString(),
        description: detailDto.description,
        isBookAdjustment: detailDto.isBookAdjustment,
      })
      .returning();

    return insertedDetail;
  }

  async processAndComplete(reconciliationId: number, userId: number) {
    return this.drizzle.transaction(async (tx) => {
      const [recon] = await tx
        .select()
        .from(schema.bankReconciliations)
        .where(eq(schema.bankReconciliations.id, reconciliationId))
        .for('update');

      if (!recon) throw new NotFoundException('Conciliación no encontrada');
      if (recon.status !== 'IN_PROGRESS') {
        throw new BadRequestException('La conciliación no está en progreso');
      }

      // Obtener todos los detalles para verificar diferencias y asientos contables requeridos
      const details = await tx
        .select()
        .from(schema.bankReconciliationDetails)
        .where(
          eq(schema.bankReconciliationDetails.bankReconciliationId, reconciliationId),
        );

      let totalBookAdjustments = 0;

      for (const d of details) {
        if (d.isBookAdjustment && d.adjustmentAmount) {
          const amount = Number(d.adjustmentAmount);
          totalBookAdjustments += amount;

          // Integración con AccountingEntriesService iría aquí...
          // await this.accountingEntriesService.createAutomaticEntry(userId, {...}, tx);
        }
      }

      const bookBalanceBefore = Number(recon.bookBalanceBefore);
      const bookBalanceAfter = bookBalanceBefore + totalBookAdjustments;
      const statementEnding = Number(recon.statementEndingBalance);

      // Calculamos diferencia: Saldo libros final - Saldo según banco + Tránsitos/Ajustes
      // Por simplicidad en este placeholder, si statements == book balance está cuadrada
      // Se requiere la formula de conciliacion exacta según la entidad
      const difference = statementEnding - bookBalanceAfter; // Idealmente = 0

      if (Math.abs(difference) > 0.01) {
        throw new BadRequestException(
          `No se puede completar. Existe una diferencia (descuadre) de ${difference}. Ajuste o registre debidamente las partidas en tránsito.`,
        );
      }

      await tx
        .update(schema.bankReconciliations)
        .set({
          status: 'COMPLETED' as any,
          bookBalanceAfter: bookBalanceAfter.toString(),
          difference: difference.toString(),
          reconciliationDate: new Date(),
          reviewedByUserId: userId,
        })
        .where(eq(schema.bankReconciliations.id, reconciliationId));

      // Actualizar el bankAccounts con el saldo en libros verificado si es necesario
      await tx
        .update(schema.bankAccounts)
        .set({ currentBalance: bookBalanceAfter.toString() })
        .where(eq(schema.bankAccounts.id, recon.bankAccountId));

      return {
        message: 'Conciliación bancaria completada exitosamente',
        difference,
        bookBalanceAfter,
      };
    });
  }

  async findAll(bankAccountId?: number) {
    const conditions = bankAccountId
      ? eq(schema.bankReconciliations.bankAccountId, bankAccountId)
      : undefined;

    return this.drizzle
      .select()
      .from(schema.bankReconciliations)
      .where(conditions)
      .orderBy(sql`${schema.bankReconciliations.createdAt} desc`);
  }

  async findAllByPagination(filterDto?: FilterBankReconciliationDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'desc',
      bankAccountId,
      status,
    } = filterDto || {};

    const offset = (page - 1) * limit;

    let searchCondition: any = undefined;

    if (bankAccountId) {
      searchCondition = eq(schema.bankReconciliations.bankAccountId, Number(bankAccountId));
    }

    if (status) {
      searchCondition = searchCondition
        ? and(searchCondition, eq(schema.bankReconciliations.status, status as any))
        : eq(schema.bankReconciliations.status, status as any);
    }

    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.bankReconciliations[sortBy as keyof typeof schema.bankReconciliations]} asc`
        : sql`${schema.bankReconciliations[sortBy as keyof typeof schema.bankReconciliations]} desc`;

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(schema.bankReconciliations)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.drizzle
      .select()
      .from(schema.bankReconciliations)
      .where(searchCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const meta = {
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? Number(page) + 1 : null,
      previousPage: page > 1 ? Number(page) - 1 : null,
    };

    return {
      data,
      meta,
    };
  }

  async findOne(id: number) {
    const [recon] = await this.drizzle
      .select()
      .from(schema.bankReconciliations)
      .where(eq(schema.bankReconciliations.id, id));

    if (!recon) throw new NotFoundException('Conciliación no encontrada');

    const details = await this.drizzle
      .select()
      .from(schema.bankReconciliationDetails)
      .where(
        eq(
          schema.bankReconciliationDetails.bankReconciliationId,
          id,
        ),
      );

    return { ...recon, details };
  }
}
