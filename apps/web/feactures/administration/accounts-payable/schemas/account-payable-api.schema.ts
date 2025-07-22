import { z } from 'zod';

export const accountPayableApiSchema = z.object({
  id: z.number(),
  supplierInvoiceId: z.number(),
  originalAmount: z.number(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  currencyCode: z.string(),
  status: z.string(),
  observations: z.string().optional().nullable(),
  supplierInvoice: z.object({
    invoiceNumber: z.string(),
    supplierName: z.string(),
  }).optional(),
});

export type AccountPayableSchemaAPI = z.infer<typeof accountPayableApiSchema>;

export const accountPayableMutationResponseSchema = z.object({
  message: z.string(),
});

export const accountPayableAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(accountPayableApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      nextPage: z.number().nullable(),
      previousPage: z.number().nullable(),
    })
    .optional(),
});

export const accountPayableResponseOneSchema = z.object({
  message: z.string(),
  data: accountPayableApiSchema,
});
