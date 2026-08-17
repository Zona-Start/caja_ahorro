import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginInputSchema = z.object({
  identifier: z.string().min(1, 'El usuario o correo es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  tenantId: z.string().uuid().optional(),
});

export class LoginInput extends createZodDto(LoginInputSchema) {}
