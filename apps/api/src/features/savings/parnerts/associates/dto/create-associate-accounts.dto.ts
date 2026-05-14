import { CurrencyCodeEnum, StatusEnum } from '@/types/enum';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateAssociateAccountsSchema = z.object({
  tenantId: z.string().uuid().optional(),
  associateId: z.string().uuid(),
  accountNumber: z.string().min(1),
  currencyCode: z.nativeEnum(CurrencyCodeEnum),
  balance: z.coerce.number().optional(),
  openingDate: z.coerce.date().optional(),
  bankDirectoryId: z.string().uuid(),
  status: z.nativeEnum(StatusEnum).optional(),
});

export class CreateAssociateAccountsDto extends createZodDto(
  CreateAssociateAccountsSchema,
) {}
