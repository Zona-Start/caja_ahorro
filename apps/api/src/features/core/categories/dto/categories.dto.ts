import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CreateCategorySchema = z.object({
  type: z.string().min(1).max(50),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  tenantId: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().uuid().optional(),
  ),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  tenantId: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().uuid().optional(),
  ),
  isActive: z.boolean().optional(),
});

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) { }
export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) { }

export const CategoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  tenantId: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().uuid().optional(),
  ),
  type: z.string().optional(),
  isActive: z.string().optional(),
  search: z.string().optional(),
});

export class CategoryQueryDto extends createZodDto(CategoryQuerySchema) { }
