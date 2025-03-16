//schemas
import * as t from 'drizzle-orm/pg-core';
export const authSchema = t.pgSchema('auth'); //autenticacion y sessiones usuarios
export const accountingSchema = t.pgSchema('accounting'); //contabilidad
export const savingBankSchema = t.pgSchema('saving_banks'); //caja de ahorro
export const bankSchema = t.pgSchema('bank'); //banco
export const estimateSchema = t.pgSchema('estimate'); //planificacion y presupuestos
