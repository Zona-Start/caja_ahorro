import { apiClient } from '@/lib/api-client';
import {
  associatesBalanceResponseSchema,
  balanceSheetResponseSchema,
  generalLedgerResponseSchema,
  incomeStatementResponseSchema,
  journalBookResponseSchema,
  trialBalanceResponseSchema,
} from '../schemas/accounting-reports-api';

export class AccountingReportsService {
  static async getJournalBook(filters: any) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await apiClient.get(`/accounting-reports/journal-book?${queryParams.toString()}`);
    return journalBookResponseSchema.parse(response.data);
  }

  static async getGeneralLedger(filters: any) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await apiClient.get(`/accounting-reports/general-ledger?${queryParams.toString()}`);
    return generalLedgerResponseSchema.parse(response.data);
  }

  static async getTrialBalance(filters: any) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await apiClient.get(`/accounting-reports/trial-balance?${queryParams.toString()}`);
    return trialBalanceResponseSchema.parse(response.data);
  }

  static async getBalanceSheet(filters: any) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await apiClient.get(`/accounting-reports/balance-sheet?${queryParams.toString()}`);
    return balanceSheetResponseSchema.parse(response.data);
  }

  static async getIncomeStatement(filters: any) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await apiClient.get(`/accounting-reports/income-statement?${queryParams.toString()}`);
    return incomeStatementResponseSchema.parse(response.data);
  }

  static async getAssociatesBalance(filters: any) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await apiClient.get(`/accounting-reports/associates-balance?${queryParams.toString()}`);
    return associatesBalanceResponseSchema.parse(response.data);
  }
}
