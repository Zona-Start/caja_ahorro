import type {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CurrencyCodeEnum,
  movementStatusEnum,
  paymentMethodEnum,
} from '@/types/enum';

export type ContributionMovementType =
  | 'contribution_patronal'
  | 'contribution_voluntary';

export interface AssociateMovementPayload {
  associateAccountId: string;
  movementType: AssociateMovementTypeEnum;
  amount: number;
  currencyCode: CurrencyCodeEnum;
  transactionDate: Date;
  description: string;
  status: movementStatusEnum;
}

export interface AssociateMovementResult {
  message: string;
  data: { id: string; internalCode: string };
}

export interface BankMovementPayloadInput {
  bankAccountId: string;
  transactionDate: Date;
  paymentMethod: paymentMethodEnum;
  description: string;
  bankReference?: string;
  category: BankTransactionCategory;
  creditAmount: number;
  debitAmount: number;
}

export interface BankMovementPayload {
  movement: BankMovementPayloadInput & { createdById: string };
  links: { internalRecordType: 'MEMBER_CONTRIBUTION'; internalRecordId: string }[];
}

export interface BankMovementResult {
  message: string;
  movement: { id: string } & Record<string, unknown>;
}

export interface AccountingOutcome {
  entryId?: string;
  warning?: string;
}

export interface LoadResult {
  message: string;
  movementId?: string;
  accountingEntryId?: string;
  accountingWarning?: string;
  processedCount?: number;
}

export interface BatchAssociateEntry {
  associateId: string;
  amount?: number;
  movementId?: string;
}

export interface IndividualBatchContext {
  associateAccountId: string;
  associateId: string;
  fullname: string;
  accountNumber: string;
}

export interface AccountingItem {
  associateId: string;
  amounts: Record<string, number>;
  descriptions: Record<string, string>;
}

export interface BulkRow {
  cedula: string;
  monto: number;
}