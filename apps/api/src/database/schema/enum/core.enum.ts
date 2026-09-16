import { pgEnum } from 'drizzle-orm/pg-core';

export const businessTypeEnum = pgEnum('business_type', [
  'CAJA_AHORRO',
  'EMPRESA_COMERCIAL',
  'EMPRESA_CORPORATIVA'
]);

export const moduleCodeEnum = pgEnum('module_code', [
  'ACCOUNTING',
  'LOANS',
  'CREDITS',
  'SAVINGS',
  'INVENTORY',
  'PURCHASING',
  'SALES',
  'BANKING',
  'TREASURY',
  'HR_PAYROLL',
  'AUDIT',
  'IAM',
  'SYSTEM',
]);

export const moduleStatusEnum = pgEnum('module_status', [
  'ENABLED',
  'DISABLED',
  'SETUP_REQUIRED',
]);

export const loginModeEnum = pgEnum('login_mode', [
  'CUSTOM_DOMAIN',
  'SUBDOMAIN',
]);
