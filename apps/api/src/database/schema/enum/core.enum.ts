import { pgEnum } from 'drizzle-orm/pg-core';

export const businessTypeEnum = pgEnum('business_type', [
  'CAJA_AHORRO',
  'EMPRESA_COMERCIAL',
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
]);

export const moduleStatusEnum = pgEnum('module_status', [
  'ENABLED',
  'DISABLED',
  'SETUP_REQUIRED',
]);
