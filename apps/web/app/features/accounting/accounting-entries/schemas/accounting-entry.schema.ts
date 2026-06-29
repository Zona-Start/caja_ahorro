import { z } from 'zod';
import { ENTRY_STATUS } from './accounting-entry-options';

const statusEnum = z.enum(Object.keys(ENTRY_STATUS) as [string, ...string[]]);

export const accountingEntryDetailSchema = z.object({
  id: z.string().optional(),
  accountPlanId: z.string({ required_error: 'La cuenta es requerida.' }),
  debit: z.number().min(0, 'El débito debe ser un valor positivo.'),
  credit: z.number().min(0, 'El crédito debe ser un valor positivo.'),
  description: z.string().optional(),
  account: z
    .object({
      code: z.string(),
      name: z.string(),
    })
    .optional(),
});

export const accountingEntrySchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().optional(),
  entryDate: z.coerce.date({ required_error: 'La fecha es requerida.' }),
  description: z.string().min(1, 'La descripción es requerida.'),
  voucherNo: z.string().optional().nullable(),
  originReferenceId: z.string().optional(),
  originType: z.string().optional(),
  status: statusEnum.optional(),
  postedAt: z.coerce.date().optional(),
  createdAt: z.string().optional().nullable(),
  currencyCode: z.string().min(1, 'La moneda es requerida.'),
  details: z
    .array(accountingEntryDetailSchema)
    .min(2, 'El asiento debe tener al menos dos líneas.')
    .refine(
      (details) => {
        const totalDebit = details.reduce((sum, d) => sum + d.debit, 0);
        const totalCredit = details.reduce((sum, d) => sum + d.credit, 0);
        // Use a small epsilon for floating point comparison if needed, 
        // but here we are using numbers which might be floats.
        return Math.abs(totalDebit - totalCredit) < 0.01;
      },
      {
        message: 'El total de débitos debe ser igual al total de créditos.',
        path: ['details'],
      },
    )
    .refine(
      (details) => {
        const total = details.reduce((sum, d) => sum + d.debit, 0);
        return total > 0;
      },
      {
        message: 'El asiento no puede tener un total de cero.',
        path: ['details'],
      },
    ),
});

export type AccountingEntry = z.infer<typeof accountingEntrySchema>;
export type AccountingEntryDetail = z.infer<typeof accountingEntryDetailSchema>;
