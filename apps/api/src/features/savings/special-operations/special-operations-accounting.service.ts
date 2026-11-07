import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  accountPlan,
  accountingRuleDetails,
  accountingRules,
  moduleSettings,
  specialOperationAccountConfigs,
} from '@/database/schema';
import { AccountingEntryWithDetails } from '@/database/types/accounting';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { CurrencyCodeEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  SpecialOperationAccountConfigItem,
  SpecialOperationType,
} from './dto/special-operations.schema';

export interface SpecialOperationAccountingItem {
  associateId: string;
  fullname: string;
  cedula: string;
  amounts: Record<string, number>;
}

@Injectable()
export class SpecialOperationsAccountingService {
  private readonly logger = new Logger(
    SpecialOperationsAccountingService.name,
  );

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly accountingEntriesService: AccountingEntriesService,
  ) {}

  async saveConfig(
    tenantId: string,
    userId: string,
    operationType: SpecialOperationType,
    config: SpecialOperationAccountConfigItem[],
  ) {
    const uniqueConfig = Array.from(
      new Map(config.map((item) => [item.role, item])).values(),
    );

    await this.validateAccounts(this.db, tenantId, uniqueConfig);

    return this.db.transaction(async (tx) => {
      await tx
        .delete(specialOperationAccountConfigs)
        .where(
          and(
            eq(specialOperationAccountConfigs.tenantId, tenantId),
            eq(specialOperationAccountConfigs.operationType, operationType),
          ),
        );

      if (uniqueConfig.length > 0) {
        await tx.insert(specialOperationAccountConfigs).values(
          uniqueConfig.map((item) => ({
            tenantId,
            operationType,
            role: item.role,
            label: item.label ?? item.role,
            accountPlanId: item.accountPlanId,
            movementType: item.movementType,
            // El monto a liquidar no lleva auxiliar socio.
            isAuxiliary:
              item.role === 'MONTO_A_LIQUIDAR'
                ? false
                : item.isAuxiliary,
            createdById: userId,
            updatedById: userId,
          })),
        );
      }

      await this.upsertAccountingRule(
        tx,
        tenantId,
        userId,
        operationType,
        uniqueConfig,
      );

      return { message: 'Configuración contable guardada exitosamente.' };
    });
  }

  async getConfig(tenantId: string, operationType: SpecialOperationType) {
    const rows = await this.db
      .select({
        role: specialOperationAccountConfigs.role,
        label: specialOperationAccountConfigs.label,
        accountPlanId: specialOperationAccountConfigs.accountPlanId,
        movementType: specialOperationAccountConfigs.movementType,
        isAuxiliary: specialOperationAccountConfigs.isAuxiliary,
      })
      .from(specialOperationAccountConfigs)
      .where(
        and(
          eq(specialOperationAccountConfigs.tenantId, tenantId),
          eq(specialOperationAccountConfigs.operationType, operationType),
        ),
      );

    return {
      operationType,
      details: rows,
    };
  }

  async createConsolidatedEntry(
    tenantId: string,
    userId: string,
    params: {
      operationId: string;
      operationType: SpecialOperationType;
      operationDate: Date;
      reference: string;
      items: SpecialOperationAccountingItem[];
      accountConfig: SpecialOperationAccountConfigItem[];
    },
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<AccountingEntryWithDetails> {
    const db = tx ?? this.db;

    await this.validateAccounts(db, tenantId, params.accountConfig);
    await this.ensureAutoPostingSetting(db, tenantId, userId);
    await this.upsertAccountingRule(
      db,
      tenantId,
      userId,
      params.operationType,
      params.accountConfig,
    );

    const validItems = params.items
      .map((item) => ({
        associateId: item.associateId,
        description: `${item.cedula} ${item.fullname}`.trim(),
        amounts: Object.fromEntries(
          Object.entries(item.amounts).filter(([, amount]) => {
            const value = Number(amount);
            return Number.isFinite(value) && value !== 0;
          }),
        ),
      }))
      .filter((item) => Object.keys(item.amounts).length > 0);

    if (!validItems.length) {
      throw new BadRequestException(
        'La operación no generó montos contables para procesar.',
      );
    }

    const operationLabel =
      params.operationType === 'LIQUIDATION_VS_INCOME'
        ? 'Liquidación vs Ingresos'
        : 'Retiros Préstamos vs Haberes';

    const entry = await this.accountingEntriesService.createAutomaticEntry(
      tenantId,
      userId,
      {
        module: 'savings',
        submodule: 'special-operations',
        category: 'SPECIAL_OPERATION',
        operationType: params.operationType,
        autoPostKey: 'AUTO_POST_ENTRY_SPECIAL_OPERATIONS',
        description: `Operación Especial - ${operationLabel} - ${params.reference}`,
        entryDate: params.operationDate,
        currencyCode: CurrencyCodeEnum.VES,
        originReferenceId: params.operationId,
        originType: 'SPECIAL_OPERATION',
        globalDescriptions: {
          // El monto a liquidar no lleva auxiliar socio, por lo que la línea
          // se agrupa y se describe como ingreso por liquidaciones.
          MONTO_A_LIQUIDAR: 'Ingresos por liquidaciones',
        },
        items: validItems,
      },
      tx,
    );

    if (!entry) {
      throw new BadRequestException(
        'No se pudo generar el asiento contable de la operación especial. Verifique la configuración de contabilidad automática.',
      );
    }

    this.logger.log(
      `[Operación Especial ${params.reference}] Asiento ${entry.voucherNo} generado con ${validItems.length} asociados.`,
    );

    return entry;
  }

  private async validateAccounts(
    db: NodePgDatabase<typeof schema>,
    tenantId: string,
    config: SpecialOperationAccountConfigItem[],
  ) {
    const accountIds = Array.from(
      new Set(config.map((item) => item.accountPlanId).filter(Boolean)),
    );

    if (accountIds.length === 0) {
      throw new BadRequestException(
        'Debes seleccionar al menos una cuenta contable.',
      );
    }

    const accounts = await db
      .select({
        id: accountPlan.id,
        allowsMovements: accountPlan.allowsMovements,
        isActive: accountPlan.isActive,
      })
      .from(accountPlan)
      .where(
        and(
          eq(accountPlan.tenantId, tenantId),
          inArray(accountPlan.id, accountIds),
        ),
      );

    const validAccountIds = new Set(
      accounts
        .filter(
          (account) => account.allowsMovements && account.isActive,
        )
        .map((account) => account.id),
    );

    const invalidRole = config.find(
      (item) => !validAccountIds.has(item.accountPlanId),
    );

    if (invalidRole) {
      throw new BadRequestException(
        `La cuenta seleccionada para el rol ${invalidRole.role} no existe, no está activa o no permite movimientos.`,
      );
    }
  }

  private async ensureAutoPostingSetting(
    db: NodePgDatabase<typeof schema>,
    tenantId: string,
    userId: string,
  ) {
    const [existing] = await db
      .select({ id: moduleSettings.id, value: moduleSettings.value })
      .from(moduleSettings)
      .where(
        and(
          eq(moduleSettings.tenantId, tenantId),
          eq(moduleSettings.module, 'savings'),
          eq(moduleSettings.submodule, 'special-operations'),
          eq(moduleSettings.key, 'AUTO_POST_ENTRY_SPECIAL_OPERATIONS'),
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(moduleSettings).values({
        tenantId,
        module: 'savings',
        submodule: 'special-operations',
        key: 'AUTO_POST_ENTRY_SPECIAL_OPERATIONS',
        value: 'true',
        description:
          'Generar asiento contable en operaciones especiales',
        createdBy: userId,
        updatedBy: userId,
      });
      return;
    }

    if (existing.value !== 'true') {
      await db
        .update(moduleSettings)
        .set({ value: 'true', updatedBy: userId })
        .where(eq(moduleSettings.id, existing.id));
    }
  }

  private async upsertAccountingRule(
    db: NodePgDatabase<typeof schema>,
    tenantId: string,
    userId: string,
    operationType: SpecialOperationType,
    config: SpecialOperationAccountConfigItem[],
  ) {
    const uniqueConfig = Array.from(
      new Map(config.map((item) => [item.role, item])).values(),
    );

    const [existingRule] = await db
      .select({ id: accountingRules.id })
      .from(accountingRules)
      .where(
        and(
          eq(accountingRules.tenantId, tenantId),
          eq(accountingRules.category, 'SPECIAL_OPERATION'),
          eq(accountingRules.operationType, operationType),
        ),
      )
      .limit(1);

    let ruleId = existingRule?.id;

    if (!ruleId) {
      const [createdRule] = await db
        .insert(accountingRules)
        .values({
          tenantId,
          category: 'SPECIAL_OPERATION',
          operationType,
          referenceValue: null,
          description: `Regla de Operaciones Especiales - ${operationType}`,
          isActive: true,
          createdById: userId,
          updatedById: userId,
        })
        .returning({ id: accountingRules.id });

      ruleId = createdRule.id;
    } else {
      await db
        .update(accountingRules)
        .set({
          isActive: true,
          updatedById: userId,
        })
        .where(eq(accountingRules.id, ruleId));
    }

    await db
      .delete(accountingRuleDetails)
      .where(eq(accountingRuleDetails.ruleId, ruleId));

    if (uniqueConfig.length > 0) {
      await db.insert(accountingRuleDetails).values(
        uniqueConfig.map((item) => ({
          ruleId,
          accountRole: item.role,
          movementType: item.movementType,
          // El monto a liquidar no lleva auxiliar socio.
          isAuxiliary:
            item.role === 'MONTO_A_LIQUIDAR'
              ? false
              : item.isAuxiliary,
          accountPlanId: item.accountPlanId,
        })),
      );
    }

    return ruleId;
  }
}
