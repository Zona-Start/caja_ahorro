import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PermissionPaginationSchema = z.object({
  page: z
    .preprocess((val) => Number(val), z.number().int().min(1))
    .default(1)
    .optional(),

  limit: z
    .preprocess((val) => Number(val), z.number().int().min(1))
    .default(10)
    .optional(),

  search: z.string().optional(),

  searchType: z.string().optional(),

  sortBy: z.string().default('id').optional(),

  sortOrder: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: "El orden debe ser 'asc' o 'desc'" }),
    })
    .default('asc')
    .optional(),

  resource: z.string().optional().describe('Filtrar por resource'),

  action: z.string().optional().describe('Filtrar por action'),

  scope: z.string().optional().describe('Filtrar por scope'),
});

export class PermissionPaginationDto extends createZodDto(
  PermissionPaginationSchema,
) {}
