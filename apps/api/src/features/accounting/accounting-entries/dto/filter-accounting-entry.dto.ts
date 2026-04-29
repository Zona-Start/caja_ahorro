import { entryStatusEnum } from '@/types/enum'; // Asegúrate de que sea un enum de TS o un objeto const
import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from 'src/common/dto/pagination.dto';
import { z } from 'zod';

export const FilterAccountingEntrySchema = PaginationSchema.extend({
  // IDs como UUID (ajustados desde number por consistencia con Drizzle)
  tenantId: z
    .string()
    .uuid({ message: 'El ID del tenant debe ser un UUID válido' })
    .optional(),
  accountingCycleId: z
    .string()
    .uuid({ message: 'El ID del ciclo debe ser un UUID válido' })
    .optional(),

  accountPlanId: z
    .string()
    .uuid({ message: 'El ID de la cuenta debe ser un UUID válido' })
    .optional(),

  // Enum de estado
  status: z
    .nativeEnum(entryStatusEnum, {
      errorMap: () => ({ message: 'Estado de asiento no válido' }),
    })
    .optional(),

  // Referencias de origen
  originType: z.string().optional(),
  originReferenceId: z.string().optional(),

  // Rango de fechas con coerción automática
  startDate: z.coerce
    .date({ invalid_type_error: 'Fecha de inicio inválida' })
    .optional(),

  endDate: z.coerce
    .date({ invalid_type_error: 'Fecha de fin inválida' })
    .optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'La fecha de inicio no puede ser mayor a la fecha de fin',
    path: ['startDate'],
  },
);

export class FilterAccountingEntryDto extends createZodDto(
  FilterAccountingEntrySchema,
) {}
