-- =============================================================================
-- BACKFILL BIMONETARIO + TASA DE CAMBIO DIARIA
-- Ejecutar DESPUÉS de `pnpm --filter api db:migrate` (que aplica 0011_*).
-- Idempotente: puede re-ejecutarse sin romper datos ya migrados.
-- =============================================================================

BEGIN;

-- 1) exchange_rates: asignar rate_date a partir de fetched_at y deduplicar
--    a una fila por (currency_id, rate_date) conservando la más reciente.
UPDATE core.exchange_rates
SET rate_date = fetched_at::date
WHERE rate_date IS NULL;

DELETE FROM core.exchange_rates a
USING core.exchange_rates b
WHERE a.currency_id = b.currency_id
  AND a.rate_date = b.rate_date
  AND a.id <> b.id
  AND a.fetched_at < b.fetched_at;

-- 2) accounting_entry_details: poblar alias base y currency_code heredado de la
--    cabecera. En asientos ya en USD se conserva el importe en foreign y se
--    calcula la base con la tasa histórica si existe.
UPDATE accounting.accounting_entry_details aed
SET debit_base       = aed.debit,
    credit_base      = aed.credit,
    debit_foreign    = 0,
    credit_foreign   = 0,
    currency_code    = COALESCE(ae.currency_code, 'VES'),
    exchange_rate    = COALESCE(
                         (SELECT er.rate
                          FROM core.exchange_rates er
                          JOIN core.currencies c ON c.id = er.currency_id
                          WHERE c.code = COALESCE(ae.currency_code, 'VES')
                            AND er.rate_date <= ae.entry_date
                          ORDER BY er.rate_date DESC
                          LIMIT 1),
                         1
                       )
FROM accounting.accounting_entries ae
WHERE ae.id = aed.accounting_entry_id;

-- 3) account_balances: poblar desglose base/foreign desde las columnas
--    originales (que actúan como alias de base).
UPDATE accounting.account_balances
SET initial_balance_base   = initial_balance,
    debit_balance_base     = debit_balance,
    credit_balance_base    = credit_balance,
    final_balance_base     = final_balance,
    initial_balance_foreign = 0,
    debit_balance_foreign   = 0,
    credit_balance_foreign  = 0,
    final_balance_foreign   = 0,
    currency_code           = 'VES';

-- 4) accounting_entries: establecer base_currency_code por defecto en VES.
UPDATE accounting.accounting_entries
SET base_currency_code = COALESCE(base_currency_code, 'VES');

COMMIT;
