import { pgEnum } from 'drizzle-orm/pg-core';
import { authSchema } from './schemas';
export const statusEnum = authSchema.enum('status', ['ACTIVE', 'INACTIVE']);
export const genderEnum = authSchema.enum('gender', ['FEMENINO', 'MASCULINO']);
export const nationalityEnum = pgEnum('nationality', [
  'VENEZOLANO',
  'EXTRANJERO',
]);
