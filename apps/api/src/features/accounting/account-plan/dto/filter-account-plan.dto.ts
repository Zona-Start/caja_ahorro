import { AccountTypeEnum } from '@/types/enum';
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from 'src/common/dto/pagination.dto';
import { z } from 'zod';

// Extendemos el esquema de paginación que ya creamos
export const FilterAccountPlanSchema = PaginationSchema.extend({
  type: z
    .nativeEnum(AccountTypeEnum, {
      errorMap: () => ({ message: 'Tipo de cuenta inválido' }),
    })
    .optional(),

  level: z.string().optional(),
});

// Creamos la clase DTO
export class FilterAccountPlanDto extends createZodDto(
  FilterAccountPlanSchema,
) {}
