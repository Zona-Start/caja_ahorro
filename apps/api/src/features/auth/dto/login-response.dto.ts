import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
//import { User} from '@/features/core/users/dtos/user.dto'

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  // user: User, // Usamos el esquema de usuario anidado
});

export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}
