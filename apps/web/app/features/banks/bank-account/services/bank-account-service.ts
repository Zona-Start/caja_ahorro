import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

const bankAccountSchema = z.object({
  id: z.number(),
  accountName: z.string(),
  accountNumber: z.string(),
  accountType: z.string().optional(),
  bank: z.object({
    id: z.number(),
    name: z.string(),
  }).optional(),
  balance: z.number().optional(),
  status: z.string().optional(),
});

const bankAccountsResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(bankAccountSchema),
});

export type BankAccount = z.infer<typeof bankAccountSchema>;

export const bankAccountService = {
  getAll: async () => {
    const response = await apiClient.get('/bakings/bank-accounts');
    const result = bankAccountsResponseSchema.parse(response.data);
    return {
      data: result.data || [],
    };
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/savings-banks/bank-accounts/${id}`);
    return bankAccountSchema.parse(response.data);
  },
};