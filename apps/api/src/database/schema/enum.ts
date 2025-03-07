import { pgEnum } from 'drizzle-orm/pg-core';
import { authSchema } from './schemas';
export const statusEnum = authSchema.enum('status', ['ACTIVE', 'INACTIVE']);
export const nationalityEnum = pgEnum('nationality', [
  'VENEZOLANO',
  'EXTRANJERO',
]);
