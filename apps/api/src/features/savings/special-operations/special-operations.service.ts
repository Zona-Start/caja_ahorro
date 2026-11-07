import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  accountPlan,
  accountingEntries,
  specialOperationItems,
  specialOperations,
} from '@/database/schema';
import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  ExecuteSpecialOperationInput,
  FilterSpecialOperationDto,
  SpecialOperationAccountConfigItem,
  SpecialOperationType,
} from './dto/special-operations.schema';
import { SpecialOperationsAccountingService } from './special-operations-accounting.service';
import { SpecialOperationsExecutionService } from './special-operations-execution.service';
import { SpecialOperationsPreviewService } from './special-operations-preview.service';
import { SpecialOperationsTemplateService } from './special-operations-template.service';

@Injectable()
export class SpecialOperationsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly previewService: SpecialOperationsPreviewService,
    private readonly accountingService: SpecialOperationsAccountingService,
    private readonly executionService: SpecialOperationsExecutionService,
    private readonly templateService: SpecialOperationsTemplateService,
  ) {}

  generateTemplate() {
    return this.templateService.generateTemplate();
  }

  preview(
    tenantId: string,
    operationType: SpecialOperationType,
    file: Express.Multer.File,
    operationDate?: Date,
  ) {
    return this.previewService.preview(
      tenantId,
      operationType,
      file,
      operationDate,
    );
  }

  getConfig(tenantId: string, operationType: SpecialOperationType) {
    return this.accountingService.getConfig(tenantId, operationType);
  }

  getAccounts(tenantId: string) {
    return this.db
      .select({
        id: accountPlan.id,
        code: accountPlan.code,
        name: accountPlan.name,
        accountType: accountPlan.accountType,
        nature: accountPlan.nature,
        allowsMovements: accountPlan.allowsMovements,
        isActive: accountPlan.isActive,
      })
      .from(accountPlan)
      .where(
        and(
          eq(accountPlan.tenantId, tenantId),
          eq(accountPlan.isActive, true),
          eq(accountPlan.allowsMovements, true),
        ),
      )
      .orderBy(asc(accountPlan.code));
  }

  saveConfig(
    tenantId: string,
    userId: string,
    operationType: SpecialOperationType,
    config: SpecialOperationAccountConfigItem[],
  ) {
    return this.accountingService.saveConfig(
      tenantId,
      userId,
      operationType,
      config,
    );
  }

  execute(
    tenantId: string,
    userId: string,
    dto: ExecuteSpecialOperationInput,
  ) {
    return this.executionService.execute(tenantId, userId, dto);
  }

  async findAll(tenantId: string, dto: FilterSpecialOperationDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      operationType,
    } = dto || {};

    const offset = (page - 1) * limit;
    const conditions = [eq(specialOperations.tenantId, tenantId)];

    if (search) {
      conditions.push(ilike(specialOperations.reference, `%${search}%`));
    }

    if (status) {
      conditions.push(eq(specialOperations.status, status));
    }

    if (operationType) {
      conditions.push(eq(specialOperations.operationType, operationType));
    }

    const where = and(...conditions);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(specialOperations)
      .where(where);

    const totalItems = Number(countResult?.count ?? 0);

    const data = await this.db
      .select({
        id: specialOperations.id,
        reference: specialOperations.reference,
        operationType: specialOperations.operationType,
        operationDate: specialOperations.operationDate,
        status: specialOperations.status,
        totalAssociates: specialOperations.totalAssociates,
        totalAmount: specialOperations.totalAmount,
        currencyCode: specialOperations.currencyCode,
        accountingEntryId: specialOperations.accountingEntryId,
        voucherNo: accountingEntries.voucherNo,
        notes: specialOperations.notes,
        createdAt: specialOperations.createdAt,
        createdById: specialOperations.createdById,
      })
      .from(specialOperations)
      .leftJoin(
        accountingEntries,
        eq(accountingEntries.id, specialOperations.accountingEntryId),
      )
      .where(where)
      .orderBy(desc(specialOperations.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const [operation] = await this.db
      .select()
      .from(specialOperations)
      .where(
        and(
          eq(specialOperations.id, id),
          eq(specialOperations.tenantId, tenantId),
        ),
      );

    if (!operation) {
      throw new NotFoundException('Operación especial no encontrada.');
    }

    const items = await this.db
      .select()
      .from(specialOperationItems)
      .where(eq(specialOperationItems.operationId, id));

    let voucherNo: number | null = null;
    if (operation.accountingEntryId) {
      const [entry] = await this.db
        .select({ voucherNo: accountingEntries.voucherNo })
        .from(accountingEntries)
        .where(eq(accountingEntries.id, operation.accountingEntryId))
        .limit(1);
      voucherNo = entry?.voucherNo ?? null;
    }

    return {
      ...operation,
      voucherNo,
      items,
    };
  }
}
