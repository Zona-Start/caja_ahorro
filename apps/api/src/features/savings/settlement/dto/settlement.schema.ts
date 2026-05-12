import { z } from 'zod';

export const CreateSettlementAssociateSchema = z.object({
  associateId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.coerce.date(),
  tenantId: z.string().uuid().optional(),
});

export const DisburseSettlementAssociateSchema = z.object({
  bankAccountId: z.string().uuid(),
  transferDate: z.coerce.date(),
  bankReference: z.string().min(1),
  tenantId: z.string().uuid().optional(),
});

export const UpdateSettlementAssociateSchema = z.object({
  description: z.string().optional(),
});

export type CreateSettlementAssociateDto = z.infer<typeof CreateSettlementAssociateSchema>;
export type DisburseSettlementAssociateDto = z.infer<typeof DisburseSettlementAssociateSchema>;
export type UpdateSettlementAssociateDto = z.infer<typeof UpdateSettlementAssociateSchema>;
