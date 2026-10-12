import { forgotPasswordSchema, resetPasswordSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class ForgotPasswordInput extends createZodDto(forgotPasswordSchema) {}
export class ResetPasswordInput extends createZodDto(resetPasswordSchema) {}
