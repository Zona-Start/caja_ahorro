import { z } from 'zod';
import { ENTRY_STATUS } from './accounting-entry-options';

const statusEnum = z.enum(Object.keys(ENTRY_STATUS) as [string, ...string[]]);

export const accountingEntryDetailSchema = z.object({
  id: z.number().optional(),
  accountPlanId: z.number({ required_error: 'La cuenta es requerida.' }),
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
  id: z.number().optional(),
  companyId: z.number(),
  accountingCycleId: z.number({
    required_error: 'El ciclo contable es requerido.',
  }),
  entryDate: z.date({ required_error: 'La fecha es requerida.' }),
  description: z.string().min(1, 'La descripción es requerida.'),
  voucherNo: z.string().optional().nullable(),
  originReferenceId: z.string().optional(),
  originType: z.string().optional(),
  status: statusEnum.optional(),
  postedAt: z.union([z.date(), z.string()]).optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  currencyCode: z.string().min(1, 'La moneda es requerida.'),
  details: z
    .array(accountingEntryDetailSchema)
    .min(2, 'El asiento debe tener al menos dos líneas.')
    .refine(
      (details) => {
        const totalDebit = details.reduce((sum, d) => sum + d.debit, 0);
        const totalCredit = details.reduce((sum, d) => sum + d.credit, 0);
        return totalDebit === totalCredit;
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

// API Response Schemas
