//schemas
import * as t from 'drizzle-orm/pg-core';
export const authSchema = t.pgSchema('auth'); //autenticacion y sessiones usuarios
export const coreSchema = t.pgSchema('core'); // core system settings
export const accountingSchema = t.pgSchema('accounting'); //contabilidad
export const savingsBanksSchema = t.pgSchema('savings_banks'); //caja de ahorro
export const bankingSchema = t.pgSchema('banking'); //bancos
export const auditSchema = t.pgSchema('audit'); //auditorias
export const inventorySchema = t.pgSchema('inventory');
export const administrationSchema = t.pgSchema('administration');

// export const estimateSchema = t.pgSchema('estimate'); //planificacion y presupuestos
