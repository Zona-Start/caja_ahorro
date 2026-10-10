import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { accountingRuleDetails, accountingRules } from '@/database/schema';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { CurrencyCodeEnum } from '@/types/enum';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface ReimbursementAccountingLine {
  /** 'LOAN' | 'CREDIT' | 'WITHDRAWAL' */
  originType: 'LOAN' | 'CREDIT' | 'WITHDRAWAL';
  /** Nombre del tipo (préstamo/crédito) para resolver la cuenta origen. */
  originTypeName?: string | null;
  amount: number;
}

export interface ReimbursementAccountingParams {
  module: 'savings';
  destination: 'SAVINGS' | 'CASH';
  lines: ReimbursementAccountingLine[];
  entryDate: Date;
  currencyCode: CurrencyCodeEnum;
  originReferenceId: string;
  description: string;
}

interface ResolvedRuleDetail {
  accountRole: string | null;
  movementType: 'DEBIT' | 'CREDIT';
  isAuxiliary: boolean | null;
  accountPlanId: string | null;
}

@Injectable()
export class ReimbursementAccountingService {
  private readonly logger = new Logger(ReimbursementAccountingService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly accountingEntriesService: AccountingEntriesService,
  ) {}

  async generateEntry(
    tenantId: string,
    userId: string,
    associateId: string,
    params: ReimbursementAccountingParams,
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<void> {
    const db = tx ?? this.db;

    // Cuenta destino (contrapartida): se toma de la regla REIMBURSEMENT
    // configurada en el Mapa de Integración (editable en la interfaz).
    const destinationRole =
      params.destination === 'SAVINGS' ? 'VOLUNTARY_SAVINGS' : 'BANK_ACCOUNT';
    let destinationAccount = await this.resolveRoleAccount(
      db,
      tenantId,
      'REIMBURSEMENT',
      'Reintegro Saldo a Favor',
      destinationRole,
    );
    if (!destinationAccount) {
      destinationAccount =
        params.destination === 'SAVINGS'
          ? await this.resolveAnyRuleAccount(
              db,
              tenantId,
              'SAVINGS_BANK',
              'SAVINGS_UPLOAD',
              'VOLUNTARY_SAVINGS',
            )
          : await this.resolveAnyRuleAccount(
              db,
              tenantId,
              'SAVINGS_BANK',
              'SAVINGS_LIQUIDATION',
              'BANK_ACCOUNT',
            );
    }

    if (!destinationAccount) {
      this.logger.warn(
        `[Reintegro] Sin cuenta destino configurada (${params.destination}). Se omite el asiento.`,
      );
      return;
    }

    const explicitDetails: {
      accountPlanId: string;
      movementType: 'DEBIT' | 'CREDIT';
      amount: number;
      description?: string;
      associateId?: string;
    }[] = [];

    let total = 0;

    for (const line of params.lines) {
      if (!line.amount) continue;
      total += line.amount;

      const origin = await this.resolveOriginAccount(
        db,
        tenantId,
        line.originType,
        line.originTypeName,
      );

      if (!origin?.accountPlanId) {
        this.logger.warn(
          `[Reintegro] Sin cuenta origen para ${line.originType} '${line.originTypeName ?? ''}'. Línea omitida (posible descuadre).`,
        );
        continue;
      }

      explicitDetails.push({
        accountPlanId: origin.accountPlanId,
        movementType: 'DEBIT',
        amount: Number(line.amount.toFixed(2)),
        description: params.description,
        associateId: origin.isAuxiliary ? associateId : undefined,
      });
    }

    if (total <= 0) return;

    explicitDetails.push({
      accountPlanId: destinationAccount.accountPlanId!,
      movementType: 'CREDIT',
      amount: Number(total.toFixed(2)),
      description: params.description,
    });

    try {
      await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'savings',
          submodule: 'reimbursements',
          category: 'SAVINGS_BANK',
          operationType: 'REIMBURSEMENT',
          referenceValue: 'Reintegro Saldo a Favor',
          autoPostKey: 'AUTO_POST_ENTRY_REIMBURSEMENTS',
          description: params.description,
          entryDate: params.entryDate,
          currencyCode: params.currencyCode,
          originReferenceId: params.originReferenceId,
          originType: 'REIMBURSEMENT',
          items: [
            {
              associateId,
              amounts: {},
            },
          ],
          explicitDetails,
        },
        db,
      );
    } catch (error) {
      this.logger.error(
        `[Reintegro] Error generando asiento: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  private async resolveOriginAccount(
    db: NodePgDatabase<typeof schema>,
    tenantId: string,
    originType: 'LOAN' | 'CREDIT' | 'WITHDRAWAL',
    typeName?: string | null,
  ): Promise<ResolvedRuleDetail | null> {
    if (originType === 'LOAN') {
      if (typeName) {
        const detail = await this.resolveRoleAccount(
          db,
          tenantId,
          'LOAN_TYPE',
          typeName,
          'LOAN_PRINCIPAL',
        );
        if (detail) return detail;
      }
      return this.resolveAnyRuleAccount(
        db,
        tenantId,
        'SAVINGS_BANK',
        'LOAN_TYPE',
        'LOAN_PRINCIPAL',
      );
    }
    if (originType === 'CREDIT') {
      if (typeName) {
        const detail = await this.resolveRoleAccount(
          db,
          tenantId,
          'CREDIT_TYPE',
          typeName,
          'CREDIT_PRINCIPAL',
        );
        if (detail) return detail;
      }
      return this.resolveAnyRuleAccount(
        db,
        tenantId,
        'SAVINGS_BANK',
        'CREDIT_TYPE',
        'CREDIT_PRINCIPAL',
      );
    }
    // WITHDRAWAL: se debita la cuenta de retiros.
    return this.resolveAnyRuleAccount(
      db,
      tenantId,
      'SAVINGS_BANK',
      'WITHDRAWAL_TYPE',
      'PARTIAL_WITHDRAWAL_SAVINGS',
    );
  }

  private async resolveRuleDetails(
    db: NodePgDatabase<typeof schema>,
    tenantId: string,
    operationType: string,
    referenceValue: string,
  ): Promise<ResolvedRuleDetail[]> {
    const rows = await db
      .select({
        accountRole: accountingRuleDetails.accountRole,
        movementType: accountingRuleDetails.movementType,
        isAuxiliary: accountingRuleDetails.isAuxiliary,
        accountPlanId: accountingRuleDetails.accountPlanId,
      })
      .from(accountingRules)
      .innerJoin(
        accountingRuleDetails,
        eq(accountingRules.id, accountingRuleDetails.ruleId),
      )
      .where(
        and(
          eq(accountingRules.tenantId, tenantId),
          eq(accountingRules.category, 'SAVINGS_BANK'),
          eq(accountingRules.operationType, operationType),
          eq(accountingRules.referenceValue, referenceValue),
          eq(accountingRules.isActive, true),
        ),
      );
    return rows as ResolvedRuleDetail[];
  }

  private async resolveRoleAccount(
    db: NodePgDatabase<typeof schema>,
    tenantId: string,
    operationType: string,
    referenceValue: string,
    role: string,
  ): Promise<ResolvedRuleDetail | null> {
    const details = await this.resolveRuleDetails(
      db,
      tenantId,
      operationType,
      referenceValue,
    );
    return (
      details.find((d) => d.accountRole === role && d.accountPlanId) ?? null
    );
  }

  private async resolveAnyRuleAccount(
    db: NodePgDatabase<typeof schema>,
    tenantId: string,
    category: string,
    operationType: string,
    role: string,
  ): Promise<ResolvedRuleDetail | null> {
    const rows = await db
      .select({
        accountRole: accountingRuleDetails.accountRole,
        movementType: accountingRuleDetails.movementType,
        isAuxiliary: accountingRuleDetails.isAuxiliary,
        accountPlanId: accountingRuleDetails.accountPlanId,
      })
      .from(accountingRules)
      .innerJoin(
        accountingRuleDetails,
        eq(accountingRules.id, accountingRuleDetails.ruleId),
      )
      .where(
        and(
          eq(accountingRules.tenantId, tenantId),
          eq(accountingRules.category, category),
          eq(accountingRules.operationType, operationType),
          eq(accountingRules.isActive, true),
          eq(accountingRuleDetails.accountRole, role),
        ),
      )
      .limit(1);
    return (rows[0] as ResolvedRuleDetail) ?? null;
  }
}
