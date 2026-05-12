import { z } from 'zod';
import { paymentMethodEnum } from './settlement-options';

export const beneficiarySchema = z.object({
  fullname: z.string().min(3, 'El nombre completo es requerido'),
  cedula: z.string().min(6, 'La cédula es requerida'),
  phone: z.string().optional(),
  accountNumber: z.string().min(20, 'El número de cuenta es requerido'),
  bankDirectoryId: z
    .number()
    .int()
    .positive('Debe seleccionar un banco válido'),
});

export const settlementSchema = z
  .object({
    id: z.number().optional(),
    associateId: z.number(),
    netLiquidationAmount: z.number(),
    totalOutstandingCreditsAtLiquidation: z.number(),
    totalOutstandingLoansAtLiquidation: z.number(),
    totalSavingsBalanceAtLiquidation: z.number(),
    liquidationDate: z.date(),
    notes: z.string().optional(),
    paymentMethod: paymentMethodEnum,
    hasBeneficiary: z.boolean(),
    beneficiary: z.array(beneficiarySchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.hasBeneficiary &&
      (!data.beneficiary || data.beneficiary.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Debe especificar al menos un beneficiario si la opción está seleccionada.',
        path: ['beneficiary'],
      });
    }
  });

export type Settlement = z.infer<typeof settlementSchema>;