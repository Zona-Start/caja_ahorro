import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { AccountTypeEnum } from '@/types/enum';
import { PaginationSchema } from 'src/common/dto/pagination.dto';

// Extendemos el esquema de paginación que ya creamos
export const FilterAccountPlanSchema = PaginationSchema.extend({
  type: z
    .nativeEnum(AccountTypeEnum, {
      errorMap: () => ({ message: "Tipo de cuenta inválido" }),
    })
    .optional(),

  level: z
    .string()
    .optional(),
});

// Creamos la clase DTO
export class FilterAccountPlanDto extends createZodDto(FilterAccountPlanSchema) {}