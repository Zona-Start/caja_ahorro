import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  accountingRuleDetails,
  accountingRules,
  associateAccountMovements,
} from '@/database/schema';
import { AccountingEntryWithDetails } from '@/database/types/accounting';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { CurrencyCodeEnum } from '@/types/enum';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

/** Tipos de movimiento que SUMAN al saldo de haberes (ver vista associate_haberes_balance). */
const CREDIT_MOVEMENT_TYPES = new Set<string>([
  'SAVING_CONTRIBUTION',
  'VOLUNTARY_SAVINGS',
  'EMPLOYER_CONTRIBUTION',
  'SURPLUS_SAVINGS_CONTRIBUTION',
  'ADJUSTMENT_CREDIT',
  'DIVIDEND_CREDIT',
  'FEE_REIMBURSEMENT_CREDIT',
  'LOAN_OVERPAYMENT_CREDIT',
  'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT',
  'SAVING_WITHDRAWAL_REVERSAL_CREDIT',
  'LIQUIDATION_BALANCE_REVERSAL_CREDIT',
  'ACCOUNTING_ADJUSTMENT_CREDIT',
  'OTHER_CREDIT',
]);

/** Tipos de movimiento que RESTAN del saldo de haberes. */
const DEBIT_MOVEMENT_TYPES = new Set<string>([
  'SAVING_WITHDRAWAL',
  'WITHDRAWAL_FEE_DEBIT',
  'ADJUSTMENT_DEBIT',
  'FEE_CORRECTION_DEBIT',
  'PAYMENT_REVERSAL_DEBIT',
  'ADMIN_FEE_DEBIT',
  'OTHER_DEBIT',
  'FEE_DEBIT',
]);

export interface LiquidationWithdrawalLine {
  /** Nombre/descripción del tipo de retiro (referenceValue de la regla). */
  description: string;
  /** True si el tipo de retiro es casa comercial o inventario. */
  isSpecial: boolean;
  /** Monto acumulado del retiro (incluye gasto administrativo). */
  amount: number;
}

export interface LiquidationDebtLine {
  /** Nombre/descripción del tipo de préstamo o crédito (referenceValue). */
  typeName: string;
  /** Saldo pendiente. */
  amount: number;
}

export interface LiquidationAccountingParams {
  liquidationId: string;
  associateId: string;
  associateAccountId: string | null;
  associateFullname: string;
  associateCedula: string;
  entryDate: Date;
  currencyCode: CurrencyCodeEnum;
  haberesContribution: number;
  haberesVoluntary: number;
  haberesEmployer: number;
  surpluses: number;
  /** Saldo total de haberes al momento de la liquidacion (para diagnostico). */
  totalHaberesBalance: number;
  withdrawals: LiquidationWithdrawalLine[];
  loans: LiquidationDebtLine[];
  credits: LiquidationDebtLine[];
  netAmount: number;
}

interface ResolvedRuleDetail {
  accountRole: string | null;
  movementType: 'DEBIT' | 'CREDIT';
  isAuxiliary: boolean | null;
  isAuxiliarySupplier: boolean | null;
  accountPlanId: string | null;
}

type MovementType = 'DEBIT' | 'CREDIT';

interface ExplicitLine {
  accountPlanId: string;
  movementType: MovementType;
  amount: number;
  description?: string;
  associateId?: string;
}

/**
 * Genera el asiento contable automatico de una liquidacion de haberes.
 *
 * IMPORTANTE: La direccion (DEBIT/CREDIT) NO se toma de la regla contable.
 * En una liquidacion la direccion es fija e independiente de para que se uso
 * originalmente la regla (ej: la regla LOAN_TYPE se configura DEBIT para el
 * desembolso del prestamo, pero al cancelarlo por liquidacion debe ir CREDIT).
 *
 *   DEBIT  -> ASSOCIATED_SAVINGS, EMPLOYER_CONTRIBUTION, VOLUNTARY_SAVINGS,
 *             DIVIDENDS_PAYABLE
 *   CREDIT -> retiros, prestamos, creditos y BANK_ACCOUNT
 *
 * De cada regla solo se aprovecha la CUENTA (`accountPlanId`) y el flag de
 * auxiliar. Por ello todas las lineas se envian al motor generico como
 * `explicitDetails` (direccion forzada) y NO como `amounts`.
 */
@Injectable()
export class SettlementAssociateAccountingService {
  private readonly logger = new Logger(
    SettlementAssociateAccountingService.name,
  );

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly accountingEntriesService: AccountingEntriesService,
  ) {}

  async generateLiquidationEntry(
    tenantId: string,
    userId: string,
    params: LiquidationAccountingParams,
    tx?: NodePgDatabase<typeof schema>,
  ): Promise<AccountingEntryWithDetails | null> {
    const db = tx ?? this.db;
    const tag = `[Asiento Liquidacion ${params.liquidationId}]`;
    const n = (v: number) => Number(v ?? 0).toFixed(2);

    // ─── 0. Entrada completa ───────────────────────────────────────────────
    this.logger.log(
      `${tag} INICIO | asociado=${params.associateCedula} ${params.associateFullname} | cuenta=${params.associateAccountId}`,
    );
    this.logger.log(
      `${tag} HABERES | ASSOCIATED_SAVINGS(aportes)=${n(params.haberesContribution)} | EMPLOYER_CONTRIBUTION(patrono)=${n(params.haberesEmployer)} | VOLUNTARY_SAVINGS(voluntarios)=${n(params.haberesVoluntary)} | DIVIDENDS_PAYABLE(excedentes)=${n(params.surpluses)} | BANK_ACCOUNT(neto)=${n(params.netAmount)}`,
    );
    this.logger.log(
      `${tag} RETIROS(${params.withdrawals.length}) | ${
        params.withdrawals
          .map(
            (w) => `'${w.description}'(isSpecial=${w.isSpecial})=${n(w.amount)}`,
          )
          .join(' | ') || 'ninguno'
      }`,
    );
    this.logger.log(
      `${tag} PRESTAMOS(${params.loans.length}) | ${
        params.loans.map((l) => `'${l.typeName}'=${n(l.amount)}`).join(' | ') ||
        'ninguno'
      }`,
    );
    this.logger.log(
      `${tag} CREDITOS(${params.credits.length}) | ${
        params.credits.map((c) => `'${c.typeName}'=${n(c.amount)}`).join(' | ') ||
        'ninguno'
      }`,
    );

    // ─── Diagnostico: composicion del saldo de haberes por tipo de movimiento ─
    if (params.associateAccountId) {
      await this.logHaberesMovements(
        db,
        tag,
        params.associateAccountId,
        params.totalHaberesBalance,
      );
    }

    const associateDesc = `${params.associateCedula} ${params.associateFullname}`;
    const lines: ExplicitLine[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    const pushLine = (
      meta: string,
      detail: ResolvedRuleDetail | null,
      forcedMovement: MovementType,
      amount: number,
      description: string,
    ) => {
      if (!amount) return;
      if (!detail?.accountPlanId) {
        this.logger.warn(
          `${tag} ${meta} monto=${n(amount)}: sin regla/cuenta configurada -> LINEA OMITIDA (CAUSA DE DESCUADRE)`,
        );
        return;
      }
      lines.push({
        accountPlanId: detail.accountPlanId,
        movementType: forcedMovement,
        amount,
        description,
        associateId: detail.isAuxiliary ? params.associateId : undefined,
      });
      if (forcedMovement === 'DEBIT') totalDebit += amount;
      else totalCredit += amount;
      this.logger.log(
        `${tag} ${meta} -> FORZADO ${forcedMovement} ${n(amount)} | cuenta=${detail.accountPlanId} | auxiliar=${detail.isAuxiliary} (regla tenia ${detail.movementType})`,
      );
    };

    // ─── 1. Regla base (SAVINGS_LIQUIDATION) -> cuentas de haberes + banco ─
    const baseDetails = await this.resolveRuleDetails(
      db,
      tenantId,
      'SAVINGS_BANK',
      'SAVINGS_LIQUIDATION',
      'Liquidacion Haberes',
    );
    this.logger.log(
      `${tag} REGLA BASE detalles=${baseDetails.length} | ${
        baseDetails
          .map((d) => `${d.accountRole}(${d.movementType})->${d.accountPlanId}`)
          .join(' | ') || 'NINGUNA ENCONTRADA'
      }`,
    );

    const baseRole = (role: string) =>
      baseDetails.find((d) => d.accountRole === role) ?? null;

    // Aportes y excedentes: siempre DEBIT.
    pushLine(
      'BASE ASSOCIATED_SAVINGS (aportes)',
      baseRole('ASSOCIATED_SAVINGS'),
      'DEBIT',
      params.haberesContribution,
      'Aportes del Asociado',
    );
    pushLine(
      'BASE EMPLOYER_CONTRIBUTION (patrono)',
      baseRole('EMPLOYER_CONTRIBUTION'),
      'DEBIT',
      params.haberesEmployer,
      'Aportes del Empleador',
    );
    pushLine(
      'BASE VOLUNTARY_SAVINGS (voluntarios)',
      baseRole('VOLUNTARY_SAVINGS'),
      'DEBIT',
      params.haberesVoluntary,
      'Aportes Voluntarios',
    );
    pushLine(
      'BASE DIVIDENDS_PAYABLE (excedentes)',
      baseRole('DIVIDENDS_PAYABLE'),
      'DEBIT',
      params.surpluses,
      'Excedentes',
    );

    // Neto al asociado: siempre CREDIT.
    pushLine(
      'BASE BANK_ACCOUNT (neto)',
      baseRole('BANK_ACCOUNT'),
      'CREDIT',
      params.netAmount,
      `TB ${associateDesc}`,
    );

    // ─── 2. Retiros -> siempre CREDIT ─────────────────────────────────────
    for (const withdrawal of params.withdrawals) {
      if (!withdrawal.amount) continue;
      const role = withdrawal.isSpecial
        ? 'SPECIAL_WITHDRAWAL_SAVINGS'
        : 'PARTIAL_WITHDRAWAL_SAVINGS';

      // Si el retiro trae referencia (tipo identificable) se describe con el
      // nombre del tipo; si no (saldo acumulado/importado sin referencia), se
      // describe como "Retiros Acumulado".
      const hasType = !!withdrawal.description && !!withdrawal.description.trim();
      const detailDescription = hasType
        ? withdrawal.description!
        : 'Retiros Acumulado';

      let detail: ResolvedRuleDetail | null = null;
      if (hasType) {
        // Se resuelve la regla del tipo y se acepta cualquiera de los dos roles
        // de retiro, para no depender de como este configurada (PARTIAL/SPECIAL).
        const details = await this.resolveRuleDetails(
          db,
          tenantId,
          'SAVINGS_BANK',
          'WITHDRAWAL_TYPE',
          withdrawal.description!,
        );
        detail =
          details.find((d) => d.accountRole === role && d.accountPlanId) ??
          details.find(
            (d) =>
              (d.accountRole === 'PARTIAL_WITHDRAWAL_SAVINGS' ||
                d.accountRole === 'SPECIAL_WITHDRAWAL_SAVINGS') &&
              d.accountPlanId,
          ) ??
          null;
      }
      // Fallback para retiros sin tipo (saldos acumulados/importados): usa la
      // cuenta generica del rol en cualquier regla WITHDRAWAL_TYPE activa.
      if (!detail) {
        detail = await this.resolveAnyRuleAccount(
          db,
          tenantId,
          'SAVINGS_BANK',
          'WITHDRAWAL_TYPE',
          role,
        );
        if (detail && !hasType) {
          this.logger.warn(
            `${tag} RETIRO acumulado sin tipo: se usa la cuenta generica del rol ${role} (${detail.accountPlanId}).`,
          );
        }
      }

      pushLine(
        `RETIRO ${hasType ? `'${withdrawal.description}'` : '(acumulado sin tipo)'} (${role})`,
        detail,
        'CREDIT',
        withdrawal.amount,
        detailDescription,
      );
    }

    // ─── 3. Prestamos -> siempre CREDIT ───────────────────────────────────
    for (const loan of params.loans) {
      if (!loan.amount) continue;
      let detail: ResolvedRuleDetail | null = null;
      if (loan.typeName) {
        detail = await this.resolveRoleAccount(
          db,
          tenantId,
          'SAVINGS_BANK',
          'LOAN_TYPE',
          loan.typeName,
          'LOAN_PRINCIPAL',
        );
      }
      if (!detail) {
        detail = await this.resolveAnyRuleAccount(
          db,
          tenantId,
          'SAVINGS_BANK',
          'LOAN_TYPE',
          'LOAN_PRINCIPAL',
        );
        if (detail) {
          this.logger.warn(
            `${tag} PRESTAMO '${loan.typeName || '(sin tipo)'}': se usa la cuenta generica del rol LOAN_PRINCIPAL (${detail.accountPlanId}).`,
          );
        }
      }
      pushLine(
        `PRESTAMO '${loan.typeName || '(sin tipo)'}' (LOAN_PRINCIPAL)`,
        detail,
        'CREDIT',
        loan.amount,
        loan.typeName || 'Prestamos Acumulado',
      );
    }

    // ─── 4. Creditos -> siempre CREDIT ────────────────────────────────────
    for (const credit of params.credits) {
      if (!credit.amount) continue;
      let detail: ResolvedRuleDetail | null = null;
      if (credit.typeName) {
        detail = await this.resolveRoleAccount(
          db,
          tenantId,
          'SAVINGS_BANK',
          'CREDIT_TYPE',
          credit.typeName,
          'CREDIT_PRINCIPAL',
        );
      }
      if (!detail) {
        detail = await this.resolveAnyRuleAccount(
          db,
          tenantId,
          'SAVINGS_BANK',
          'CREDIT_TYPE',
          'CREDIT_PRINCIPAL',
        );
        if (detail) {
          this.logger.warn(
            `${tag} CREDITO '${credit.typeName || '(sin tipo)'}': se usa la cuenta generica del rol CREDIT_PRINCIPAL (${detail.accountPlanId}).`,
          );
        }
      }
      pushLine(
        `CREDITO '${credit.typeName || '(sin tipo)'}' (CREDIT_PRINCIPAL)`,
        detail,
        'CREDIT',
        credit.amount,
        credit.typeName || 'Creditos Acumulado',
      );
    }

    // ─── 5. Totales proyectados (descuadre) ───────────────────────────────
    const diff = totalDebit - totalCredit;
    this.logger.log(
      `${tag} TOTALES PROYECTADOS | DEBIT=${n(totalDebit)} | CREDIT=${n(totalCredit)} | DIFERENCIA=${n(diff)} ${Math.abs(diff) < 0.005 ? '✓ CUADRADO' : '✗ DESCUADRADO'}`,
    );

    const payload = {
      module: 'savings',
      submodule: 'liquidations',
      category: 'SAVINGS_BANK',
      operationType: 'SAVINGS_LIQUIDATION',
      referenceValue: 'Liquidacion Haberes',
      description: `LIQUIDACION DE HABERES - ${params.associateCedula} - ${params.associateFullname}`,
      entryDate: params.entryDate,
      currencyCode: params.currencyCode,
      originReferenceId: params.liquidationId,
      originType: 'SAVINGS_LIQUIDATION',
      // Sin amounts: la regla base solo aporta las cuentas, no la direccion.
      items: [
        {
          associateId: params.associateId,
          amounts: {},
        },
      ],
      explicitDetails: lines,
    };

    this.logger.log(
      `${tag} PAYLOAD A createAutomaticEntry: ${JSON.stringify(payload)}`,
    );

    try {
      return await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        payload,
        tx,
      );
    } catch (error) {
      this.logger.error(
        `${tag} No se pudo generar el asiento contable: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private async logHaberesMovements(
    db: NodePgDatabase<typeof schema>,
    tag: string,
    associateAccountId: string,
    totalHaberesBalance: number,
  ) {
    const rows = await db
      .select({
        movementType: associateAccountMovements.movementType,
        total: sql<string>`SUM(${associateAccountMovements.amount})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(associateAccountMovements)
      .where(
        and(
          eq(associateAccountMovements.associateAccountId, associateAccountId),
          eq(associateAccountMovements.status, 'COMPLETED'),
        ),
      )
      .groupBy(associateAccountMovements.movementType);

    let signedTotal = 0;
    const parts = rows.map((r) => {
      const amount = Number(r.total);
      const isDebit = DEBIT_MOVEMENT_TYPES.has(r.movementType);
      const isCredit = CREDIT_MOVEMENT_TYPES.has(r.movementType);
      const signed = isDebit ? -amount : isCredit ? amount : 0;
      signedTotal += signed;
      const kind = isDebit ? 'DEBIT' : isCredit ? 'CREDIT' : 'IGNORADO(signo 0 en la vista)';
      return `${r.movementType}[${kind}]=${signed >= 0 ? '+' : ''}${signed.toFixed(2)} (${r.count})`;
    });

    this.logger.log(
      `${tag} MOVIMIENTOS COMPLETED (aporte al saldo): ${parts.join(' | ') || 'ninguno'}`,
    );
    this.logger.log(
      `${tag} SUMA MOVIMIENTOS=${signedTotal.toFixed(2)} | haberes_balance=${totalHaberesBalance.toFixed(2)} | dif=${(signedTotal - totalHaberesBalance).toFixed(2)}`,
    );
  }

  private async resolveRuleDetails(
    db: NodePgDatabase<typeof schema>,
    tenantId: string,
    category: string,
    operationType: string,
    referenceValue: string,
  ): Promise<ResolvedRuleDetail[]> {
    const rows = await db
      .select({
        accountRole: accountingRuleDetails.accountRole,
        movementType: accountingRuleDetails.movementType,
        isAuxiliary: accountingRuleDetails.isAuxiliary,
        isAuxiliarySupplier: accountingRuleDetails.isAuxiliarySupplier,
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
          eq(accountingRules.referenceValue, referenceValue),
          eq(accountingRules.isActive, true),
        ),
      );

    return rows as ResolvedRuleDetail[];
  }

  private async resolveRoleAccount(
    db: NodePgDatabase<typeof schema>,
    tenantId: string,
    category: string,
    operationType: string,
    referenceValue: string,
    role: string,
  ): Promise<ResolvedRuleDetail | null> {
    const details = await this.resolveRuleDetails(
      db,
      tenantId,
      category,
      operationType,
      referenceValue,
    );
    return (
      details.find((d) => d.accountRole === role && d.accountPlanId) ?? null
    );
  }

  /**
   * Busca la cuenta del rol en CUALQUIER regla activa del operationType dado.
   * Se usa como respaldo cuando el movimiento no tiene tipo/referencia (ej.
   * saldos acumulados importados).
   */
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
        isAuxiliarySupplier: accountingRuleDetails.isAuxiliarySupplier,
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
