import { CurrencyCodeEnum } from '@/types/enum';
import { z } from 'zod';

export const CreateAccountingEntryBaseSchema = z.object({
  entryDate: z.coerce.date(),
  description: z.string().min(1, 'La descripción es requerida.'),
  originReferenceId: z.string().optional(),
  originType: z.string().optional(),
  currencyCode: z.nativeEnum(CurrencyCodeEnum),
  exchangeRate: z.coerce.number().positive().optional(),
  details: z
    .array(
      z.object({
        accountPlanId: z.string().uuid(),
        associateId: z.string().uuid().optional().nullable(),
        supplierId: z.string().uuid().optional().nullable(),
        debit: z.coerce.string().default('0.00'),
        credit: z.coerce.string().default('0.00'),
        debitBase: z.coerce.string().default('0.00'),
        creditBase: z.coerce.string().default('0.00'),
        debitForeign: z.coerce.string().default('0.00'),
        creditForeign: z.coerce.string().default('0.00'),
        exchangeRate: z.coerce.number().positive().optional(),
        currencyCode: z.nativeEnum(CurrencyCodeEnum).optional(),
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

      if (Math.abs(totalDebit - totalCredit) >= 0.00001) {
        return false;
      }

      // Validar balance en moneda extranjera si se suministran importes foreign.
      const totalForeignDebit = data.details.reduce(
        (sum, detail) => sum + Number(detail.debitForeign || 0),
        0,
      );
      const totalForeignCredit = data.details.reduce(
        (sum, detail) => sum + Number(detail.creditForeign || 0),
        0,
      );
      const hasForeign = data.details.some(
        (detail) =>
          Number(detail.debitForeign || 0) > 0 ||
          Number(detail.creditForeign || 0) > 0,
      );

      if (
        hasForeign &&
        Math.abs(totalForeignDebit - totalForeignCredit) >= 0.00001
      ) {
        return false;
      }

      return true;
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
