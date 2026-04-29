'use server';

import { safeFetchApi } from '@/lib/fetch.api';
import {
  accountingRuleApiResponseSchema,
  accountingRuleDeleteResponseSchema,
  accountingRuleListApiResponseSchema,
} from '../schemas/accounting-rule-api';
import { AccountingRule } from '../schemas/accounting-rule.schema';

export const getAccountingRulesAction = async (companyId: number) => {
  const [error, data] = await safeFetchApi(
    accountingRuleListApiResponseSchema,
    `/accounting-rules?companyId=${companyId}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching accounting rules');
  }

  return data;
};

export const createAccountingRuleAction = async (payload: AccountingRule) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    accountingRuleApiResponseSchema,
    '/accounting-rules',
    'POST',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error creating accounting rule');
  }

  return data;
};

export const updateAccountingRuleAction = async (payload: AccountingRule) => {
  const { id, ...payloadWithoutId } = payload;

  if (!id) throw new Error('ID is required for update');

  const [error, data] = await safeFetchApi(
    accountingRuleApiResponseSchema,
    `/accounting-rules/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error updating accounting rule');
  }

  return data;
};

export const deleteAccountingRuleAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountingRuleDeleteResponseSchema,
    `/accounting-rules/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error deleting accounting rule');
  }

  return data;
};

export const getAccountingRuleByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountingRuleApiResponseSchema,
    `/accounting-rules/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching accounting rule');
  }

  return data;
};

export const saveAccountingRuleAction = async (payload: AccountingRule) => {
  try {
    if (payload.id) {
      return await updateAccountingRuleAction(payload);
    } else {
      return await createAccountingRuleAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving accounting rule');
  }
};
