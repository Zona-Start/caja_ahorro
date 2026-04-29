import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateAccountingEntryDetailSchema = z
  .object({
    // Asumiendo el cambio a UUID que estamos aplicando en todo el sistema
    accountPlanId: z
      .string()
      .uuid({ message: 'El ID de la cuenta debe ser un UUID válido' }),

    debit: z.coerce
      .string()
      .min(0, 'El débito no puede ser negativo')
      .default('0.00'),

    credit: z.coerce
      .string()
      .min(0, 'El crédito no puede ser negativo')
      .default('0.00'),
    associateId: z.string().uuid().optional().nullable(),
    supplierId: z.string().uuid().optional().nullable(),
    description: z
      .string()
      .max(255, 'La descripción es muy larga')
      .optional()
      .nullable(),
  })
  .refine(
    (data) =>
      (Number(data.debit) > 0 && Number(data.credit) === 0) ||
      (Number(data.credit) > 0 && Number(data.debit) === 0),
    {
      message:
        'Debe haber un monto en débito o en crédito, pero no en ambos simultáneamente',
      path: ['debit'], // El error se marcará en el campo debit
    },
  );

export class CreateAccountingEntryDetailDto extends createZodDto(
  CreateAccountingEntryDetailSchema,
) {}
