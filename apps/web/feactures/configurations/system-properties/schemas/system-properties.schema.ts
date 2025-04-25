import { z } from 'zod';

export const settingSystemSchema = z.object({
  id: z.number().optional(),
  key: z.string(),
  value: z.string(),
  description: z.string().nullable(),
  group: z.string().nullable(),
});

export type SettingSystem = z.infer<typeof settingSystemSchema>;

// Response schemas for the API
export const settingSystemResponseSchema = z.object({
  message: z.string(),
  data: settingSystemSchema,
});

// export const settingSystemAllResponseSchema = z.object({
//   message: z.string(),
//   data: z.array(settingSystemSchema),
// });

export const settingSystemAllResponseSchema = z.object({
  message: z.string(),
  data: z.array(settingSystemSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      nextPage: z.number().nullable(),
      previousPage: z.number().nullable(),
    })
    .optional(),
});
