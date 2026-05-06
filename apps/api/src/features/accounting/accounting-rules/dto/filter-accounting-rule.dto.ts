import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from 'src/common/dto/pagination.dto';

// Extendemos el esquema de paginación que ya creamos
export const FilterAccountingRulesSchema = PaginationSchema.extend({});

// Creamos la clase DTO
export class FilterAccountingRulesDto extends createZodDto(
  FilterAccountingRulesSchema,
) {}
