import { authSchema } from './schemas';
export const statusEnum = authSchema.enum('status', ['ACTIVE', 'INACTIVE']);
