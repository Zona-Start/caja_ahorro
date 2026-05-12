import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import {
  paymentBatchItemStatus,
  paymentBatchItemType,
  paymentBatchStatus,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { format } from 'date-fns';
import { and, eq, ilike, inArray, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { SettlementAssociateService } from '../../settlement/settlement-associate.service';
import { WithdrawalAssociateService } from '../../withdrawalls/withdrawal-associate/withdrawal-associate.service';
import {
  ConfirmPaymentBatchDto,
  CreatePaymentBatchDto,
  CreateSinglePaymentBatchItemDto,
  FilterPaymentBatchDto,
} from './dto/payment-batches.schema';

@Injectable()
export class PaymentBatchesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
    private readonly eventEmitter: EventEmitter2,
    private readonly withdrawService: WithdrawalAssociateService,
    private readonly settlementService: SettlementAssociateService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreatePaymentBatchDto) {
    return this.db.transaction(async (tx) => {
      const { bankAccountId, currencyCode, items } = dto;

      const bankAcc = await tx.query.bankAccounts.findFirst({
        where: and(
          eq(schema.bankAccounts.id, bankAccountId),
          eq(schema.bankAccounts.tenantId, tenantId),
        ),
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
        let rec: any,
          net: number,
          assocAccId: string,
          curr: string,
          assocCedula: string,
          assocNationality: string;

        switch (it.type) {
          case paymentBatchItemType.WITHDRAWAL:
            rec = await tx
              .select({
                status: schema.withdrawalsAssociates.status,
                disbursedAmount: schema.withdrawalsAssociates.disbursedAmount,
                disbursementAccountId: schema.associateAccounts.id,
                associateNationality: schema.associates.nationality,
                associateCedula: schema.associates.cedula,
              })
              .from(schema.withdrawalsAssociates)
              .leftJoin(
                schema.associateAccounts,
                eq(
                  schema.associateAccounts.id,
                  schema.withdrawalsAssociates.associateAccountId,
                ),
              )
              .leftJoin(
                schema.associates,
                eq(schema.associates.id, schema.associateAccounts.associateId),
              )
              .where(
                and(
                  eq(schema.withdrawalsAssociates.id, it.sourceId),
                  eq(schema.withdrawalsAssociates.tenantId, tenantId),
                ),
              );

            if (rec.length === 0 || rec[0].status !== 'APPROVED')
              throw new BadRequestException(
                `Retiro ${it.sourceId} no aprobado`,
              );
            net = Number(rec[0].disbursedAmount);
            assocAccId = rec[0].disbursementAccountId;
            assocNationality = rec[0].associateNationality?.[0] || '';
            assocCedula = `${assocNationality}${rec[0].associateCedula}`;
            curr = 'VES';
            break;

          case paymentBatchItemType.LIQUIDATION:
            rec = await tx
              .select({
                status: schema.liquidationsAssociates.status,
                netLiquidationAmount:
                  schema.liquidationsAssociates.netLiquidationAmount,
                disbursementAccountId: schema.associateAccounts.id,
                currencyCode: schema.liquidationsAssociates.currencyCode,
                associateNationality: schema.associates.nationality,
                associateCedula: schema.associates.cedula,
              })
              .from(schema.liquidationsAssociates)
              .leftJoin(
                schema.associates,
                eq(
                  schema.associates.id,
                  schema.liquidationsAssociates.associateId,
                ),
              )
              .leftJoin(
                schema.associateAccounts,
                eq(schema.associateAccounts.associateId, schema.associates.id),
              )
              .where(
                and(
                  eq(schema.liquidationsAssociates.id, it.sourceId),
                  eq(schema.liquidationsAssociates.tenantId, tenantId),
                ),
              );

            if (rec.length === 0 || rec[0].status !== 'APPROVED')
              throw new BadRequestException(
                `Liquidación ${it.sourceId} no aprobada`,
              );
            net = Number(rec[0].netLiquidationAmount);
            assocNationality = rec[0].associateNationality?.[0] || '';
            assocCedula = `${assocNationality}${rec[0].associateCedula}`;
            assocAccId = rec[0].disbursementAccountId;
            curr = 'VES';
            break;

          default:
            throw new BadRequestException(
              `Tipo de ítem inválido: ${it.type}. Este lote solo admite WITHDRAWAL y LIQUIDATION.`,
            );
        }

        if (curr !== currencyCode)
          throw new BadRequestException(
            `Moneda diferente en ${it.type} ${it.sourceId}`,
          );

        const dup = await tx.query.paymentBatchItems.findFirst({
          where: and(
            eq(schema.paymentBatchItems.sourceId, it.sourceId),
            eq(schema.paymentBatchItems.itemType, it.type),
            sql`${schema.paymentBatchItems.paymentBatchId} in (select id from ${schema.paymentBatches} where status not in ('PROCESSED','CANCELLED') and ${schema.paymentBatches.tenantId} = ${tenantId})`,
          ),
        });

        if (dup)
          throw new BadRequestException(
            `${it.type} ${it.sourceId} ya está en otro lote activo`,
          );

        const assocAcc = await tx
          .select()
          .from(schema.associateAccounts)
          .innerJoin(
            schema.associates,
            and(
              eq(schema.associateAccounts.associateId, schema.associates.id),
              eq(schema.associates.tenantId, tenantId),
            ),
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
          paymentBatchId: '0',
          itemType: it.type,
          sourceId: it.sourceId,
          associateAccountId: assocAccId,
          beneficiaryAccountNumber:
            assocAcc[0].associate_accounts.accountNumber,
          beneficiaryAccountType: 'CORRIENTE',
          beneficiaryId: assocCedula,
          beneficiaryName: assocAcc[0].associates?.fullname ?? '',
          amount: net.toFixed(4),
          status: paymentBatchItemStatus.PENDING,
        } as any);
      }

      const [batch] = await tx
        .insert(schema.paymentBatches)
        .values({
          tenantId,
          bankId: bankAccountId,
          bankFileName: bankAcc.accountName,
          currencyCode,
          recordCount: lines.length,
          totalAmount: totalAmount.toFixed(4),
          status: paymentBatchStatus.DRAFT,
          description: dto.description ?? 'Lote automático',
          createdById: userId,
          batchType: 'PAYMENT',
          paymentBatchReference:
            await this.generateCodeService.generateNextReference(
              'LOT-P',
              tenantId,
              'savings',
              'payment_batches',
              tx,
            ),
        } as any)
        .returning();

      if (lines.length) {
        await tx
          .insert(schema.paymentBatchItems)
          .values(lines.map((l) => ({ ...l, paymentBatchId: batch.id })));
      }

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          userId,
          action: 'INSERT',
          tableName: 'payment_batches',
          recordId: String(batch.id),
          description: `Creación de Lote de Pago: ${batch.paymentBatchReference}`,
          area: 'Caja de Ahorro',
          newData: [batch],
          tenantId,
        }),
      );

      return {
        id: batch.id,
        recordCount: batch.recordCount,
        totalAmount: batch.totalAmount,
      };
    });
  }

  async createSingleItem(
    tenantId: string,
    userId: string,
    dto: CreateSinglePaymentBatchItemDto,
  ) {
    const massDto: CreatePaymentBatchDto = {
      bankAccountId: dto.bankAccountId,
      currencyCode: dto.currencyCode,
      description: 'Desembolso individual',
      items: [{ type: dto.type, sourceId: dto.sourceId }],
    };
    const batch = await this.create(tenantId, userId, massDto);
    return { batchId: batch.id };
  }

  async generateTxtFile(
    batchId: string,
    tenantId: string,
  ): Promise<{ fileName: string; content: string }> {
    const batch = await this.db
      .select()
      .from(schema.paymentBatches)
      .leftJoin(
        schema.bankAccounts,
        eq(schema.paymentBatches.bankId, schema.bankAccounts.id),
      )
      .where(
        and(
          eq(schema.paymentBatches.id, batchId),
          eq(schema.paymentBatches.tenantId, tenantId),
        ),
      );

    const codeBank = await this.db
      .select()
      .from(schema.moduleSettings)
      .where(
        and(
          eq(schema.moduleSettings.tenantId, tenantId),
          eq(schema.moduleSettings.module, 'banking'),
          eq(schema.moduleSettings.submodule, 'transactions'),
          eq(schema.moduleSettings.key, 'BATCH_TRANSACTION_BANK_CODE'),
        ),
      );

    if (batch.length === 0) throw new NotFoundException('Lote no encontrado');
    if (batch[0].payment_batches.status !== paymentBatchStatus.UPLOADED)
      throw new BadRequestException('Lote debe estar en estado UPLOADED');

    const items = await this.db.query.paymentBatchItems.findMany({
      where: eq(schema.paymentBatchItems.paymentBatchId, batchId),
    });

    if (!items.length) throw new BadRequestException('Lote sin ítems');

    const rzf = (n: number | string, len: number) =>
      String(n).padStart(len, '0').slice(-len);

    const now = new Date();
    const fecha = format(now, 'yyyyMMdd');
    const total = Number(batch[0].payment_batches.totalAmount) * 100;
    const qty = items.length;

    let content = '';
    content += '10';
    content += codeBank[0].value ?? '0';
    content += rzf(batch[0]?.bank_accounts?.accountNumber ?? '', 20).slice(
      0,
      20,
    );
    content += fecha;
    content += rzf(qty, 6);
    content += rzf(total, 15);
    content += '\n';

    for (const it of items) {
      const cents = Number(it.amount) * 100;
      const idType = it.beneficiaryId.charAt(0).toUpperCase();
      const idNum = it.beneficiaryId.substring(1);

      let line = '';
      line += '20';
      line += idType;
      line += rzf(idNum, 9);
      line += rzf(it.beneficiaryAccountNumber, 20).slice(0, 20);
      line += rzf(cents, 15);
      content += line + '\n';
    }

    const fileName = `${format(now, 'yyyyMMdd-HHmmss')}-${batchId}.txt`;
    await this.db
      .update(schema.paymentBatches)
      .set({ bankFileName: fileName })
      .where(
        and(
          eq(schema.paymentBatches.id, batchId),
          eq(schema.paymentBatches.tenantId, tenantId),
        ),
      );

    return { fileName, content };
  }

  async confirm(
    id: string,
    dto: ConfirmPaymentBatchDto,
    userId: string,
    tenantId: string,
  ) {
    return this.db.transaction(async (tx) => {
      const batch = await tx.query.paymentBatches.findFirst({
        where: and(
          eq(schema.paymentBatches.id, id),
          eq(schema.paymentBatches.tenantId, tenantId),
        ),
        with: {
          items: true,
        },
      });

      if (!batch) {
        throw new NotFoundException('Lote de pago no encontrado.');
      }

      if (batch.status !== 'DRAFT' && batch.status !== 'UPLOADED') {
        throw new BadRequestException(
          'Solo se pueden confirmar lotes en estado borrador o subido.',
        );
      }

      for (const item of batch.items) {
        if (item.itemType === 'WITHDRAWAL') {
          await this.withdrawService.disburse(
            tenantId,
            userId,
            item.sourceId,
            {
              bankAccountId: batch.bankId!,
              processedAt: new Date(dto.processedAt),
              bankReference: dto.bankReference,
            },
            tx,
          );
        } else if (item.itemType === 'SETTLEMENT') {
          await this.settlementService.disburse(
            tenantId,
            userId,
            item.sourceId,
            {
              bankAccountId: batch.bankId!,
              transferDate: new Date(dto.processedAt),
              bankReference: dto.bankReference!,
            },
            tx,
          );
        }
      }

      await tx
        .update(schema.paymentBatches)
        .set({
          status: 'PROCESSED',
          bankReference: dto.bankReference,
          processedAt: new Date(dto.processedAt),
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.paymentBatches.id, id),
            eq(schema.paymentBatches.tenantId, tenantId),
          ),
        );

      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          userId,
          action: 'UPDATE',
          tableName: 'paymentBatches',
          recordId: String(id),
          description: `Confirmación de Lote de Pago: ${batch.paymentBatchReference}`,
          area: 'Caja de Ahorro',
          newData: [
            {
              id,
              status: 'PROCESSED',
              bankReference: dto.bankReference,
            },
          ],
          tenantId,
        }),
      );

      return {
        message: 'Lote de pago confirmado y procesado exitosamente.',
      };
    });
  }

  async cancel(batchId: string, userId: string, tenantId: string) {
    const batch = await this.db.query.paymentBatches.findFirst({
      where: and(
        eq(schema.paymentBatches.id, batchId),
        eq(schema.paymentBatches.tenantId, tenantId),
      ),
    });
    if (!batch) throw new NotFoundException('Lote no encontrado');
    if (!['DRAFT', 'UPLOADED'].includes(batch.status))
      throw new BadRequestException(
        'Solo se puede anular un lote en borrador o subido',
      );

    await this.db
      .update(schema.paymentBatches)
      .set({ status: paymentBatchStatus.CANCELLED })
      .where(
        and(
          eq(schema.paymentBatches.id, batchId),
          eq(schema.paymentBatches.tenantId, tenantId),
        ),
      );

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'paymentBatches',
        recordId: String(batchId),
        description: `Lote anulado: ${batch.paymentBatchReference}`,
        area: 'Caja de Ahorro',
        newData: [{ status: 'CANCELLED' }],
        tenantId,
      }),
    );
  }

  async markAsUploaded(batchId: string, userId: string, tenantId: string) {
    const batch = await this.db.query.paymentBatches.findFirst({
      where: and(
        eq(schema.paymentBatches.id, batchId),
        eq(schema.paymentBatches.tenantId, tenantId),
      ),
    });
    if (!batch) throw new NotFoundException('Lote no encontrado');
    if (batch.status !== paymentBatchStatus.DRAFT)
      throw new BadRequestException(
        'Solo se puede marcar como subido un lote en borrador',
      );

    const [updated] = await this.db
      .update(schema.paymentBatches)
      .set({ status: paymentBatchStatus.UPLOADED })
      .where(
        and(
          eq(schema.paymentBatches.id, batchId),
          eq(schema.paymentBatches.tenantId, tenantId),
        ),
      )
      .returning();

    this.eventEmitter.emit(
      'audit.log',
      new AuditLogEvent({
        userId,
        action: 'UPDATE',
        tableName: 'paymentBatches',
        recordId: String(batchId),
        description: `Lote marcado como SUBIDO: ${batch.paymentBatchReference}`,
        area: 'Caja de Ahorro',
        newData: [updated],
        tenantId,
      }),
    );
    return updated;
  }

  async findAll(dto: FilterPaymentBatchDto, tenantId: string) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      status,
    } = dto || {};

    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [
      eq(schema.paymentBatches.batchType, 'PAYMENT'),
      eq(schema.paymentBatches.tenantId, tenantId),
    ];

    if (status) {
      conditions.push(eq(schema.paymentBatches.status, status));
    }

    if (search) {
      conditions.push(
        sql`(${ilike(schema.paymentBatches.description, `%${search}%`)} or ${ilike(
          schema.paymentBatches.bankReference,
          `%${search}%`,
        )})`,
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.paymentBatches)
      .where(where);

    const totalCount = Number(count);
    const totalPages = Math.ceil(totalCount / limit);

    const orderBy =
      sortOrder === 'asc'
        ? sql`${schema.paymentBatches[sortBy as keyof typeof schema.paymentBatches]} asc`
        : sql`${schema.paymentBatches[sortBy as keyof typeof schema.paymentBatches]} desc`;

    const rows = await this.db
      .select({
        id: schema.paymentBatches.id,
        description: schema.paymentBatches.description,
        paymentBatchReference: schema.paymentBatches.paymentBatchReference,
        status: schema.paymentBatches.status,
        recordCount: schema.paymentBatches.recordCount,
        totalAmount: schema.paymentBatches.totalAmount,
        currencyCode: schema.paymentBatches.currencyCode,
        bankId: schema.paymentBatches.bankId,
        bankFileName: schema.paymentBatches.bankFileName,
        bankReference: schema.paymentBatches.bankReference,
        processedAt: schema.paymentBatches.processedAt,
        createdAt: schema.paymentBatches.createdAt,
        updatedAt: schema.paymentBatches.updatedAt,
        bankIdRel: schema.bankAccounts.id,
        bankName: schema.bankAccounts.accountName,
        bankAccountNumber: schema.bankAccounts.accountNumber,
        bankCurrencyCode: schema.bankAccounts.currencyCode,
      })
      .from(schema.paymentBatches)
      .where(where)
      .leftJoin(
        schema.bankAccounts,
        eq(schema.bankAccounts.id, schema.paymentBatches.bankId),
      )
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const batchIds = rows.map((r) => r.id);
    const allItems = batchIds.length
      ? await this.db
          .select()
          .from(schema.paymentBatchItems)
          .where(
            and(inArray(schema.paymentBatchItems.paymentBatchId, batchIds)),
          )
      : [];

    const data = rows.map((row) => ({
      ...row,
      totalAmount: Number(row.totalAmount).toFixed(2),
      bank: row.bankIdRel
        ? {
            id: row.bankIdRel,
            name: row.bankName,
            accountNumber: row.bankAccountNumber,
            currencyCode: row.bankCurrencyCode,
          }
        : undefined,
      items: allItems.filter((it) => it.paymentBatchId === row.id),
    }));

    const meta = {
      totalItems: totalCount,
      itemCount: rows.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    };

    return { data, meta };
  }

  async findOne(id: string, tenantId: string) {
    const rows = await this.db
      .select({
        id: schema.paymentBatches.id,
        description: schema.paymentBatches.description,
        paymentBatchReference: schema.paymentBatches.paymentBatchReference,
        status: schema.paymentBatches.status,
        recordCount: schema.paymentBatches.recordCount,
        totalAmount: schema.paymentBatches.totalAmount,
        currencyCode: schema.paymentBatches.currencyCode,
        bankId: schema.paymentBatches.bankId,
        bankFileName: schema.paymentBatches.bankFileName,
        bankReference: schema.paymentBatches.bankReference,
        processedAt: schema.paymentBatches.processedAt,
        createdAt: schema.paymentBatches.createdAt,
        updatedAt: schema.paymentBatches.updatedAt,
        bankIdRel: schema.bankAccounts.id,
        bankName: schema.bankAccounts.accountName,
        bankAccountNumber: schema.bankAccounts.accountNumber,
        bankCurrencyCode: schema.bankAccounts.currencyCode,
      })
      .from(schema.paymentBatches)
      .where(
        and(
          eq(schema.paymentBatches.id, id),
          eq(schema.paymentBatches.tenantId, tenantId),
        ),
      )
      .leftJoin(
        schema.bankAccounts,
        eq(schema.bankAccounts.id, schema.paymentBatches.bankId),
      );

    if (rows.length === 0) {
      throw new NotFoundException('Lote no encontrado');
    }

    const batchIds = rows.map((r) => r.id);
    const allItems = batchIds.length
      ? await this.db
          .select()
          .from(schema.paymentBatchItems)
          .where(inArray(schema.paymentBatchItems.paymentBatchId, batchIds))
      : [];

    const data = rows.map((row) => ({
      ...row,
      totalAmount: Number(row.totalAmount).toFixed(2),
      bank: row.bankIdRel
        ? {
            id: row.bankIdRel,
            name: row.bankName,
            accountNumber: row.bankAccountNumber,
            currencyCode: row.bankCurrencyCode,
          }
        : undefined,
      items: allItems.filter((it) => it.paymentBatchId === row.id),
    }));

    return data[0];
  }
}
