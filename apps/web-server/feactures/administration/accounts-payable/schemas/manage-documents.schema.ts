import { z } from 'zod';

const supplierSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const accountsPayableSchema = z.object({
  accountsPayableNumber: z.string(),
});

const applicationSchema = z.object({
  accountsPayableNumber: z.string(),
  appliedAmount: z.number(),
});

export const advanceSchema = z.object({
  id: z.number(),
  transactionNumber: z.string(),
  supplier: supplierSchema,
  amount: z.string(),
  availableAmount: z.string(),
  status: z.string(),
  statusPayment: z.string(),
  isAuthorizePayment: z.boolean(),
  //applications: z.array(applicationSchema).optional(),
});

export const creditNoteSchema = z.object({
  id: z.number(),
  transactionNumber: z.string(),
  supplier: supplierSchema,
  accountsPayable: accountsPayableSchema.optional().nullable(),
  amount: z.string(),
  availableAmount: z.string(),
  status: z.string(),
  reason: z.string(),
  //applications: z.array(applicationSchema).optional(),
});

export const debitNoteSchema = z.object({
  id: z.number(),
  transactionNumber: z.string(),
  supplier: supplierSchema,
  accountsPayable: accountsPayableSchema,
  amount: z.string(),
  status: z.string(),
  reason: z.string(),
  //applications: z.array(applicationSchema).optional(),
});

export type Advance = z.infer<typeof advanceSchema>;
export type CreditNote = z.infer<typeof creditNoteSchema>;
export type DebitNote = z.infer<typeof debitNoteSchema>;

export const getSupplierTransactionAdvanceApiSchema = z.object({
  message: z.string(),
  data: z.array(advanceSchema),
});

export const getSupplierTransactionNoteCreditApiSchema = z.object({
  message: z.string(),
  data: z.array(creditNoteSchema),
});

export const getSupplierTransactionNoteDebitApiSchema = z.object({
  message: z.string(),
  data: z.array(debitNoteSchema),
});

//scehama paa mutacion autorizar pago avance
export const autorizeAdvanceResponseSchema = z.object({
  message: z.string(),
});

//scehama consultar por anticipo o nota de credito que cuentas se ha usado
export const getAppliedTransaccionResponseSchema = z.object({
  id: z.number(),
  accounPayableRefence: z.string().nullable(),
  amountApplied: z.string(),
});

export const getAppliedTransaccionApiSchema = z.object({
  message: z.string(),
  data: z.array(getAppliedTransaccionResponseSchema),
});

export type AppliedTransaction = z.infer<
  typeof getAppliedTransaccionResponseSchema
>;
