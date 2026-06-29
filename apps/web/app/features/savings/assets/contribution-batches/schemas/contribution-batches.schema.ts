import { z } from 'zod';

export const contributionBatchSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  type: z.enum(['individual', 'massive']),
  movementType: z.enum(['contribution_patronal', 'contribution_voluntary']),
  entryDate: z.string(),
  associateId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  amountVoluntario: z.string().nullable().optional(),
  amountPatrono: z.string().nullable().optional(),
  amountAsociado: z.string().nullable().optional(),
  totalAmount: z.string(),
  associateCount: z.number(),
  status: z.enum(['completed', 'reversed']),
  accountingEntryId: z.string().nullable().optional(),
  bankTransactionId: z.string().nullable().optional(),
  reversalEntryId: z.string().nullable().optional(),
  bankData: z.any().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  createdById: z.string().nullable().optional(),
  updatedById: z.string().nullable().optional(),
});

export type ContributionBatch = z.infer<typeof contributionBatchSchema>;

export const contributionBatchListResponseSchema = z.object({
  data: z.array(contributionBatchSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export type ContributionBatchListResponse = z.infer<
  typeof contributionBatchListResponseSchema
>;

export const contributionBatchDetailResponseSchema = z.object({
  data: contributionBatchSchema.extend({
    associates: z
      .array(
        z.object({
          id: z.string(),
          cedula: z.string(),
          fullname: z.string(),
          amount: z.string().nullable().optional(),
        }),
      )
      .optional(),
  }),
});

export const reverseBatchResponseSchema = z.object({
  message: z.string(),
});
