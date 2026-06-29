import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { CurrencyCodeEnum } from '@/types/enum';
import { BadRequestException, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/database/schema';

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
}

@Injectable()
export class ContributionBatchesAccountingService {
  constructor(
    private readonly accountingEntriesService: AccountingEntriesService,
  ) {}

  async generateContributionEntry(
    tenantId: string,
    userId: string,
    params: BatchAccountingParams,
    originReferenceId: string,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<{ entryId: string } | null> {
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

    const items: {
      associateId?: string;
      amounts: Record<string, number>;
      descriptions: Record<string, string>;
    }[] = [];

    const globalDescriptions: Record<string, string> = {};

    if (isPatronal) {
      const totalHalf = params.totalAmount / 2;
      for (const assocId of params.associateIds || [params.associateId].filter(Boolean)) {
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
      globalDescriptions['ASSOCIATED_SAVINGS'] = `APORTES SOCIO DEL ${dateStr}`;
      globalDescriptions['EMPLOYER_CONTRIBUTION'] = `APORTE DEL PATRONO DEL ${dateStr}`;
    } else {
      for (const assocId of params.associateIds || [params.associateId].filter(Boolean)) {
        if (!assocId) continue;
        items.push({
          associateId: assocId,
          amounts: {
            VOLUNTARY_SAVINGS: Number(params.amountVoluntario ?? params.totalAmount),
          },
          descriptions: {
            VOLUNTARY_SAVINGS: `AHORRO VOLUNTARIO DEL ${dateStr}`,
          },
        });
      }
      globalDescriptions['VOLUNTARY_SAVINGS'] = `APORTES VOLUNTARIOS DEL ${dateStr}`;
    }

    try {
      const result = await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'savings',
          submodule: 'contribution_batches',
          category: 'SAVINGS_BANK',
          operationType: isPatronal ? 'PAYROLL_CONCEPT' : 'SAVINGS_UPLOAD',
          referenceValue: isPatronal
            ? 'Aporte Empleados'
            : 'Aporte Voluntario',
          description: params.description,
          entryDate: params.entryDate,
          currencyCode: 'VES' as CurrencyCodeEnum,
          originReferenceId,
          originType: 'CONTRIBUTION_BATCH',
          roleAliases,
          items,
          globalDescriptions,
        },
        tx,
      );

      return result ? { entryId: result.id } : null;
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        error.message.includes('No existe una regla contable')
      ) {
        throw new BadRequestException(
          'El sistema está configurado para asientos automáticos, pero no existe una regla contable para cargas de haberes.',
        );
      }
      throw error;
    }
  }

  async generateReversalEntry(
    tenantId: string,
    userId: string,
    originalBatch: typeof schema.contributionBatches.$inferSelect,
    tx: NodePgDatabase<typeof schema>,
  ): Promise<{ reversalEntryId: string } | null> {
    const dateStr = originalBatch.entryDate;
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
      reversalAmounts['ASSOCIATED_SAVINGS'] =
        -Number(originalBatch.amountAsociado ?? 0);
      reversalAmounts['EMPLOYER_CONTRIBUTION'] =
        -Number(originalBatch.amountPatrono ?? 0);
      reversalDescs['ASSOCIATED_SAVINGS'] = `REVERSO: AHORRO SOCIO DEL ${dateStr}`;
      reversalDescs['EMPLOYER_CONTRIBUTION'] = `REVERSO: APORTE PATRONO DEL ${dateStr}`;
      reversalGlobals['ASSOCIATED_SAVINGS'] = `REVERSO: APORTES SOCIO DEL ${dateStr}`;
      reversalGlobals['EMPLOYER_CONTRIBUTION'] = `REVERSO: APORTE PATRONO DEL ${dateStr}`;
    } else {
      reversalAmounts['VOLUNTARY_SAVINGS'] =
        -Number(originalBatch.amountVoluntario ?? 0);
      reversalDescs['VOLUNTARY_SAVINGS'] = `REVERSO: AHORRO VOLUNTARIO DEL ${dateStr}`;
      reversalGlobals['VOLUNTARY_SAVINGS'] = `REVERSO: APORTES VOLUNTARIOS DEL ${dateStr}`;
    }

    const associateId = originalBatch.associateId ?? undefined;

    try {
      const result = await this.accountingEntriesService.createAutomaticEntry(
        tenantId,
        userId,
        {
          module: 'savings',
          submodule: 'contribution_batches',
          category: 'SAVINGS_BANK',
          operationType: isPatronal ? 'PAYROLL_CONCEPT' : 'SAVINGS_UPLOAD',
          referenceValue: isPatronal
            ? 'Aporte Empleados'
            : 'Aporte Voluntario',
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

      return result ? { reversalEntryId: result.id } : null;
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        error.message.includes('No existe una regla contable')
      ) {
        throw new BadRequestException(
          'Error en reversa contable: No existe una regla para procesar la anulación.',
        );
      }
      throw error;
    }
  }
}
