import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

export const typePayrollSchema = z.object({
  id: z.number().optional(),
  code: z.string(),
  description: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const typePayrollResponseAllSchema = z.object({
  message: z.string(),
  data: z.array(typePayrollSchema),
});

export type TypePayroll = z.infer<typeof typePayrollSchema>;

export const typePayrollService = {
  getAll: async () => {
    const response = await apiClient.get('/core/type-payroll');
    return typePayrollResponseAllSchema.parse(response.data);
  },
};
