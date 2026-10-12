-- ============================================================================
--  Portal del Asociado · DDL de REFERENCIA del esquema `portal`
--  Estado: DISEÑO (Fase 0). NO ejecutar a mano en producción.
--
--  IMPORTANTE: las migraciones se generan con Drizzle ORM:
--    pnpm db:generate   (drizzle-kit generate)
--    pnpm db:migrate
--  Este archivo refleja lo que drizzle-kit producirá a partir del esquema TS
--  (ver ../04-esquema-drizzle.md y ../drizzle/portal.schema.reference.ts).
--  Ver: ../01-modelo-datos.md
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS portal;

-- Reutilizamos el dominio de dominio del ERP (no tenant-scoped para catálogos).
-- gen_random_uuid() requiere PostgreSQL >= 13 (o extensión pgcrypto).

-- ----------------------------------------------------------------------------
-- 1. Cuentas de acceso del asociado (realm portal, sin permisos de staff)
-- ----------------------------------------------------------------------------
CREATE TABLE portal.accounts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenant.tenants(id) ON DELETE CASCADE,
  associate_id          uuid NOT NULL REFERENCES savings.associates(id) ON DELETE CASCADE,

  username              varchar(20)  NOT NULL,          -- = cédula
  password_hash         text         NOT NULL,          -- bcrypt

  status                varchar(20)  NOT NULL DEFAULT 'PENDING_ACTIVATION',
                        -- PENDING_ACTIVATION | ACTIVE | LOCKED | DISABLED
  must_change_password  boolean      NOT NULL DEFAULT false,  -- decisión de negocio: false

  email                 varchar(100),
  phone                 varchar(50),
  email_verified_at     timestamptz,
  phone_verified_at     timestamptz,

  failed_attempts       integer      NOT NULL DEFAULT 0,
  locked_until          timestamptz,
  last_login_at         timestamptz,
  password_changed_at   timestamptz,

  created_at            timestamptz  NOT NULL DEFAULT now(),
  updated_at            timestamptz,
  deleted_at            timestamptz
);

CREATE UNIQUE INDEX accounts_tenant_associate_uidx
  ON portal.accounts (tenant_id, associate_id)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX accounts_tenant_username_uidx
  ON portal.accounts (tenant_id, username)
  WHERE deleted_at IS NULL;

CREATE INDEX accounts_tenant_idx  ON portal.accounts (tenant_id);
CREATE INDEX accounts_status_idx  ON portal.accounts (status);

-- ----------------------------------------------------------------------------
-- 2. Perfil extendido (dirección libre; el ERP no la soporta)
-- ----------------------------------------------------------------------------
CREATE TABLE portal.associate_profile (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL UNIQUE REFERENCES portal.accounts(id) ON DELETE CASCADE,
  tenant_id    uuid NOT NULL REFERENCES tenant.tenants(id) ON DELETE CASCADE,

  address      text,
  locality_id  integer REFERENCES core.localities(id) ON DELETE SET NULL,  -- espejo de associates.locality_id
  synced_at    timestamptz,

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz
);

CREATE INDEX associate_profile_tenant_idx ON portal.associate_profile (tenant_id);

-- ----------------------------------------------------------------------------
-- 3. Sesiones (realm propio; NO se guarda el refresh token en claro)
-- ----------------------------------------------------------------------------
CREATE TABLE portal.sessions (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id                  uuid NOT NULL REFERENCES portal.accounts(id) ON DELETE CASCADE,

  refresh_token_hash          text NOT NULL,
  refresh_token_expires_at    timestamptz NOT NULL,
  previous_refresh_token_hash text,
  last_rotated_at             timestamptz,
  rotation_count              integer NOT NULL DEFAULT 0,

  ip_address                  varchar(45),
  user_agent                  text,
  device_fingerprint          text,
  correlation_id              uuid,

  is_active                   boolean NOT NULL DEFAULT true,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  revoked_at                  timestamptz,
  revoked_reason              text
);

CREATE INDEX sessions_account_idx        ON portal.sessions (account_id);
CREATE INDEX sessions_token_hash_idx     ON portal.sessions (refresh_token_hash);
CREATE INDEX sessions_is_active_idx      ON portal.sessions (is_active);
CREATE INDEX sessions_correlation_id_idx ON portal.sessions (correlation_id);

-- ----------------------------------------------------------------------------
-- 4. Códigos OTP (verificación email/teléfono, reset, step-up)
-- ----------------------------------------------------------------------------
CREATE TABLE portal.otp_codes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     uuid NOT NULL REFERENCES portal.accounts(id) ON DELETE CASCADE,

  purpose        varchar(30) NOT NULL,   -- EMAIL_VERIFY | PHONE_VERIFY | RESET | STEP_UP
  destination    text        NOT NULL,   -- email o teléfono destino
  code_hash      text        NOT NULL,   -- hash del código (nunca en claro)
  expires_at     timestamptz NOT NULL,
  consumed_at    timestamptz,
  attempts       integer     NOT NULL DEFAULT 0,
  correlation_id uuid,

  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX otp_account_purpose_idx ON portal.otp_codes (account_id, purpose);
CREATE INDEX otp_expires_idx         ON portal.otp_codes (expires_at);

-- ----------------------------------------------------------------------------
-- 5. Bitácora de acceso (alternativa: reutilizar audit.audit_events)
-- ----------------------------------------------------------------------------
CREATE TABLE portal.access_log (
  id             bigserial PRIMARY KEY,
  account_id     uuid REFERENCES portal.accounts(id) ON DELETE SET NULL,
  tenant_id      uuid,

  event          varchar(40) NOT NULL,   -- LOGIN | LOGIN_FAILED | LOGOUT | READ | PROFILE_UPDATE | PASSWORD_CHANGE | OTP_SENT
  ip_address     varchar(45),
  user_agent     text,
  correlation_id uuid,
  metadata       jsonb,

  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX access_log_account_idx ON portal.access_log (account_id);
CREATE INDEX access_log_event_idx   ON portal.access_log (event);
CREATE INDEX access_log_created_idx ON portal.access_log (created_at);

-- ----------------------------------------------------------------------------
-- 6. Registro de correos enviados vía Resend (observabilidad / reintentos)
-- ----------------------------------------------------------------------------
CREATE TABLE portal.email_log (
  id          bigserial PRIMARY KEY,
  account_id  uuid REFERENCES portal.accounts(id) ON DELETE SET NULL,

  template    varchar(50) NOT NULL,   -- OTP_EMAIL_VERIFY | OTP_RESET | WELCOME | ...
  to_address  varchar(100) NOT NULL,
  provider_id varchar(100),           -- message id devuelto por Resend
  status      varchar(20) NOT NULL DEFAULT 'QUEUED',  -- QUEUED | SENT | FAILED
  error       text,

  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_log_account_idx ON portal.email_log (account_id);
CREATE INDEX email_log_status_idx  ON portal.email_log (status);
