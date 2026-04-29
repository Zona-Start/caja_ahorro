import { createZodDto } from "nestjs-zod";
import { z } from "zod";

// --- Global Settings ---
export const CreateGlobalSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
  description: z.string().optional(),
  category: z.string().max(50).default("general"),
});

export const UpdateGlobalSettingSchema = z.object({
  value: z.string().optional(),
  description: z.string().optional(),
  category: z.string().max(50).optional(),
});

export class CreateGlobalSettingDto extends createZodDto(CreateGlobalSettingSchema) {}
export class UpdateGlobalSettingDto extends createZodDto(UpdateGlobalSettingSchema) {}

// --- Module Settings ---
export const CreateModuleSettingSchema = z.object({
  tenantId: z.string().uuid(),
  module: z.string().min(1).max(50),
  submodule: z.string().max(50).default(""),
  key: z.string().min(1).max(100),
  value: z.string(),
  description: z.string().optional(),
});

export const UpdateModuleSettingSchema = z.object({
  value: z.string().optional(),
  description: z.string().optional(),
});

export class CreateModuleSettingDto extends createZodDto(CreateModuleSettingSchema) {}
export class UpdateModuleSettingDto extends createZodDto(UpdateModuleSettingSchema) {}

// --- Queries ---
export const SettingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  category: z.string().optional(),
  module: z.string().optional(),
  submodule: z.string().optional(),
  search: z.string().optional(),
  tenantId: z.string().uuid().optional(),
});

export class SettingsQueryDto extends createZodDto(SettingsQuerySchema) {}