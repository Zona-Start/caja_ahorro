import { AccountNatureEnum, AccountTypeEnum } from '@/types/enum';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Definimos el esquema de validación
export const CreateAccountPlanSchema = z.object({
  tenantId: z
    .string()
    .optional()
    .describe('Tenant ID (opcional para superadmins)'),
  code: z
    .string()
    .min(1, 'El código es requerido')
    .max(50, 'El código no puede exceder los 50 caracteres'),
  name: z.string().min(1, 'El nombre es requerido'),
  accountType: z.nativeEnum(AccountTypeEnum, {
    errorMap: () => ({ message: 'Tipo de cuenta inválido' }),
  }),
  description: z.string().optional(),
  nature: z.nativeEnum(AccountNatureEnum, {
    errorMap: () => ({
      message: 'Naturaleza de cuenta inválida (DEBIT/CREDIT)',
    }),
  }),
  level: z.number().int().positive(),
  allowsMovements: z.boolean({
    required_error: 'Debe especificar si permite movimientos',
  }),
  isActive: z.boolean().default(true).optional(),
  parentAccountId: z.string().uuid().optional().nullable(),
});

// Creamos la clase DTO compatible con NestJS y Swagger
export class CreateAccountPlanDto extends createZodDto(
  CreateAccountPlanSchema,
) {}
