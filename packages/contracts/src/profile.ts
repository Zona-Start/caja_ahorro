import { z } from 'zod';

export const profileLocalitySchema = z.object({
  id: z.number().int(),
  state: z.string(),
  municipality: z.string(),
  parish: z.string(),
});
export type ProfileLocality = z.infer<typeof profileLocalitySchema>;

export const profileSchema = z.object({
  cedula: z.string(),
  fullname: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  locality: profileLocalitySchema.nullable(),
  editableFields: z.array(z.string()),
});
export type Profile = z.infer<typeof profileSchema>;

export const profileUpdateSchema = z
  .object({
    phone: z.string().max(50).optional(),
    email: z.string().email().max(100).optional(),
    localityId: z.number().int().positive().optional(),
    address: z.string().max(500).optional(),
  })
  .strict();
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
