import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { CurrencyCodeEnum } from '@/types/enum';
import { Injectable, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';

export interface AccountingItemInput {
  associateId?: string;
  amounts: Record<string, number>;
  descriptions: Record<string, string>;
}

export interface BatchAccountingParams {
  movementType: 'contribution_patronal' | 'contribution_voluntary';
  entryDate: Date;
  description: string;
  associateId?: string;
  totalAmount: number;
  amountVoluntario?: number;
  amountPatrono?: number;
  amountAsociado?: number;
  associateIds?: string[];
  /**
   * Items detallados por asociado. Cuando se proveen (masivo), prevalecen
   * sobre la derivación automática a partir de `associateIds` + amounts.
   */
  items?: AccountingItemInput[];
}

interface BuildEntryContext {
  isPatronal: boolean;
  roleAliases: Record<string, string>;
  operationType: 'PAYROLL_CONCEPT' | 'SAVINGS_UPLOAD';
  referenceValue: string;
  items: AccountingItemInput[];
  globalDescriptions: Record<string, string>;
}

@Injectable()
export class ContributionBatchesAccountingService {
  private readonly logger = new Logger(ContributionBatchesAccountingService.name);

  constructor(
    private readonly accountingEntriesService: AccountingEntriesService,
  ) { }

  /**
   * Genera el asiento contable automático para una carga de haberes.
   *
   * Política no-fatal: si la regla contable no existe o hay cualquier
   * error controlado al construir el asiento, NO se lanza la excepción.
   * En su lugar se devuelve `{ warning }` con el mensaje original, para
   * que el orquestador pueda advertir al front sin abortar la operación
   * financiera (que ya está persistida en su propia transacción).
   */
  async generateContributionEntry(
    tenantId: string,
    userId: string,
    params: BatchAccountingParams,
    originReferenceId: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<{ entryId?: string; warning?: string }> {
    const ctx = this.buildContributionEntryContext(params);

    if (ctx.items.length === 0) {
      return {
        warning:
          'No se generó el asiento contable porque no hay ítems asociados a contabilizar.',
      };
    }

    try {
      const result = await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'savings',
          submodule: 'contributions',
          category: 'SAVINGS_BANK',
          operationType: ctx.operationType,
          referenceValue: ctx.referenceValue,
          description: params.description,
          entryDate: params.entryDate,
          currencyCode: 'VES' as CurrencyCodeEnum,
          originReferenceId,
          originType: 'CONTRIBUTION_BATCH',
          roleAliases: ctx.roleAliases,
          items: ctx.items,
          globalDescriptions: ctx.globalDescriptions,
        },
        tx,
      );

      return result ? { entryId: result.id } : {};
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(
        `Asiento contable no generado para carga de haberes (tenant=${tenantId}): ${message}.`,
      );
      return { warning: message };
    }
  }

  /**
   * Genera el asiento de reverso contable para una anulación de carga.
   *
   * Política no-fatal: si la regla contable no existe o hay cualquier
   * error controlado, se devuelve `{ warning }` para que el orquestador
   * pueda advertir al front sin abortar la anulación financiera.
   */
  async generateReversalEntry(
    tenantId: string,
    userId: string,
    originalBatch: typeof schema.contributionBatches.$inferSelect,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<{ reversalEntryId?: string; warning?: string }> {
    const isPatronal =
      originalBatch.movementType === 'contribution_patronal';
    const fullDesc = originalBatch.description || 'Carga de haberes';

    const roleAliases: Record<string, string> = isPatronal
      ? {
          SAVINGS_RECEIVABLE: 'ASSOCIATED_SAVINGS',
          EMPLOYER_RECEIVABLE: 'EMPLOYER_CONTRIBUTION',
        }
      : {
          BANK_ACCOUNT: 'VOLUNTARY_SAVINGS',
        };

    const reversalAmounts: Record<string, number> = {};
    const reversalDescs: Record<string, string> = {};
    const reversalGlobals: Record<string, string> = {};

    if (isPatronal) {
      reversalAmounts['ASSOCIATED_SAVINGS'] = -Number(
        originalBatch.amountAsociado ?? 0,
      );
      reversalAmounts['EMPLOYER_CONTRIBUTION'] = -Number(
        originalBatch.amountPatrono ?? 0,
      );
      reversalDescs['ASSOCIATED_SAVINGS'] = `REVERSO: AHORRO SOCIO DEL ${originalBatch.entryDate}`;
      reversalDescs['EMPLOYER_CONTRIBUTION'] = `REVERSO: APORTE PATRONO DEL ${originalBatch.entryDate}`;
      reversalGlobals['ASSOCIATED_SAVINGS'] = `REVERSO: APORTES SOCIO DEL ${originalBatch.entryDate}`;
      reversalGlobals['EMPLOYER_CONTRIBUTION'] = `REVERSO: APORTE PATRONO DEL ${originalBatch.entryDate}`;
    } else {
      reversalAmounts['VOLUNTARY_SAVINGS'] = -Number(
        originalBatch.amountVoluntario ?? 0,
      );
      reversalDescs['VOLUNTARY_SAVINGS'] = `REVERSO: AHORRO VOLUNTARIO DEL ${originalBatch.entryDate}`;
      reversalGlobals['VOLUNTARY_SAVINGS'] = `REVERSO: APORTES VOLUNTARIOS DEL ${originalBatch.entryDate}`;
    }

    const associateId = originalBatch.associateId ?? undefined;

    try {
      const result = await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'savings',
          submodule: 'contributions',
          category: 'SAVINGS_BANK',
          operationType: isPatronal ? 'PAYROLL_CONCEPT' : 'SAVINGS_UPLOAD',
          referenceValue: isPatronal ? 'Aporte Empleados' : 'Aporte Voluntario',
          description: `ANULACIÓN: ${fullDesc}`,
          entryDate: new Date(),
          currencyCode: 'VES' as CurrencyCodeEnum,
          originReferenceId: originalBatch.id,
          originType: 'CONTRIBUTION_REVERSAL',
          roleAliases,
          items: [
            {
              associateId,
              amounts: reversalAmounts,
              descriptions: reversalDescs,
            },
          ],
          globalDescriptions: reversalGlobals,
        },
        tx,
      );

      return result ? { reversalEntryId: result.id } : {};
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(
        `Asiento de reverso no generado (tenant=${tenantId}, batch=${originalBatch.id}): ${message}.`,
      );
      return { warning: message };
    }
  }

  /**
   * Construye el contexto de items/roles/descripciones para el asiento
   * contable. Reusa `params.items` si el caller ya los armó (masivo);
   * de lo contrario deriva a partir de `associateIds` + amounts (individual).
   */
  private buildContributionEntryContext(
    params: BatchAccountingParams,
  ): BuildEntryContext {
    const isPatronal = params.movementType === 'contribution_patronal';
    const dateStr = params.entryDate.toISOString().split('T')[0];

    const roleAliases: Record<string, string> = isPatronal
      ? {
          SAVINGS_RECEIVABLE: 'ASSOCIATED_SAVINGS',
          EMPLOYER_RECEIVABLE: 'EMPLOYER_CONTRIBUTION',
        }
      : {
          BANK_ACCOUNT: 'VOLUNTARY_SAVINGS',
        };

    const items: AccountingItemInput[] = [];

    if (params.items && params.items.length > 0) {
      items.push(...params.items);
    } else {
      const associateIds =
        params.associateIds ??
        (params.associateId ? [params.associateId] : []);

      if (isPatronal) {
        const totalHalf = params.totalAmount / 2;
        for (const assocId of associateIds) {
          if (!assocId) continue;
          items.push({
            associateId: assocId,
            amounts: {
              ASSOCIATED_SAVINGS: totalHalf,
              EMPLOYER_CONTRIBUTION: totalHalf,
            },
            descriptions: {
              ASSOCIATED_SAVINGS: `AHORRO DEL ${dateStr}`,
              EMPLOYER_CONTRIBUTION: `APORTE DEL ${dateStr}`,
            },
          });
        }
      } else {
        for (const assocId of associateIds) {
          if (!assocId) continue;
          items.push({
            associateId: assocId,
            amounts: {
              VOLUNTARY_SAVINGS: Number(
                params.amountVoluntario ?? params.totalAmount,
              ),
            },
            descriptions: {
              VOLUNTARY_SAVINGS: `AHORRO VOLUNTARIO DEL ${dateStr}`,
            },
          });
        }
      }
    }

    const globalDescriptions: Record<string, string> = isPatronal
      ? {
          ASSOCIATED_SAVINGS: `APORTES SOCIO DEL ${dateStr}`,
          EMPLOYER_CONTRIBUTION: `APORTE DEL PATRONO DEL ${dateStr}`,
        }
      : {
          VOLUNTARY_SAVINGS: `APORTES VOLUNTARIOS DEL ${dateStr}`,
        };

    return {
      isPatronal,
      roleAliases,
      operationType: isPatronal ? 'PAYROLL_CONCEPT' : 'SAVINGS_UPLOAD',
      referenceValue: isPatronal ? 'Aporte Empleados' : 'Aporte Voluntario',
      items,
      globalDescriptions,
    };
  }
}