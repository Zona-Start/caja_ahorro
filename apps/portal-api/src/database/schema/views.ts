import { numeric, uuid } from 'drizzle-orm/pg-core';
import { savingsSchema } from './_schemas';

/**
 * Vista `savings.associate_haberes_balance` (solo lectura).
 * `.existing()`: la vista ya existe en la BD del ERP y no la gestiona drizzle-kit.
 */
export const associateHaberesBalance = savingsSchema
  .view('associate_haberes_balance', {
    associateAccountId: uuid('associate_account_id').notNull(),
    haberesBalance: numeric('haberes_balance', {
      precision: 20,
      scale: 6,
    }).notNull(),
    haberesContribution: numeric('haberes_contribution', {
      precision: 20,
      scale: 6,
    }).notNull(),
    haberesVoluntary: numeric('haberes_voluntary', {
      precision: 20,
      scale: 6,
    }).notNull(),
    haberesEmployer: numeric('haberes_employer', {
      precision: 20,
      scale: 6,
    }).notNull(),
    surpluses: numeric('surpluses', { precision: 20, scale: 6 }).notNull(),
  })
  .existing();
