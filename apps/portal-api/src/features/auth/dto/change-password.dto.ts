import { changePasswordInputSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class ChangePasswordInput extends createZodDto(
  changePasswordInputSchema,
) {}
