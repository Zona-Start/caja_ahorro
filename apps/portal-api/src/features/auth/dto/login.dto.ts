import { loginInputSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class LoginInput extends createZodDto(loginInputSchema) {}
