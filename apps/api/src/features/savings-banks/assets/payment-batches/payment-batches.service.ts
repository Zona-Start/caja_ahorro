import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { paymentBatches, paymentBatchItems } from '@/database/index';
import { AuditLogsService } from '@/features/audit/audit-logs/audit-logs.service';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  ActionEnumAudit,
  AssociateMovementTypeEnum,
  CurrencyCodeEnum,
  paymentBatchItemStatus,
  paymentBatchItemType,
  paymentBatchStatus,
  paymentMethodEnum,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { format } from 'date-fns';
import { and, eq, ilike, inArray, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import { ConfirmPaymentBatchDto } from './dto/confirm-payment-batch.dto';
import { CreatePaymentBatchDto } from './dto/create-payment-batch.dto';
import { CreateSinglePaymentBatchItemDto } from './dto/create-single-payment-batch-item.dto';
import { FilterPaymentBatchDto } from './dto/filter-payment-batch.dto';

@Injectable()
export class PaymentBatchesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly assocMvts: AssociateAccountsMovementsService,
    private readonly bankMvts: BankMovementsService,
    private readonly audit: AuditLogsService,
  ) {}

  async create(dto: CreatePaymentBatchDto, userId: number) {
    return this.db.transaction(async (tx) => {
      const { bankAccountId, currencyCode, items } = dto;

      // 1. Cuenta bancaria existe y moneda coincide
      const bankAcc = await tx.query.bankAccounts.findFirst({
        where: eq(schema.bankDirectory.id, bankAccountId),
      });
      if (!bankAcc)
        throw new NotFoundException('Cuenta bancaria no encontrada');
      if (bankAcc.currencyCode !== currencyCode)
        throw new BadRequestException(
          'Moneda de cuenta diferente a la del lote',
        );

      let totalAmount = 0;
      const lines: (typeof schema.paymentBatchItems.$inferInsert)[] = [];

      for (const it of items) {
        let rec: any, net: number, assocAccId: number, curr: string;

        switch (it.type) {
          case paymentBatchItemType.LOAN:
            rec = await tx.query.loans.findFirst({
              where: eq(schema.loans.id, it.sourceId),
              with: { associate: true, disbursementAccount: true },
            });
            if (!rec || rec.status !== 'APPROVED')
              throw new BadRequestException(
                `Préstamo ${it.sourceId} no aprobado`,
              );
            net = Number(rec.approvedAmount) - Number(rec.expensesAmount ?? 0);
            assocAccId = rec.disbursementAccountId;
            curr = rec.currencyCode;
            break;

          case paymentBatchItemType.WITHDRAWAL:
            rec = await tx.query.withdrawalsAssociates.findFirst({
              where: eq(schema.withdrawalsAssociates.id, it.sourceId),
              with: { associateAccount: { with: { associate: true } } },
            });
            if (!rec || rec.status !== 'APPROVED')
              throw new BadRequestException(
                `Retiro ${it.sourceId} no aprobado`,
              );
            net = Number(rec.disbursedAmount);
            assocAccId = rec.associateAccountId;
            curr = rec.currencyCode;
            break;

          case paymentBatchItemType.LIQUIDATION:
            rec = await tx.query.liquidationsAssociates.findFirst({
              where: eq(schema.liquidationsAssociates.id, it.sourceId),
              with: { associate: true },
            });
            if (!rec || rec.status !== 'APPROVED')
              throw new BadRequestException(
                `Liquidación ${it.sourceId} no aprobada`,
              );
            net = Number(rec.netLiquidationAmount);
            // Para liquidaciones tomamos la cuenta principal del asociado
            const mainAcc = await tx.query.associateAccounts.findFirst({
              where: eq(schema.associateAccounts.associateId, rec.associateId),
              orderBy: (acc, { asc }) => asc(acc.id),
            });
            if (!mainAcc) throw new BadRequestException('Asociado sin cuenta');
            assocAccId = mainAcc.id;
            curr = rec.currencyCode;
            break;

          default:
            throw new BadRequestException('Tipo de ítem inválido');
        }

        if (curr !== currencyCode)
          throw new BadRequestException(
            `Moneda diferente en ${it.type} ${it.sourceId}`,
          );

        // Único en lotes no finalizados
        const dup = await tx.query.paymentBatchItems.findFirst({
          where: and(
            eq(schema.paymentBatchItems.sourceId, it.sourceId),
            eq(schema.paymentBatchItems.itemType, it.type),
            sql`${schema.paymentBatchItems.paymentBatchId} in (select id from ${schema.paymentBatches} where status not in ('PROCESSED','CANCELLED'))`,
          ),
        });
        if (dup)
          throw new BadRequestException(
            `${it.type} ${it.sourceId} ya está en otro lote activo`,
          );

        // Cuenta verificada
        const assocAcc = await tx
          .select()
          .from(schema.associateAccounts)
          .leftJoin(
            schema.associates,
            eq(schema.associateAccounts.associateId, schema.associates.id),
          )
          .where(eq(schema.associateAccounts.id, assocAccId));

        if (assocAcc.length === 0)
          throw new BadRequestException('Cuenta asociado no encontrada');
        if (assocAcc[0].associate_accounts.status !== 'ACTIVE')
          throw new BadRequestException(
            `Cuenta ${assocAcc[0].associate_accounts.accountNumber} no está verificada`,
          );

        totalAmount += net;
        lines.push({
          paymentBatchId: 0, // se rellena después
          itemType: it.type,
          sourceId: it.sourceId,
          associateAccountId: assocAccId,
          beneficiaryAccountNumber:
            assocAcc[0].associate_accounts.accountNumber,
          beneficiaryAccountType: 'CORRIENTE',
          beneficiaryId: String(assocAcc[0].associates?.id),
          beneficiaryName: assocAcc[0].associates?.fullname ?? '',
          amount: net.toFixed(4),
          status: paymentBatchItemStatus.PENDING,
        });
      }

      // Insertar cabecera
      const [batch] = await tx
        .insert(schema.paymentBatches)
        .values({
          companyId: 1, // TODO: desde contexto
          bankId: bankAccountId,
          currencyCode,
          recordCount: lines.length,
          totalAmount: totalAmount.toFixed(4),
          status: paymentBatchStatus.DRAFT,
          description: dto.description ?? 'Lote automático',
          createdById: userId,
        })
        .returning();

      // Insertar líneas con batchId
      if (lines.length) {
        await tx
          .insert(schema.paymentBatchItems)
          .values(lines.map((l) => ({ ...l, paymentBatchId: batch.id })));
      }

      return {
        id: batch.id,
        recordCount: batch.recordCount,
        totalAmount: batch.totalAmount,
      };
    });
  }

  async createSingleItem(dto: CreateSinglePaymentBatchItemDto, userId: number) {
    // Construye DTO masivo de 1 ítem y reusa create()
    const massDto: CreatePaymentBatchDto = {
      bankAccountId: dto.bankAccountId,
      currencyCode: dto.currencyCode,
      description: 'Desembolso individual',
      items: [{ type: dto.type, sourceId: dto.sourceId }],
    };
    const batch = await this.create(massDto, userId);
    return { batchId: batch.id };
  }

  async generateTxtFile(
    batchId: number,
  ): Promise<{ fileName: string; content: string }> {
    const batch = await this.db
      .select()
      .from(schema.paymentBatches)
      .leftJoin(
        schema.bankAccounts,
        eq(schema.paymentBatches.bankId, schema.bankAccounts.id),
      )
      .where(eq(schema.paymentBatches.id, batchId));

    if (batch.length === 0) throw new NotFoundException('Lote no encontrado');
    if (batch[0].payment_batches.status !== paymentBatchStatus.UPLOADED)
      throw new BadRequestException('Lote debe estar en estado UPLOADED');

    const items = await this.db.query.paymentBatchItems.findMany({
      where: eq(schema.paymentBatchItems.paymentBatchId, batchId),
    });

    if (!items.length) throw new BadRequestException('Lote sin ítems');

    /* ----------  HELPER: right-zero-fill  ---------- */
    const rzf = (n: number | string, len: number) =>
      String(n).padStart(len, '0').slice(-len);

    const now = new Date();
    const fecha = format(now, 'yyyyMMdd'); // AAAAMMDD
    const total = Number(batch[0].payment_batches.totalAmount) * 100; // centavos sin decimales
    const qty = items.length;

    /* ----------  HEADER  (57 posiciones)  ---------- */
    let content = '';
    content += '10'; // 01-02  ID registro fijo
    content += rzf(1, 6); // 03-08  Nro. de afiliado (ej. 1)
    content += rzf(batch[0]?.bank_accounts?.accountNumber ?? '', 20).slice(
      0,
      20,
    ); // 09-28  Cuenta a debitar (20 num)
    content += fecha; // 29-36  Fecha del pago
    content += rzf(qty, 6); // 37-42  Cantidad de registros
    content += rzf(total, 15); // 43-57  Monto total (13+2 sin punto)
    content += '\n';

    /* ----------  DETAIL  (47 posiciones)  ---------- */
    for (const it of items) {
      const cents = Number(it.amount) * 100; // centavos
      const idType = it.beneficiaryId.charAt(0).toUpperCase(); // V/E/P
      const idNum = it.beneficiaryId.substring(1); // sin la letra

      let line = '';
      line += '20'; // 01-02  ID registro fijo
      line += idType; // 03-03  Tipo de identificación
      line += rzf(idNum, 9); // 04-12  Número de identificación
      line += rzf(it.beneficiaryAccountNumber, 20).slice(0, 20); // 13-32  Cuenta beneficiario
      line += rzf(cents, 15); // 33-47  Monto a pagar (13+2)
      content += line + '\n';
    }

    /* ----------  FILE NAME  ---------- */
    const fileName = `${format(now, 'yyyyMMdd-HHmmss')}-${batchId}.txt`;
    await this.db
      .update(schema.paymentBatches)
      .set({ bankFileName: fileName })
      .where(eq(schema.paymentBatches.id, batchId));

    return { fileName, content };
  }

  async confirm(batchId: number, dto: ConfirmPaymentBatchDto, userId: number) {
    return this.db.transaction(async (tx) => {
      const batch = await tx.query.paymentBatches.findFirst({
        where: eq(schema.paymentBatches.id, batchId),
      });

      if (!batch) throw new NotFoundException('Lote no encontrado');
      if (batch.status !== paymentBatchStatus.UPLOADED)
        throw new BadRequestException('Lote no está UPLOADED');

      const items = await tx.query.paymentBatchItems.findMany({
        where: eq(schema.paymentBatchItems.paymentBatchId, batchId),
      });

      let allRejected = true;

      for (const it of items) {
        const res = dto.items.find((i) => i.itemId === it.id);
        if (!res)
          throw new BadRequestException(`Falta resultado para ítem ${it.id}`);

        await tx
          .update(schema.paymentBatchItems)
          .set({
            status:
              res.status === 'PROCESSED'
                ? paymentBatchItemStatus.PROCESSED
                : paymentBatchItemStatus.REJECTED,
            rejectionReason: res.reason ?? null,
          })
          .where(eq(schema.paymentBatchItems.id, it.id));

        if (res.status === 'PROCESSED') {
          allRejected = false;

          // 1. Movimiento de banco (egreso)
          await this.bankMvts.create(
            {
              bankAccountId: Number(batch.bankId),
              transactionDate: new Date(dto.processedAt).toISOString(),
              description: `Lote ${batchId}`,
              debitAmount: Number(it.amount), // <--- usar solo efectivo saliente
              bankReference: dto.bankReference ?? undefined,
              transactionType: paymentMethodEnum.BANK_TRANSFER,
              category: 'INTERNAL_TRANSFER',
              createdById: userId,
            },
            userId,
            tx,
          );

          // 2. Movimiento interno (crédito a asociado)
          await this.assocMvts.create(userId, {
            associateAccountId: it.associateAccountId as number,
            movementType: paymentBatchItemType.LOAN
              ? AssociateMovementTypeEnum.LOAN_DISBURSEMENT_CREDIT
              : AssociateMovementTypeEnum.SAVING_WITHDRAWAL,
            amount: Number(it.amount),
            currencyCode: batch.currencyCode as CurrencyCodeEnum,
            transactionDate: new Date(),
            description: `DESEMBOLSO - REF: ${dto.bankReference}`,
            referenceId: String(batchId),
            referenceType: 'payment_batch',
            referenceNumber: dto.bankReference ?? undefined,
            area: 'HABERES',
          });

          // 3. Cambiar estado del origen
          switch (it.itemType) {
            case paymentBatchItemType.LOAN:
              await tx
                .update(schema.loans)
                .set({ status: 'DISBURSED' })
                .where(eq(schema.loans.id, it.sourceId));
              break;
            case paymentBatchItemType.WITHDRAWAL:
              await tx
                .update(schema.withdrawalsAssociates)
                .set({ status: 'DISBURSED' })
                .where(eq(schema.withdrawalsAssociates.id, it.sourceId));
              break;
            case paymentBatchItemType.LIQUIDATION:
              await tx
                .update(schema.liquidationsAssociates)
                .set({ status: 'PROCESSED' })
                .where(eq(schema.liquidationsAssociates.id, it.sourceId));
              break;
          }
        }
      }

      // 4. Actualizar cabecera
      const finalStatus = allRejected
        ? paymentBatchStatus.CANCELLED
        : paymentBatchStatus.PROCESSED;
      await tx
        .update(schema.paymentBatches)
        .set({
          status: finalStatus,
          bankReference: dto.bankReference ?? null,
          processedAt: new Date(dto.processedAt),
        })
        .where(eq(schema.paymentBatches.id, batchId));

      // 5. Auditoría
      await this.audit.create(
        {
          action: 'UPDATE' as ActionEnumAudit,
          area: 'PRESTAMOS',
          description: 'PAGOS MASIVOS',
          recordId: String(batchId),
          tableName: 'payment_batches',
          userId: Number(userId),
          newData: [finalStatus],
        },
        tx,
      );
    });
  }

  async cancel(batchId: number, userId: number) {
    const batch = await this.db.query.paymentBatches.findFirst({
      where: eq(schema.paymentBatches.id, batchId),
    });
    if (!batch) throw new NotFoundException('Lote no encontrado');
    if (!['DRAFT', 'UPLOADED'].includes(batch.status))
      throw new BadRequestException(
        'Solo se puede anular un lote en borrador o subido',
      );

    await this.db
      .update(schema.paymentBatches)
      .set({ status: paymentBatchStatus.CANCELLED })
      .where(eq(schema.paymentBatches.id, batchId));

    await this.audit.create({
      action: 'CANCELED' as ActionEnumAudit,
      area: 'HABERES',
      description: 'PAGOS MASIVOS',
      recordId: String(batchId),
      tableName: 'payment_batches',
      userId: Number(userId),
    });
  }

  // payment-batches.service.ts

  async markAsUploaded(batchId: number, userId: number) {
    const batch = await this.db.query.paymentBatches.findFirst({
      where: eq(schema.paymentBatches.id, batchId),
    });
    if (!batch) throw new NotFoundException('Lote no encontrado');
    if (batch.status !== paymentBatchStatus.DRAFT)
      throw new BadRequestException(
        'Solo se puede marcar como subido un lote en borrador',
      );

    const [updated] = await this.db
      .update(schema.paymentBatches)
      .set({ status: paymentBatchStatus.UPLOADED })
      .where(eq(schema.paymentBatches.id, batchId))
      .returning();

    await this.audit.create({
      action: 'PROCESS_EXECUTION' as ActionEnumAudit,
      area: 'HABERES',
      description: 'PAGOS MASIVOS',
      recordId: String(batchId),
      tableName: 'payment_batches',
      userId: Number(userId),
    });
    return updated;
  }

  async findAll(dto: FilterPaymentBatchDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      status,
    } = dto || {};

    const offset = (page - 1) * limit;

    /* ---------- 1. Filtros ---------- */
    const conditions: SQL<unknown>[] = [];

    if (status) {
      conditions.push(eq(paymentBatches.status, status));
    }

    if (search) {
      conditions.push(
        sql`(${ilike(paymentBatches.description, `%${search}%`)} or ${ilike(
          paymentBatches.bankReference,
          `%${search}%`,
        )})`,
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    /* ---------- 2. Total de registros ---------- */
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(paymentBatches)
      .where(where);

    const totalCount = Number(count);
    const totalPages = Math.ceil(totalCount / limit);

    /* ---------- 3. Orden dinámico ---------- */
    const orderBy =
      sortOrder === 'asc'
        ? sql`${paymentBatches[sortBy as keyof typeof paymentBatches]} asc`
        : sql`${paymentBatches[sortBy as keyof typeof paymentBatches]} desc`;

    /* ---------- 4. Query principal con LEFT JOINs ---------- */
    const rows = await this.db
      .select({
        // ── Cabecera
        id: paymentBatches.id,
        companyId: paymentBatches.companyId,
        description: paymentBatches.description,
        status: paymentBatches.status,
        recordCount: paymentBatches.recordCount,
        totalAmount: paymentBatches.totalAmount,
        currencyCode: paymentBatches.currencyCode,
        bankId: paymentBatches.bankId,
        bankFileName: paymentBatches.bankFileName,
        bankReference: paymentBatches.bankReference,
        processedAt: paymentBatches.processedAt,
        createdAt: paymentBatches.createdAt,
        updatedAt: paymentBatches.updatedAt,

        // ── Relación banco (object)
        bankIdRel: schema.bankAccounts.id,
        bankName: schema.bankAccounts.accountName,
        bankAccountNumber: schema.bankAccounts.accountNumber,
        bankCurrencyCode: schema.bankAccounts.currencyCode,
      })
      .from(paymentBatches)
      .where(where)
      .leftJoin(
        schema.bankAccounts,
        eq(schema.bankAccounts.id, paymentBatches.bankId),
      )
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    /* ---------- 5. Cargar ítems en bloque (opción 1) ---------- */
    const batchIds = rows.map((r) => r.id);
    const allItems = batchIds.length
      ? await this.db
          .select()
          .from(paymentBatchItems)
          .where(inArray(paymentBatchItems.paymentBatchId, batchIds))
      : [];

    /* ---------- 6. Armamos objeto "bank" y "items" por fila ---------- */
    const data = rows.map((row) => ({
      ...row,
      // Monto como string con 2 decimales
      totalAmount: Number(row.totalAmount).toFixed(2),
      // Relación banco
      bank: row.bankIdRel
        ? {
            id: row.bankIdRel,
            name: row.bankName,
            accountNumber: row.bankAccountNumber,
            currencyCode: row.bankCurrencyCode,
          }
        : undefined,
      // Ítems que le corresponden
      items: allItems.filter((it) => it.paymentBatchId === row.id),
    }));

    /* ---------- 7. Meta ---------- */
    const meta = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data, meta };
  }
}
