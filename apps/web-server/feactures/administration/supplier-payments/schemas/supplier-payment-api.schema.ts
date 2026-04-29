import { z } from 'zod';
import { AccountPayableStatusEnum } from '../../accounts-payable/schemas';

// schema para buscar los pagos realizados
export const supplierPaymentLineSchema = z.object({
  id: z.number(),
  supplierPaymentId: z.number(),
  accountsPayableId: z.number().nullable(),
  amount: z.number(),
  description: z.string().nullable(),
});

// schema para buscar los pagos realizados
export const supplierPaymentSchema = z.object({
  id: z.number(),
  paymentNumber: z.string(),
  supplierId: z.number(),
  supplierName: z.string().optional(),
  totalAmount: z.number(),
  currencyCode: z.string(),
  paymentMethod: z.string(),
  bankAccountId: z.number().nullable(),
  bankReference: z.string().nullable(),
  accountPayableNumber: z.string().nullable(),
  status: z.string(),
  requestedAt: z.string(),
  processedAt: z.string().nullable(),
  reversedAt: z.string().nullable(),
  observations: z.string().nullable(),
  lines: z.array(supplierPaymentLineSchema),
});

// schema para buscar los pagos realizados
export const supplierPaymentAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(supplierPaymentSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    nextPage: z.number().nullable(),
    previousPage: z.number().nullable(),
  }),
});

//squema retorno de la api al procesar pago de advance
export const payAdvanceMutationResponseSchema = z.object({
  id: z.number(),
  reference: z.string(),
});

////por revisar ****/////
export const reversePaymentMutationResponseSchema = z.object({
  message: z.string(),
});

export type SupplierPayment = z.infer<typeof supplierPaymentSchema>;

export const masivePaymentMutationResponseSchema = z.object({
  message: z.string(),
});

export const supplierPaymentMutationResponseSchema = z.object({
  data: z.object({
    id: z.number(),
    reference: z.string(),
  }),
});

export const accountPayableSchema = z.object({
  id: z.number().optional(),
  supplierId: z.number(),
  supplierName: z.string(),
  supplierInvoiceId: z.number(),
  originalAmount: z.coerce.number(),
  paidAmount: z.coerce.number().optional().nullable(),
  remainingAmount: z.coerce
    .number()
    .min(0, 'El monto restante no puede ser negativo'),
  status: z
    .nativeEnum(AccountPayableStatusEnum)
    .default(AccountPayableStatusEnum.PENDING),
  observations: z.string().optional().nullable(),
  supplierInvoice: z
    .object({
      invoiceNumber: z.string(),
    })
    .optional()
    .nullable(),
  createdAt: z.string(),
  dueDate: z.string(),
});

export type AccountPayableApi = z.infer<typeof accountPayableSchema>;

export const jsonCredits = z.array(
  z.object({
    cxpId: z.number(),
    amount: z.number(),
    origin: z.string(),
    cxpNumber: z.string(),
  }),
);

export const supplierAdvancedCredit = z.object({
  id: z.number(),
  transactionNumber: z.string(),
  transactionType: z.string(),
  availableAmount: z.string(),
});

export const supplierAdvancedCreditSchema = z.object({
  message: z.string(),
  data: z.array(supplierAdvancedCredit).optional().nullable(),
});
