import { z } from 'zod';

//scehama paa consulta datos de cuenta por pagar y anticipos
export const accountPayableApiSchema = z.object({
  id: z.number(),
  supplierId: z.number().nullable(),
  supplierName: z.string().nullable(),
  reference: z.string(),
  amount: z.string(),
  status: z.string(),
  date: z.string(),
  type: z.string(),
});

export type AccountPayableSchemaAPI = z.infer<typeof accountPayableApiSchema>;

//scehama paa consulta datos de cuenta por pagar y anticipos
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

/////******* por revisar  de aqui apra abajo */
//scehama paa mutacion anular  cuenta por pagar y autorizar  pago
export const accountPayableMutationResponseSchema = z.object({
  message: z.string(),
});

export const accountPayableResponseOneSchema = z.object({
  message: z.string(),
  data: accountPayableApiSchema,
});

//response mutation advance supplier
export const supplierMutationResponseSchema = z.object({
  id: z.number(),
  transactionNumber: z.string(),
  transactionType: z.string(),
  transactionDate: z.string(),
  amount: z.string(),
  currencyCode: z.string(),
  status: z.string(),
  observations: z.string().nullable(),
  createdById: z.number(),
});
//response mutation advance supplier
export const supplierMutationResponseApiSchema = z.object({
  message: z.string(),
  data: supplierMutationResponseSchema,
});

//schema para consultar una cuanta por pagar para pagos
export const oneSupplierPaymentResponseSchema = z.object({
  account: z.object({
    id: z.number(),
    supplierId: z.number(),
    supplierName: z.string(),
    accountsPayableNumber: z.string(),
    amount: z.string(),
    paidAmount: z.string(),
    remaingAmount: z.string(),
    invoiceNumber: z.string(),
  }),
  note: z
    .array(
      z.object({
        id: z.number(),
        referenceNote: z.string(),
        appliedAmount: z.string(),
      }),
    )
    .optional()
    .nullable(),
});

export type OneSupplierPaymentSchemaAPI = z.infer<
  typeof oneSupplierPaymentResponseSchema
>;

//schema para consultar una cuanta por pagar para pagos
export const oneSupplierPaymentResponseApiSchema = z.object({
  message: z.string(),
  data: oneSupplierPaymentResponseSchema,
});
