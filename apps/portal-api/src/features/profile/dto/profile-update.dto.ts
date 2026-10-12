import { profileUpdateSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class ProfileUpdateInput extends createZodDto(profileUpdateSchema) {}
