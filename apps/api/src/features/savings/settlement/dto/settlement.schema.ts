import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const FilterSettlementAssociateSchema = PaginationSchema.extend({
  status: z.string().optional(),
});

export class FilterSettlementAssociateDto extends createZodDto(
  FilterSettlementAssociateSchema,
) {}

export const BeneficiarySchema = z.object({
  fullname: z.string().min(3, 'El nombre completo es requerido'),
  cedula: z.string().min(6, 'La cédula es requerida'),
  phone: z.string().optional(),
  accountNumber: z.string().min(10, 'El número de cuenta es requerido'),
  bankName: z.string().optional(),
  bankId: z.string().optional(),
});

export const CreateSettlementAssociateSchema = z.object({
  associateId: z.string().uuid(),
  date: z.coerce.date(),
  notes: z.string().optional(),
  beneficiary: BeneficiarySchema.optional(),
  tenantId: z.string().uuid().optional(),
});

export const CreateBulkSettlementAssociateSchema = z.object({
  tenantId: z.string().uuid().optional(),
  // Datos bancarios OPCIONALES: si se envían, las liquidaciones se desembolsan.
  bankAccountId: z.string().uuid().optional(),
  transferDate: z.coerce.date().optional(),
  bankReference: z.string().optional(),
});

export const DisburseSettlementAssociateSchema = z.object({
  bankAccountId: z.string().uuid(),
  transferDate: z.coerce.date(),
  bankReference: z.string().optional(),
  tenantId: z.string().uuid().optional(),
});

export const UpdateSettlementAssociateSchema = z.object({
  description: z.string().optional(),
});

export type CreateSettlementAssociateDto = z.infer<
  typeof CreateSettlementAssociateSchema
>;
export type CreateBulkSettlementAssociateDto = z.infer<
  typeof CreateBulkSettlementAssociateSchema
>;
export type DisburseSettlementAssociateDto = z.infer<
  typeof DisburseSettlementAssociateSchema
>;
export type UpdateSettlementAssociateDto = z.infer<
  typeof UpdateSettlementAssociateSchema
>;
