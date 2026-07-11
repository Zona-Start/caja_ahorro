import { createZodDto } from 'nestjs-zod';
import { CreateAccountPlanSchema } from './create-account-plan.dto';

// .partial() hace que todos los campos de CreateAccountPlanSchema sean opcionales
export const UpdateAccountPlanSchema = CreateAccountPlanSchema.partial();

export class UpdateAccountPlanDto extends createZodDto(
  UpdateAccountPlanSchema,
) {}
