import * as schema from '@/database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export const ROUNDING_ACCEPTANCE_TOLERANCE = 0.005;
export const EPSILON_COMPARISON = 0.05;

export interface LoanInfo {
  id: string;
  associateId: string;
  status: string;
  currencyCode: string | null;
  associateFullname: string | null;
}

export interface PaidInstallmentDetail {
  id: string;
  amount: number;
  principal: number;
  interest: number;
}

export interface PartialInstallment {
  id: string;
  paidAmount: number;
  originalPaidAmount: number;
  principal: number;
  interest: number;
}

export interface InstallmentResult {
  paidInstallmentDetails: PaidInstallmentDetail[];
  partialInstallment?: PartialInstallment;
  remainingAmount: number;
}

export interface PaymentInsertResult {
  id: string;
  customReference: string;
}

export interface PaymentRecord {
  id: string;
  amount: string;
  customReference: string;
  loanId: string | null;
  statusPayment: string;
  associateId: string | null;
  currencyCode: string | null;
  associateFullname: string | null;
}

export interface BulkPaymentItem {
  cedula: string;
  amount: number;
  fecha: string | Date;
}

export interface BulkPaymentResult {
  success: { cedula: string; ref: string }[];
  errors: { cedula: string; error: string }[];
  totalProcessed: number;
}

export interface AccountingEntryItem {
  associateId: string | number;
  amounts: Record<string, number>;
  descriptions: Record<string, string>;
}

export type DrizzleTx = NodePgDatabase<typeof schema>;
