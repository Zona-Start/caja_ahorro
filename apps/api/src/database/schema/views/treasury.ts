import { sql } from 'drizzle-orm';
import { date, numeric, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { treasurySchema } from '../_schemas';
import { bankAccounts, bankTransactions } from '../tables';

//Saldo según extractos bancarios (suma de créditos/débitos).
export const bankStatementBalance = treasurySchema.view(
  'bank_statement_balance',
  {
    tenantId: uuid('tenant_id').notNull(),
    bankAccountId: uuid('bank_account_id').notNull(),
    accountNumber: varchar('account_number', { length: 20 }).notNull(),
    accountName: varchar('account_name', { length: 255 }),
    currencyCode: text('currency_code').notNull(),
    totalCredits: numeric('total_credits', {
      precision: 20,
      scale: 6,
    }).notNull(),
    totalDebits: numeric('total_debits', { precision: 20, scale: 6 }).notNull(),
    currentStatementBalance: numeric('current_statement_balance', {
      precision: 20,
      scale: 6,
    }).notNull(),
    lastTransactionDate: date('last_transaction_date'),
  },
).as(sql`
  SELECT 
    ba.tenant_id,
    ba.id AS bank_account_id,
    ba.account_number,
    ba.account_name,
    ba.currency_code,
    COALESCE(SUM(bt.credit_amount), 0) AS total_credits,
    COALESCE(SUM(bt.debit_amount), 0) AS total_debits,
    COALESCE(SUM(bt.credit_amount - bt.debit_amount), 0) AS current_statement_balance,
    MAX(bt.transaction_date) AS last_transaction_date
  FROM ${bankAccounts} ba
  LEFT JOIN ${bankTransactions} bt ON bt.bank_account_id = ba.id
  GROUP BY ba.id, ba.account_number, ba.account_name, ba.currency_code
`);
