import { z } from 'zod';

/** Número decimal serializado como string (patrón numérico del ERP). */
export const decimalSchema = z.string();

/** Fecha ISO (YYYY-MM-DD). */
export const dateSchema = z.string();

/** Fecha-hora ISO completa. */
export const dateTimeSchema = z.string();

export const errorSchema = z.object({
  statusCode: z.number().int(),
  message: z.union([z.string(), z.array(z.string())]),
  error: z.string().optional(),
});
export type ErrorResponse = z.infer<typeof errorSchema>;

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  totalCount: z.number().int(),
  totalPages: z.number().int(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/** Envuelve un item en una respuesta paginada. */
export const paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    meta: paginationMetaSchema,
  });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Encapsula un payload de dato con mensaje (patrón del ERP). */
export const dataResponse = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    message: z.string().optional(),
    data,
  });
