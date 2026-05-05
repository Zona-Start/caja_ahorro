import { z } from 'zod';

export const disburseSettlementSchema = z.object({
  bankAccountId: z.coerce.number().min(1, 'El banco es requerido'),
  bankReference: z.string().min(1, 'La referencia bancaria es requerida'),
  transferDate: z.coerce.date({ required_error: 'La fecha es requerida' }),
});

export type DisburseSettlementFormData = z.infer<typeof disburseSettlementSchema>;