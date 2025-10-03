CREATE VIEW "banking"."bank_statement_balance" AS (
  SELECT 
    ba.id AS bank_account_id,
    ba.account_number,
    ba.account_name,
    ba.currency_code,
    COALESCE(SUM(bt.credit_amount), 0) AS total_credits,
    COALESCE(SUM(bt.debit_amount), 0)  AS total_debits,
    COALESCE(SUM(bt.credit_amount - bt.debit_amount), 0) AS current_statement_balance,
    MAX(bt.transaction_date) AS last_transaction_date
  FROM "banking"."bank_accounts" ba
  LEFT JOIN "banking"."bank_transactions" bt 
         ON bt.bank_account_id = ba.id
  GROUP BY ba.id, ba.account_number, ba.account_name, ba.currency_code
);