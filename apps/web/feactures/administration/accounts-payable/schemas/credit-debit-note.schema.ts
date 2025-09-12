import { z } from 'zod';

//schema para notas de credito y debito
export const creditDebitNoteSchema = z.object({
  accountsPayableId: z.number(),
  transactionType: z.enum(['CREDIT_NOTE', 'DEBIT_NOTE']),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero.'),
  reference: z.string().optional(),
  observations: z.string().optional(),
});

export type CreditDebitNote = z.infer<typeof creditDebitNoteSchema>;
