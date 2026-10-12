import { pgSchema } from 'drizzle-orm/pg-core';

// Esquemas del ERP que el portal LEE (definidos aquí como subconjunto propio,
// opción A del plan Fase 1: sin tocar `apps/api`).
export const savingsSchema = pgSchema('savings');
export const coreSchema = pgSchema('core');
export const tenantSchema = pgSchema('tenant');
export const treasurySchema = pgSchema('treasury');
export const inventorySchema = pgSchema('inventory');

// Esquema propio del portal (único gestionado por drizzle-kit en este proyecto).
export const portalSchema = pgSchema('portal');
