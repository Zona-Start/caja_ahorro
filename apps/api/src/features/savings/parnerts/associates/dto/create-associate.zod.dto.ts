import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { GenderEnum, NationalityEnum, StatusEnum } from '@/types/enum';

export const CreateAssociateSchema = z.object({
  tenantId: z.string().uuid().optional(),
  cedula: z.string().min(1),
  fullname: z.string().min(1),
  nationality: z.nativeEnum(NationalityEnum),
  gender: z.nativeEnum(GenderEnum),
  birthdate: z.coerce.date(),
  dateAdmission: z.coerce.date(),
  dateGraduation: z.coerce.date().optional().nullable(),
  discountFrequencyId: z.coerce.number().int().optional().nullable(),
  status: z.nativeEnum(StatusEnum).default(StatusEnum.ACTIVE).optional(),
  isPayrollCredit: z.coerce.boolean().default(false).optional(),
  localityId: z.coerce.number().int().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  payrollTypeId: z.string().uuid().optional().nullable(),
  associatedTypeId: z.string().uuid().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  baseSalary: z.coerce.number(),
  accountNumber: z.string().min(1),
  bankDirectoryId: z.string().uuid(),
});

export const UpdateAssociateSchema = CreateAssociateSchema.partial();

export class CreateAssociateDto extends createZodDto(CreateAssociateSchema) {}
export class UpdateAssociateDto extends createZodDto(UpdateAssociateSchema) {};
