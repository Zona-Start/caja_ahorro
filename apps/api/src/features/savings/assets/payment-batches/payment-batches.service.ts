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
import { and, eq, ilike, SQL, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { LoanManagementService } from '../../loans/loan_management/loan-management.service';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import { SettlementAssociateService } from '../../settlement/settlement-associate.service';
import { WithdrawalAssociateService } from '../../withdrawalls/withdrawal-associate/withdrawal-associate.service';
import {
  ConfirmPaymentBatchDto,
  ConfirmPaymentBatchItemDto,
  CreatePaymentBatchDto,
  CreateSinglePaymentBatchItemDto,
  FilterPaymentBatchDto,
} from './dto/payment-batches.schema';

function mapSnakeToCamel(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

@Injectable()
export class PaymentBatchesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly generateCodeService: GenerateCodeService,
    private readonly eventEmitter: EventEmitter2,
    private readonly withdrawService: WithdrawalAssociateService,
    private readonly settlementService: SettlementAssociateService,
    private readonly loanService: LoanManagementService,
    private readonly bankMovementsService: BankMovementsService,
  ) { }

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

      const prefix = 'LOT-D';

      for (const it of items) {
        let net: number;
        let assocAccId: string | null = null;
        let curr: string;
        let assocCedula: string;
        let assocNationality: string;
        let beneficiaryName: string;
        let beneficiaryAccountNumber: string | null = null;

        switch (it.type) {
          case paymentBatchItemType.WITHDRAWAL: {
            const rec = await tx
              .select({
                status: schema.withdrawalsAssociates.status,
                disbursedAmount: schema.withdrawalsAssociates.disbursedAmount,
                disbursementAccountId: schema.associateAccounts.id,
                associateNationality: schema.associates.nationality,
                associateCedula: schema.associates.cedula,
                associateFullname: schema.associates.fullname,
                accountNumber: schema.associateAccounts.accountNumber,
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
            assocNationality = rec[0].associateNationality?.[0] || '';
            assocCedula = `${assocNationality}${rec[0].associateCedula}`;
            beneficiaryName = rec[0].associateFullname ?? '';
            beneficiaryAccountNumber = rec[0].accountNumber;
            assocAccId = rec[0].disbursementAccountId;
            curr = 'VES';
            break;
          }

          case paymentBatchItemType.LIQUIDATION: {
            const rec = await tx
              .select({
                status: schema.liquidationsAssociates.status,
                netLiquidationAmount:
                  schema.liquidationsAssociates.netLiquidationAmount,
                disbursementAccountId: schema.associateAccounts.id,
                currencyCode: schema.liquidationsAssociates.currencyCode,
                associateNationality: schema.associates.nationality,
                associateCedula: schema.associates.cedula,
                associateFullname: schema.associates.fullname,
                accountNumber: schema.associateAccounts.accountNumber,
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

            if (rec.length === 0 || rec[0].status !== 'PROCESSED')
              throw new BadRequestException(
                `Liquidación ${it.sourceId} no procesada`,
              );
            net = Number(rec[0].netLiquidationAmount);
            assocNationality = rec[0].associateNationality?.[0] || '';
            assocCedula = `${assocNationality}${rec[0].associateCedula}`;
            beneficiaryName = rec[0].associateFullname ?? '';
            beneficiaryAccountNumber = rec[0].accountNumber;
            assocAccId = rec[0].disbursementAccountId;
            curr = 'VES';
            break;
          }

          case paymentBatchItemType.LOAN: {
            const rec = await tx
              .select({
                status: schema.loans.status,
                approvedAmount: schema.loans.approvedAmount,
                disbursementAccountId: schema.loans.disbursementAccountId,
                associateNationality: schema.associates.nationality,
                associateCedula: schema.associates.cedula,
                associateFullname: schema.associates.fullname,
                accountNumber: schema.associateAccounts.accountNumber,
              })
              .from(schema.loans)
              .leftJoin(
                schema.associateAccounts,
                eq(
                  schema.associateAccounts.id,
                  schema.loans.disbursementAccountId,
                ),
              )
              .leftJoin(
                schema.associates,
                eq(schema.associates.id, schema.loans.associateId),
              )
              .where(
                and(
                  eq(schema.loans.id, it.sourceId),
                  eq(schema.loans.tenantId, tenantId),
                ),
              );

            if (rec.length === 0 || rec[0].status !== 'APPROVED')
              throw new BadRequestException(
                `Préstamo ${it.sourceId} no aprobado`,
              );
            net = Number(rec[0].approvedAmount ?? 0);
            assocNationality = rec[0].associateNationality?.[0] || '';
            assocCedula = `${assocNationality}${rec[0].associateCedula}`;
            beneficiaryName = rec[0].associateFullname ?? '';
            beneficiaryAccountNumber = rec[0].accountNumber;
            assocAccId = rec[0].disbursementAccountId;
            curr = 'VES';
            break;
          }

          default:
            throw new BadRequestException(`Tipo de ítem inválido: ${it.type}`);
        }

        if (curr !== currencyCode)
          throw new BadRequestException(
            `Moneda diferente en ${it.type} ${it.sourceId}`,
          );

        const dupResult = await tx.execute(
          sql`SELECT 1 FROM savings.payment_batch_items pbi
              INNER JOIN savings.payment_batches pb ON pb.id = pbi.payment_batch_id
              WHERE pbi.source_id = ${it.sourceId}
              AND pbi.item_type = ${it.type}
              AND pb.status NOT IN ('PROCESSED', 'CANCELLED')
              AND pb.tenant_id = ${tenantId}
              LIMIT 1`,
        );

        if (dupResult.rows.length > 0)
          throw new BadRequestException(
            `${it.type} ${it.sourceId} ya está en otro lote activo`,
          );

        totalAmount += net;

        lines.push({
          itemType: it.type,
          sourceId: it.sourceId,
          associateAccountId: assocAccId || null,
          beneficiaryAccountNumber:
            beneficiaryAccountNumber || bankAcc.accountNumber,
          beneficiaryAccountType: 'CORRIENTE',
          beneficiaryId: assocCedula,
          beneficiaryName: beneficiaryName,
          amount: net.toFixed(4),
          status: paymentBatchItemStatus.PENDING,
        });
      }

      const batchReference =
        await this.generateCodeService.generateNextReference(
          prefix,
          tenantId,
          'savings',
          'payment_batches',
          tx,
        );

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
          paymentBatchReference: batchReference,
        } as any)
        .returning();

      if (lines.length) {
        for (const line of lines) {
          await tx.execute(
            sql`INSERT INTO savings.payment_batch_items 
              (payment_batch_id, item_type, source_id, associate_account_id, beneficiary_account_number, beneficiary_account_type, beneficiary_id, beneficiary_name, amount, status)
              VALUES (${batch.id}, ${line.itemType}, ${line.sourceId}, ${line.associateAccountId}, ${line.beneficiaryAccountNumber}, ${line.beneficiaryAccountType}, ${line.beneficiaryId}, ${line.beneficiaryName}, ${line.amount}, ${line.status})`,
          );
        }
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
        reference: batch.paymentBatchReference,
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

    const itemsResult = await this.db.execute(
      sql`SELECT * FROM savings.payment_batch_items WHERE payment_batch_id = ${batchId}`,
    );
    const items = itemsResult.rows as (typeof schema.paymentBatchItems.$inferSelect)[];

    if (!items.length) throw new BadRequestException('Lote sin ítems');

    const rzf = (n: number | string, len: number) =>
      String(n).padStart(len, '0').slice(-len);

    const now = new Date();
    const fecha = format(now, 'yyyyMMdd');
    const total = Number(batch[0].payment_batches.totalAmount) * 100;
    const qty = items.length;

    let content = '';
    content += '10';
    content += codeBank[0]?.value ?? '0';
    content += rzf(batch[0]?.bank_accounts?.accountNumber ?? '', 20).slice(
      0,
      20,
    );
    content += fecha;
    content += rzf(qty, 6);
    content += rzf(total, 15);
    content += '\n';

    for (const it of items) {
      const row = it as Record<string, unknown>;
      const amount = Number(row.amount) * 100;
      const beneficiaryId = String(row.beneficiary_id ?? '');
      const idType = beneficiaryId.charAt(0).toUpperCase();
      const idNum = beneficiaryId.substring(1);

      let line = '';
      line += '20';
      line += idType;
      line += rzf(idNum, 9);
      line += rzf(String(row.beneficiary_account_number ?? ''), 20).slice(0, 20);
      line += rzf(amount, 15);
      content += line + '\n';
    }

    const reference = batch[0].payment_batches.paymentBatchReference;
    const fileName = `${reference}.txt`;
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

  async markAsUploaded(batchId: string, userId: string, tenantId: string) {
    return this.db.transaction(async (tx) => {
      const batch = await tx.query.paymentBatches.findFirst({
        where: and(
          eq(schema.paymentBatches.id, batchId),
          eq(schema.paymentBatches.tenantId, tenantId),
        ),
        with: { items: true },
      });

      if (!batch) throw new NotFoundException('Lote no encontrado');
      if (batch.status !== paymentBatchStatus.DRAFT)
        throw new BadRequestException(
          'Solo se puede marcar como subido un lote en borrador',
        );

      for (const item of batch.items) {
        switch (item.itemType) {
          case 'WITHDRAWAL':
            await tx
              .update(schema.withdrawalsAssociates)
              .set({ status: 'PENDING_DISBURSEMENT_BANK_BATCH' })
              .where(
                and(
                  eq(schema.withdrawalsAssociates.id, item.sourceId),
                  eq(schema.withdrawalsAssociates.tenantId, tenantId),
                ),
              );
            break;
          case 'LIQUIDATION':
            await tx
              .update(schema.liquidationsAssociates)
              .set({ status: 'PENDING_DISBURSEMENT_BANK_BATCH' })
              .where(
                and(
                  eq(schema.liquidationsAssociates.id, item.sourceId),
                  eq(schema.liquidationsAssociates.tenantId, tenantId),
                ),
              );
            break;
          case 'LOAN':
            await tx
              .update(schema.loans)
              .set({ status: 'PENDING_DISBURSEMENT_BANK_BATCH' })
              .where(
                and(
                  eq(schema.loans.id, item.sourceId),
                  eq(schema.loans.tenantId, tenantId),
                ),
              );
            break;
        }
      }

      const [updated] = await tx
        .update(schema.paymentBatches)
        .set({ status: paymentBatchStatus.UPLOADED, updatedById: userId })
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
    });
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

      const processedAt = new Date(dto.processedAt);
      const bankLinks: {
        internalRecordType: string;
        internalRecordId: string;
      }[] = [];
      let totalProcessedAmount = 0;

      for (const itemResult of dto.items) {
        const item = batch.items.find((i) => i.id === itemResult.itemId);
        if (!item) {
          throw new BadRequestException(`Ítem ${itemResult.itemId} no pertenece al lote`);
        }

        if (!itemResult.processed) {
          await tx.execute(
            sql`UPDATE savings.payment_batch_items SET status = 'REJECTED', rejection_reason = ${itemResult.rejectionReason || null}, updated_by_id = ${userId} WHERE id = ${item.id}`,
          );
          continue;
        }

        totalProcessedAmount += Number(item.amount);

        switch (item.itemType) {
          case 'WITHDRAWAL':
            await this.withdrawService.disburse(
              tenantId,
              userId,
              item.sourceId,
              {
                bankAccountId: batch.bankId!,
                processedAt,
                bankReference: dto.bankReference,
              },
              tx,
              true,
            );
            bankLinks.push({
              internalRecordType: 'MEMBER_WITHDRAWAL',
              internalRecordId: item.sourceId,
            });
            break;

          case 'LIQUIDATION':
            await this.settlementService.disburse(
              tenantId,
              userId,
              item.sourceId,
              {
                bankAccountId: batch.bankId!,
                transferDate: processedAt,
                bankReference: dto.bankReference!,
              },
              tx,
              true,
            );
            bankLinks.push({
              internalRecordType: 'PAYROLL_SETTLEMENT',
              internalRecordId: item.sourceId,
            });
            break;

          case 'LOAN':
            await this.loanService.disburse(
              tenantId,
              userId,
              item.sourceId,
              {
                bankAccountId: batch.bankId!,
                currencyCode: batch.currencyCode,
                paymentMethod: 'transfer',
                disbursementDate: processedAt,
                bankReference: dto.bankReference,
                description: `Desembolso por Lote ${batch.paymentBatchReference}`,
              },
              tx,
              true,
            );
            bankLinks.push({
              internalRecordType: 'LOAN_DISBURSEMENT',
              internalRecordId: item.sourceId,
            });
            break;
        }

        await tx.execute(
          sql`UPDATE savings.payment_batch_items SET status = 'PROCESSED', updated_by_id = ${userId} WHERE id = ${item.id}`,
        );
      }

      const hasAnyProcessed = dto.items.some((i) => i.processed);
      const newStatus = hasAnyProcessed ? 'PROCESSED' : 'CANCELLED';

      if (hasAnyProcessed && bankLinks.length > 0) {
        await this.bankMovementsService.createAndReconcile(
          {
            movement: {
              bankAccountId: batch.bankId!,
              transactionDate: processedAt,
              paymentMethod: 'BANK_TRANSFER' as any,
              description: `Lote de Pago ${batch.paymentBatchReference} - ${dto.bankReference || ''}`,
              bankReference: dto.bankReference,
              category: 'BATCH_DISBURSEMENT' as any,
              creditAmount: 0,
              debitAmount: totalProcessedAmount,
            },
            links: bankLinks,
          },
          userId,
          tenantId,
          tx,
        );
      }

      await tx
        .update(schema.paymentBatches)
        .set({
          status: newStatus,
          bankReference: dto.bankReference,
          processedAt: new Date(dto.processedAt),
          updatedById: userId,
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
    return this.db.transaction(async (tx) => {
      const batch = await tx.query.paymentBatches.findFirst({
        where: and(
          eq(schema.paymentBatches.id, batchId),
          eq(schema.paymentBatches.tenantId, tenantId),
        ),
        with: { items: true },
      });

      if (!batch) throw new NotFoundException('Lote no encontrado');
      if (!['DRAFT', 'UPLOADED'].includes(batch.status))
        throw new BadRequestException(
          'Solo se puede anular un lote en borrador o subido',
        );

      if (batch.status === 'UPLOADED') {
        for (const item of batch.items) {
          switch (item.itemType) {
            case 'WITHDRAWAL':
              await tx
                .update(schema.withdrawalsAssociates)
                .set({ status: 'APPROVED' })
                .where(
                  and(
                    eq(schema.withdrawalsAssociates.id, item.sourceId),
                    eq(schema.withdrawalsAssociates.tenantId, tenantId),
                    eq(schema.withdrawalsAssociates.status, 'PENDING_DISBURSEMENT_BANK_BATCH'),
                  ),
                );
              break;
            case 'LIQUIDATION':
              await tx
                .update(schema.liquidationsAssociates)
                .set({ status: 'PROCESSED' })
                .where(
                  and(
                    eq(schema.liquidationsAssociates.id, item.sourceId),
                    eq(schema.liquidationsAssociates.tenantId, tenantId),
                    eq(schema.liquidationsAssociates.status, 'PENDING_DISBURSEMENT_BANK_BATCH'),
                  ),
                );
              break;
            case 'LOAN':
              await tx
                .update(schema.loans)
                .set({ status: 'APPROVED' })
                .where(
                  and(
                    eq(schema.loans.id, item.sourceId),
                    eq(schema.loans.tenantId, tenantId),
                    eq(schema.loans.status, 'PENDING_DISBURSEMENT_BANK_BATCH'),
                  ),
                );
              break;
          }
        }
      }

      await tx
        .update(schema.paymentBatches)
        .set({ status: paymentBatchStatus.CANCELLED, updatedById: userId })
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

      return { message: 'Lote anulado exitosamente.' };
    });
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
      eq(schema.paymentBatches.tenantId, tenantId),
    ];

    if (status) {
      conditions.push(eq(schema.paymentBatches.status, status));
    }

    if (search) {
      conditions.push(
        sql`(${ilike(schema.paymentBatches.paymentBatchReference, `%${search}%`)} or ${ilike(
          schema.paymentBatches.description ?? sql`''`,
          `%${search}%`,
        )})`,
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.paymentBatches)
      .leftJoin(
        schema.bankAccounts,
        eq(schema.bankAccounts.id, schema.paymentBatches.bankId),
      )
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
        paymentBatchReference: schema.paymentBatches.paymentBatchReference,
        description: schema.paymentBatches.description,
        batchType: schema.paymentBatches.batchType,
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
        bankAccountName: schema.bankAccounts.accountName,
        bankAccountNumber: schema.bankAccounts.accountNumber,
      })
      .from(schema.paymentBatches)
      .leftJoin(
        schema.bankAccounts,
        eq(schema.bankAccounts.id, schema.paymentBatches.bankId),
      )
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const batchIds = rows.map((r) => r.id);
    let allItems: any[] = [];
    if (batchIds.length) {
      const result = await this.db.execute(
        sql`SELECT * FROM savings.payment_batch_items WHERE payment_batch_id = ANY(${sql`ARRAY[${sql.join(batchIds.map(id => sql`${id}::uuid`), sql`, `)}]`})`,
      );
      allItems = result.rows.map(mapSnakeToCamel);
    }

    const data = rows.map((row) => ({
      ...row,
      totalAmount: Number(row.totalAmount).toFixed(2),
      bank: row.bankId
        ? {
          id: row.bankId,
          name: row.bankAccountName,
          accountNumber: row.bankAccountNumber,
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
        paymentBatchReference: schema.paymentBatches.paymentBatchReference,
        description: schema.paymentBatches.description,
        batchType: schema.paymentBatches.batchType,
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
        bankAccountName: schema.bankAccounts.accountName,
        bankAccountNumber: schema.bankAccounts.accountNumber,
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

    const allItemsResult = await this.db.execute(
      sql`SELECT * FROM savings.payment_batch_items WHERE payment_batch_id = ${id}`,
    );
    const allItems = allItemsResult.rows.map(mapSnakeToCamel);

    const row = rows[0];

    return {
      ...row,
      totalAmount: Number(row.totalAmount).toFixed(2),
      bank: row.bankId
        ? {
          id: row.bankId,
          name: row.bankAccountName,
          accountNumber: row.bankAccountNumber,
        }
        : undefined,
      items: allItems,
    };
  }
}
