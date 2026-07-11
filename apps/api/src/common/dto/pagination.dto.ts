import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PaginationSchema = z.object({
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

  tenantId: z
    .string()
    .uuid()
    .optional()
    .describe('Tenant ID (opcional para superadmins)'),
});

export class PaginationDto extends createZodDto(PaginationSchema) {}
