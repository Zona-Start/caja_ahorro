import { apiClient } from '@/lib/api-client';
import {
  accountingRuleApiResponseSchema,
  accountingRuleDeleteResponseSchema,
  accountingRuleListApiResponseSchema,
} from '../schemas/accounting-rule-api';
import type { AccountingRule } from '../schemas/accounting-rule.schema';

export class AccountingRulesService {
  static async getAll(companyId: number = 1) {
    const response = await apiClient.get(`/accounting-rules?companyId=${companyId}`);
    return accountingRuleListApiResponseSchema.parse(response.data).data;
  }

  static async getById(id: number) {
    const response = await apiClient.get(`/accounting-rules/${id}`);
    return accountingRuleApiResponseSchema.parse(response.data).data;
  }

  static async create(payload: AccountingRule) {
    const { id, ...payloadWithoutId } = payload;
    const response = await apiClient.post('/accounting-rules', payloadWithoutId);
    return accountingRuleApiResponseSchema.parse(response.data).data;
  }

  static async update(payload: AccountingRule) {
    const { id, ...payloadWithoutId } = payload;
    const response = await apiClient.patch(`/accounting-rules/${id}`, payloadWithoutId);
    return accountingRuleApiResponseSchema.parse(response.data).data;
  }

  static async delete(id: number) {
    const response = await apiClient.delete(`/accounting-rules/${id}`);
    return accountingRuleDeleteResponseSchema.parse(response.data);
  }
}
