-- ============================================================================
--  Portal del Asociado · Matriz de permisos del rol `portal_app`
--  Estado: DISEÑO (Fase 0). Principio de MÍNIMO PRIVILEGIO.
--  Ver: ../03-threat-model.md
-- ============================================================================
--
-- Objetivo:
--   El usuario de BD del portal NO puede leer/escribir módulos que no le competen
--   (accounting, treasury salvo catálogo mínimo, inventory, purchasing, sales).
--   Solo LEE datos del asociado y ESCRIBE en el esquema `portal` + columnas
--   permitidas de savings.associates.
-- ============================================================================

-- 1. Crear rol de aplicación (sin login como superusuario)
--    CREATE ROLE portal_app LOGIN PASSWORD '<secreto-gestionado>';
--    (ejecutar como DBA, nunca versionar la contraseña)

-- 2. Esquemas
GRANT USAGE ON SCHEMA savings, core, portal TO portal_app;

-- ----------------------------------------------------------------------------
-- 3. Lecturas (SOLO SELECT) — ajustar/validar nombres contra el esquema real
-- ----------------------------------------------------------------------------
GRANT SELECT ON
  -- Asociado y sus cuentas / saldos
  savings.associates,
  savings.associate_accounts,
  savings.associate_account_movements,
  savings.associate_haberes_balance,
  savings.associate_account_balance_history,
  -- Retiros
  savings.withdrawals_associates,
  savings.withdrawal_types,
  -- Préstamos
  savings.loans,
  savings.loan_payments,
  savings.loan_payments_details,
  savings.loan_amortization_schedule,
  -- Créditos
  savings.credits,
  savings.credit_payments,
  savings.credit_payments_details,
  savings.credit_amortization_schedule,
  -- Catálogos de localidad (globales, no tenant-scoped)
  core.states,
  core.municipalities,
  core.parishes,
  core.localities,
  -- Banco (nombre del banco mostrado en el estado de cuenta)
  treasury.bank_directory
TO portal_app;

-- NOTA: el listado de tablas debe ajustarse a los nombres y a las vistas/funciones
-- realmente usadas por `associate-inquiry.service.ts` (p. ej. función de saldo
-- pendiente `pending-balance`). Validar en Fase 2 contra la BD real.

-- ----------------------------------------------------------------------------
-- 4. Escritura en savings.associates — SOLO columnas allowlist
-- ----------------------------------------------------------------------------
-- El portal NO puede tocar saldos, status, base_salary, job_title, etc.
GRANT UPDATE (phone, email, locality_id) ON savings.associates TO portal_app;

-- ----------------------------------------------------------------------------
-- 5. Esquema portal — propiedad total
-- ----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA portal TO portal_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA portal TO portal_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA portal
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO portal_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA portal
  GRANT USAGE, SELECT ON SEQUENCES TO portal_app;

-- ============================================================================
-- 6. Endurecimiento del rol
-- ============================================================================
-- Timeouts defensivos (evitan consultas colgadas que afecten al ERP):
ALTER ROLE portal_app SET statement_timeout = '5s';
ALTER ROLE portal_app SET idle_in_transaction_session_timeout = '15s';
ALTER ROLE portal_app SET lock_timeout = '3s';
ALTER ROLE portal_app SET default_transaction_read_only = off;  -- requiere escritura en `portal`

-- Las LECTURAS de negocio se ejecutan en transacción READ ONLY a nivel de aplicación:
--   BEGIN READ ONLY; ... ; COMMIT;
--
-- Capacidades denegadas deliberadamente:
--   - Sin acceso a accounting.*, inventory.*, purchasing.*, sales.*, audit.*, auth.*
--   - Sin CREATE en `savings`/`core`
--   - Sin TRUNCATE ni DELETE en tablas del ERP
