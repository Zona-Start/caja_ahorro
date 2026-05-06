import { z } from 'zod';
import { userSchema } from './users.schema';

export const usersMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export const usersListResponseSchema = z.object({
  data: z.array(userSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export const userResponseSchema = userSchema;

export const userDeleteResponseSchema = z.object({
  message: z.string(),
});

export const managePermissionsResponseSchema = z.object({
  message: z.string(),
});