import { z } from 'zod';

export const localityItemSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});
export type LocalityItem = z.infer<typeof localityItemSchema>;

export const resolveLocalityQuerySchema = z.object({
  stateId: z.coerce.number().int().positive(),
  municipalityId: z.coerce.number().int().positive(),
  parishId: z.coerce.number().int().positive(),
});
export type ResolveLocalityQuery = z.infer<typeof resolveLocalityQuerySchema>;

export const byStateQuerySchema = z.object({
  stateId: z.coerce.number().int().positive(),
});
export type ByStateQuery = z.infer<typeof byStateQuerySchema>;

export const byMunicipalityQuerySchema = z.object({
  municipalityId: z.coerce.number().int().positive(),
});
export type ByMunicipalityQuery = z.infer<typeof byMunicipalityQuerySchema>;
