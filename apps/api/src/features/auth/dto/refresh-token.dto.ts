import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'El token de refresco es obligatorio'),
});

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
