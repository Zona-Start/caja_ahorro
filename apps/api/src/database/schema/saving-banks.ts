import * as t from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
import { accountPlan } from './accounting';
import { banks } from './bank';
import { genderEnum, nationalityEnum, statusEnum } from './enum';
import { categoryType, states } from './general';
import { savingBankSchema } from './schemas';
//import { transactionsCountable } from './accounting';
// import { transaction_types } from './general';

// Tabla de Datos Caja de ahorro
export const savingsBank = savingBankSchema.table(
  'savings_bank',
  {
    id: t.serial('id').primaryKey(),
    name: t.text('name').notNull(),
    rif: t.text('rif').unique().notNull(),
    address: t.text('address').notNull(),
    phone: t.text('phone'),
    email: t.text('email').unique().notNull(),
    personContact: t.text('person_contact'),
    phoneContact: t.text('phone_contact'),
    ...timestamps,
  },
  (savingsBank) => ({
    savingsBankIdx0: t.index('savings_bank_idx0').on(savingsBank.name),
    savingsBankIdx1: t.index('savings_bank_idx1').on(savingsBank.rif),
  }),
);

// Tabla de los asociados. Almacena la información de los asociados de la caja de ahorro.
export const associates = savingBankSchema.table(
  'associates',
  {
    id: t.serial('id').primaryKey(),
    savingsBankId: t
      .integer('savings_bank_id') //id caja ahorro
      .references(() => savingsBank.id, { onDelete: 'cascade' }),
    cedula: t.varchar('cedula', { length: 20 }).unique().notNull(), //cedula asociado
    fullname: t.varchar('name', { length: 255 }).notNull(), //nombre completo asosciado
    nationality: nationalityEnum('nationality').notNull(), // nacionalidad
    gender: genderEnum('gender').notNull(), // genero
    birthdate: t.date('birthdate').notNull(), //fecha de nacimiento
    dateAdmission: t.timestamp('date_admission').defaultNow().notNull(), //fecha ingreso
    dateGraduation: t.timestamp('date_graduation'), //fecha de egreso
    discountFrequencyId: t.integer('discount_frequency_id'), //fecha de descuento
    status: statusEnum('status').notNull().default('ACTIVE'), //estatus del asociado
    isPayrollCredit: t.boolean('is_payroll_credit').notNull().default(false), // posee credinomina
    localityId: t
      .integer('locality_id')
      .references(() => states.id, { onDelete: 'set null' }), // id de la localidad
    phone: t.varchar('phone', { length: 15 }), // telefono
    email: t.varchar('email', { length: 100 }), // correo
    payrollTypeId: t
      .integer('payroll_type_id')
      .references(() => categoryType.id, { onDelete: 'set null' }), // tipo de nomina
    workerTypeId: t
      .integer('worker_type_id')
      .references(() => categoryType.id, { onDelete: 'set null' }), // tipo de trabajador
    charge: t.text('charge'), // cargo del asosciado
    ...timestamps,
  },
  (associates) => ({
    associatesIdx0: t.index('associates_index0').on(associates.cedula),
    associatesIdx1: t.index('associates_index1').on(associates.fullname),
    associatesIdx2: t.index('associates_index2').on(associates.dateAdmission),
    associatesIdx3: t.index('associates_index3').on(associates.dateGraduation),
    associatesIdx4: t.index('associates_index4').on(associates.status),
    associatesIdx5: t.index('associates_index5').on(associates.isPayrollCredit),
    associatesIdx6: t.index('associates_index6').on(associates.payrollTypeId),
    associatesIdx7: t.index('associates_index7').on(associates.workerTypeId),
    associatesIdx8: t.index('associates_index8').on(associates.localityId),
  }),
);

//Tabla de cuentas de los asociados  Almacena las cuentas de ahorro de los asociados.
export const accountsAssociates = savingBankSchema.table(
  'accounts_associates',
  {
    id: t.serial('id').primaryKey(),
    associatedId: t
      .integer('associated_id')
      .references(() => associates.id, { onDelete: 'cascade' }), // id asosciado
    balance: t.numeric('balance', { precision: 15, scale: 2 }).default('0'), //saldo inicial
    accountNumber: t.numeric('account_number').notNull(), // numero de cuenta
    bankId: t
      .integer('bank_id')
      .references(() => banks.id, { onDelete: 'set null' }), // id del banco
    salary: t.integer('salary').notNull(), //salario base
    salaryTotal: t.integer('salary_total').notNull(), //salario total
    openingDate: t.timestamp('opening_date').defaultNow(), //fecha apertura
    status: t.varchar('status', { length: 50 }).notNull(), // Ex: 'active', 'inactive', 'locked'
    accountPlanId: t
      .integer('account_plan_id')
      .references(() => accountPlan.id, { onDelete: 'set null' }), //id de la cuenta contable
    ...timestamps,
  },
  (accountsAssociates) => ({
    accountsAssociatesIdx0: t
      .index('accounts_associatesx0')
      .on(accountsAssociates.status),
    accountsAssociatesIdx1: t
      .index('accounts_associatesx1')
      .on(accountsAssociates.balance),
    accountsAssociatesIdx2: t
      .index('accounts_associatesx2')
      .on(accountsAssociates.bankId),
    accountsAssociatesIdx3: t
      .index('accounts_associatesx3')
      .on(accountsAssociates.openingDate),
  }),
);

//Tabla transacciones_ahorro Registra las transacciones de depósitos y retiros de las cuentas de ahorro.
// export const transactionsAssociates = savingBankSchema.table(
//   'transactions_associates',
//   {
//     id: t.serial('id').primaryKey(),
//     accountsAssociatedId: t
//       .integer('accounts_associated_id')
//       .references(() => accountsAssociates.id, { onDelete: 'cascade' }),
//     transactionTypeId: t
//       .integer('transaction_type_id')
//       .references(() => transaction_types.id, { onDelete: 'set null' }),
//     amount: t.numeric('amount', { precision: 15, scale: 2 }).notNull(),
//     date: t.timestamp('date').defaultNow(),
//     description: t.text('description'),
//     transactionCountableId: t
//       .integer('transaction_countable_id')
//       .references(() => transactionsCountable.id, { onDelete: 'set null' }),
//     ...timestamps,
//   },
// );

export const transactionType = savingBankSchema.table('transaction_type', {
  id: t.serial('id').primaryKey(),
  code: t.varchar('code', { length: 10 }).notNull(),
  description: t.text('description').notNull(),
  deferredDate: t.date('deferred_date').notNull(),
  dateCanceled: t.date('date_canceled').notNull(),
  deferredNumber: t.integer('deferred_number'),
  numberCanceled: t.integer('number_canceled'),
  associatedAccount: t
    .integer('associated_account')
    .references(() => accountPlan.id, { onDelete: 'set null' }),
  employerAccount: t
    .integer('employer_account')
    .references(() => accountPlan.id, { onDelete: 'set null' }),
  loanAccount: t
    .integer('loan_account')
    .references(() => accountPlan.id, { onDelete: 'set null' }),
  ...timestamps,
});
