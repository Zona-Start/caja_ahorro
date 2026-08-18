import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateTenantDomainSchema = z.object({
  domain: z
    .string()
    .min(3)
    .max(255)
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i,
      'Dominio inválido',
    ),
  isPrimary: z.boolean().default(false),
});

export const VerifyTenantDomainSchema = z.object({
  verificationToken: z.string().min(1),
});

export class CreateTenantDomainDto extends createZodDto(
  CreateTenantDomainSchema,
) {}
export class VerifyTenantDomainDto extends createZodDto(
  VerifyTenantDomainSchema,
) {}
