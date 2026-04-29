import { z } from 'zod';

export const creditDebitNoteSchema = z
  .object({
    supplierId: z.number({ required_error: 'El proveedor es requerido.' }),
    accountsPayableId: z.number().optional(),
    transactionType: z.enum(['CREDIT_NOTE', 'DEBIT_NOTE']),
    amount: z.coerce.number().positive('El monto debe ser mayor a cero.'),
    reason: z.string().min(1, 'El concepto es requerido.'),
    observations: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.transactionType === 'DEBIT_NOTE') {
        return data.accountsPayableId !== undefined;
      }
      return true;
    },
    {
      message: 'La cuenta por pagar es requerida para las notas de débito.',
      path: ['accountsPayableId'],
    },
  );

export type CreditDebitNote = z.infer<typeof creditDebitNoteSchema>;
