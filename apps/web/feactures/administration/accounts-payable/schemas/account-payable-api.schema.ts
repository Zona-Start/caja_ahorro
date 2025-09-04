import { z } from 'zod';

export const accountPayableApiSchema = z.object({
  id: z.number(),
  accountsPayableNumber: z.string(),
  supplierName: z.string().nullable(),
  supplierId: z.number().nullable(),
  supplierInvoiceId: z.number().nullable(),
  originalAmount: z.string(),
  paidAmount: z.string(),
  remainingAmount: z.string(),
  status: z.string(),
  observations: z.string().optional().nullable(),
  supplierInvoice: z
    .object({
      invoiceNumber: z.string().nullable(),
    })
    .optional()
    .nullable(),
  createdAt: z.string(),
  dueDate: z.string().nullable(),
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
