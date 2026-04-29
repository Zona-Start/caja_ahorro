import { createZodDto } from 'nestjs-zod';
import { CreateAccountingRuleSchema } from './create-accounting-rule.dto';

// Creamos el esquema de actualización haciendo que todos los campos sean opcionales
export const UpdateAccountingRuleSchema = CreateAccountingRuleSchema.partial();

// Si necesitas que los detalles también se actualicen parcialmente de forma recursiva,
// Zod ya lo maneja si el esquema original de detalles estaba bien definido,
// pero usualmente con .partial() en el nivel superior es suficiente para el DTO de entrada.

export class UpdateAccountingRuleDto extends createZodDto(
  UpdateAccountingRuleSchema,
) {}
