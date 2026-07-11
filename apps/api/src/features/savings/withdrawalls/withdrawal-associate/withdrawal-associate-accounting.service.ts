import * as schema from '@/database/schema';
import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { CurrencyCodeEnum } from '@/types/enum';
import { BadRequestException, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface DisbursementAccountingParams {
  withdrawalId: string;
  associateId: string;
  associateFullname: string;
  associateCedula: string;
  withdrawalTypeDescription: string;
  requestedAmount: number;
  administrativeFee: number;
  disbursedAmount: number;
  entryDate: Date;
}

export interface ProcessingAccountingParams {
  withdrawalId: string;
  associateId: string | undefined;
  associateFullname: string;
  associateCedula: string;
  withdrawalTypeDescription: string;
  withdrawalDate: Date;
  requestedAmount: number;
  administrativeFee: number;
  disbursedAmount: number;
}

@Injectable()
export class WithdrawalAssociateAccountingService {
  constructor(
    private readonly accountingEntriesService: AccountingEntriesService,
  ) {}

  async generateDisbursementEntry(
    tenantId: string,
    userId: string,
    params: DisbursementAccountingParams,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const typeDesc = params.withdrawalTypeDescription || 'RETIRO DE HABERES';

    const result = await this.accountingEntriesService.createAutomaticEntry(
      tenantId,
      userId,
      {
        module: 'savings',
        submodule: 'withdrawals',
        category: 'SAVINGS_BANK',
        operationType: 'WITHDRAWAL_TYPE',
        description: `Desembolso de Retiro - ${params.associateFullname}`,
        entryDate: params.entryDate,
        referenceValue: typeDesc,
        currencyCode: CurrencyCodeEnum.VES,
        originReferenceId: params.withdrawalId,
        originType: 'WITHDRAWAL_DISBURSEMENT',
        items: [
          {
            associateId: params.associateId,
            amounts: {
              PARTIAL_WITHDRAWAL_SAVINGS: params.requestedAmount,
              SERVICE_FEE_INCOME: params.administrativeFee || 0,
              BANK_ACCOUNT: params.disbursedAmount,
            },
            descriptions: {
              PARTIAL_WITHDRAWAL_SAVINGS: typeDesc,
              SERVICE_FEE_INCOME: `Gastos ${typeDesc}`,
              BANK_ACCOUNT: `TB ${params.associateCedula} ${params.associateFullname}`,
            },
          },
        ],
        globalDescriptions: {
          PARTIAL_WITHDRAWAL_SAVINGS: typeDesc,
          SERVICE_FEE_INCOME: `Gastos ${typeDesc}`,
          BANK_ACCOUNT: `TB ${params.associateCedula} ${params.associateFullname}`,
        },
      },
      tx,
    );

    if (result === null) {
      throw new BadRequestException(
        'Asiento automático no generado. Verifique que las configuraciones ACCOUNTING_AUTO_POSTING_MASTER y AUTO_POST_ENTRY_WITHDRAWALS estén habilitadas.',
      );
    }

    return result;
  }

  async generateProcessingEntry(
    tenantId: string,
    userId: string,
    params: ProcessingAccountingParams,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const typeDesc = params.withdrawalTypeDescription || 'RETIRO DE HABERES';

    const result = await this.accountingEntriesService.createAutomaticEntry(
      tenantId,
      userId,
      {
        module: 'savings',
        submodule: 'withdrawals',
        category: 'SAVINGS_BANK',
        operationType: 'WITHDRAWAL_TYPE',
        description: `Retiro ${typeDesc} - ${params.associateFullname}`,
        entryDate: params.withdrawalDate,
        referenceValue: typeDesc,
        currencyCode: CurrencyCodeEnum.VES,
        originReferenceId: params.withdrawalId,
        originType: 'WITHDRAWAL_PROCESSING',
        items: [
          {
            associateId: params.associateId,
            amounts: {
              SPECIAL_WITHDRAWAL_SAVINGS: params.requestedAmount,
              SERVICE_FEE_INCOME: params.administrativeFee || 0,
              OPERATION_COUNTERPART: params.disbursedAmount,
            },
            descriptions: {
              SPECIAL_WITHDRAWAL_SAVINGS: typeDesc,
              SERVICE_FEE_INCOME: typeDesc,
              OPERATION_COUNTERPART: `${params.associateCedula} ${params.associateFullname}`,
            },
          },
        ],
        globalDescriptions: {
          SPECIAL_WITHDRAWAL_SAVINGS: typeDesc,
          SERVICE_FEE_INCOME: typeDesc,
          OPERATION_COUNTERPART: `${params.associateCedula} ${params.associateFullname}`,
        },
      },
      tx,
    );

    if (result === null) {
      throw new BadRequestException(
        'Asiento automático no generado. Verifique que las configuraciones ACCOUNTING_AUTO_POSTING_MASTER y AUTO_POST_ENTRY_WITHDRAWALS estén habilitadas.',
      );
    }

    return result;
  }

  async cancelWithdrawalEntry(
    userId: string,
    tenantId: string,
    entryId: string,
  ): Promise<void> {
    try {
      await this.accountingEntriesService.cancelEntry(
        userId,
        tenantId,
        entryId,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        error.message.includes('No existe una regla contable')
      ) {
        throw new BadRequestException(
          'Error al anular el asiento contable del retiro. Por favor, contacte al administrador.',
        );
      }
      throw error;
    }
  }
}
