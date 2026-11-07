import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SpecialOperationTypeSchema = z.enum([
  'LIQUIDATION_VS_INCOME',
  'LOAN_WITHDRAWAL_VS_SAVINGS',
]);

export const SpecialOperationMovementTypeSchema = z.enum(['DEBIT', 'CREDIT']);

export const SpecialOperationAccountConfigItemSchema = z.object({
  role: z.string().min(1),
  label: z.string().optional(),
  accountPlanId: z.string().uuid(),
  movementType: SpecialOperationMovementTypeSchema,
  isAuxiliary: z.boolean().default(false),
});

export const PreviewSpecialOperationSchema = z.object({
  tenantId: z.string().uuid().optional(),
  operationType: SpecialOperationTypeSchema,
  operationDate: z.coerce.date().optional(),
});

export const SaveSpecialOperationAccountConfigSchema = z.object({
  tenantId: z.string().uuid().optional(),
  details: z.array(SpecialOperationAccountConfigItemSchema).min(1),
});

export const ExecuteSpecialOperationRowSchema = z.object({
  cedula: z.string().min(1),
  date: z.coerce.date().optional(),
});

export const ExecuteSpecialOperationSchema = z.object({
  tenantId: z.string().uuid().optional(),
  operationType: SpecialOperationTypeSchema,
  operationDate: z.coerce.date(),
  rows: z.array(ExecuteSpecialOperationRowSchema).min(1),
  accountConfig: z.array(SpecialOperationAccountConfigItemSchema).min(1),
  notes: z.string().optional(),
});

export const FilterSpecialOperationSchema = PaginationSchema.extend({
  status: z
    .enum(['PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'])
    .optional(),
  operationType: SpecialOperationTypeSchema.optional(),
});

export class PreviewSpecialOperationDto extends createZodDto(
  PreviewSpecialOperationSchema,
) {}

export class ExecuteSpecialOperationDto extends createZodDto(
  ExecuteSpecialOperationSchema,
) {}

export class SaveSpecialOperationAccountConfigDto extends createZodDto(
  SaveSpecialOperationAccountConfigSchema,
) {}

export class FilterSpecialOperationDto extends createZodDto(
  FilterSpecialOperationSchema,
) {}

export type SpecialOperationType = z.infer<
  typeof SpecialOperationTypeSchema
>;

export type SpecialOperationAccountConfigItem = z.infer<
  typeof SpecialOperationAccountConfigItemSchema
>;

export type ExecuteSpecialOperationRow = z.infer<
  typeof ExecuteSpecialOperationRowSchema
>;

export type ExecuteSpecialOperationInput = z.infer<
  typeof ExecuteSpecialOperationSchema
>;
