import { CurrencyCodeEnum } from '@/types/enum';
import { z } from 'zod';

export const CreateAccountingEntryBaseSchema = z.object({
  entryDate: z.coerce.date(),
  description: z.string().min(1, 'La descripción es requerida.'),
  originReferenceId: z.string().optional(),
  originType: z.string().optional(),
  currencyCode: z.nativeEnum(CurrencyCodeEnum),
  details: z
    .array(
      z.object({
        accountPlanId: z.string().uuid(),
        associateId: z.string().uuid().optional().nullable(),
        supplierId: z.string().uuid().optional().nullable(),
        debit: z.coerce.string().default('0.00'),
        credit: z.coerce.string().default('0.00'),
        description: z.string().optional().nullable(),
      }),
    )
    .min(2, 'El asiento debe tener al menos dos líneas.'),
});

export const CreateAccountingEntrySchema =
  CreateAccountingEntryBaseSchema.refine(
    (data) => {
      const totalDebit = data.details.reduce((sum, detail) => {
        const value =
          typeof detail.debit === 'number'
            ? detail.debit
            : Number(detail.debit || 0);
        return sum + value;
      }, 0);

      const totalCredit = data.details.reduce((sum, detail) => {
        const value =
          typeof detail.credit === 'number'
            ? detail.credit
            : Number(detail.credit || 0);
        return sum + value;
      }, 0);

      return Math.abs(totalDebit - totalCredit) < 0.00001;
    },
    {
      message:
        'El asiento no está cuadrado: los débitos y créditos deben ser iguales',
      path: ['details'],
    },
  );

export type CreateAccountingEntryDto = z.infer<
  typeof CreateAccountingEntrySchema
>;
