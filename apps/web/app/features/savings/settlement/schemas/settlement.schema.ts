import { z } from 'zod';

export const beneficiarySchema = z.object({
  fullname: z.string().optional(),
  cedula: z.string().optional(),
  phone: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankId: z.string().optional(),
});

export type BeneficiaryForm = z.infer<typeof beneficiarySchema>;

export const settlementSchema = z
  .object({
    associateId: z.string().min(1, 'El asociado es requerido'),
    date: z.coerce.date(),
    notes: z.string().optional(),
    hasBeneficiary: z.boolean().default(false),
    beneficiary: beneficiarySchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasBeneficiary) {
      if (!data.beneficiary || !data.beneficiary.fullname || data.beneficiary.fullname.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El nombre completo del beneficiario es requerido (mín. 3 caracteres)',
          path: ['beneficiary'],
        });
      }
      if (!data.beneficiary || !data.beneficiary.cedula || data.beneficiary.cedula.trim().length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La cédula del beneficiario es requerida (mín. 6 dígitos)',
          path: ['beneficiary'],
        });
      }
    }
  });

export type Settlement = z.infer<typeof settlementSchema>;
