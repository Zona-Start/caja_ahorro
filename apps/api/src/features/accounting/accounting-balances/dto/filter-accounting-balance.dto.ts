import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from 'src/common/dto/pagination.dto';
import { z } from 'zod';

// Extendemos el esquema base de paginación
export const FilterAccountingBalanceSchema = PaginationSchema.extend({
  accountingCycleId: z
    .string()
    .uuid({ message: 'El ID del ciclo contable debe ser un UUID válido' })
    .optional(),

  tenantId: z
    .string()
    .uuid({ message: 'El ID del tenant debe ser un UUID válido' })
    .optional(),
});

// Definimos la clase DTO para NestJS
export class FilterAccountingBalanceDto extends createZodDto(
  FilterAccountingBalanceSchema,
) {}
