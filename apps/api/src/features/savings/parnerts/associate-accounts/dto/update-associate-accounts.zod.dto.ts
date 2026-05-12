import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UpdateAssociateAccountsSchema = z.object({
  tenantId: z.string().uuid().optional(),
  associateId: z.string().uuid().optional(),
  accountNumber: z.string().optional(),
  currencyCode: z.string().optional(),
  openingDate: z.coerce.date().optional(),
  closingDate: z.coerce.date().optional().nullable(),
  bankDirectoryId: z.string().uuid().optional(),
  status: z.string().optional(),
});

export class UpdateAssociateAccountsDto extends createZodDto(UpdateAssociateAccountsSchema) {}
