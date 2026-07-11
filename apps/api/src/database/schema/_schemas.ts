import { pgSchema } from 'drizzle-orm/pg-core';

export const accountingSchema = pgSchema('accounting'); //contabilidad
export const auditSchema = pgSchema('audit');
export const authSchema = pgSchema('auth');
export const coreSchema = pgSchema('core');
export const inventorySchema = pgSchema('inventory');
export const purchasingSchema = pgSchema('purchasing');
export const savingsSchema = pgSchema('savings');
export const tenantSchema = pgSchema('tenant');
export const treasurySchema = pgSchema('treasury');
