import { z } from 'zod';
import { permissionSchema } from './permissions.schema';

export const permissionMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  nextPage: z.number().nullable(),
  previousPage: z.number().nullable(),
});

export const permissionsPaginatedResponseSchema = z.object({
  data: z.array(permissionSchema),
  meta: permissionMetaSchema,
});

export const permissionsListResponseSchema = z.array(permissionSchema);
export const permissionResponseSchema = permissionSchema;
export const permissionDeleteResponseSchema = z.object({
  message: z.string(),
});