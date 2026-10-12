-- ============================================================================
--  Migración custom: FKs al ERP + grants del rol `portal_app`
-- ============================================================================
--  Las tablas `portal.*` NO declaran `.references()` en Drizzle (para que
--  drizzle-kit genere solo el esquema `portal`). Aquí se añaden las claves
--  foráneas reales hacia las tablas del ERP (misma base de datos).
--
--  Los GRANT se aplican solo si el rol `portal_app` existe (lo crea el DBA).
-- ============================================================================

-- --- Claves foráneas --------------------------------------------------------
ALTER TABLE "portal"."accounts"
  ADD CONSTRAINT "portal_accounts_tenant_fk"
    FOREIGN KEY ("tenant_id") REFERENCES "tenant"."tenants"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "portal_accounts_associate_fk"
    FOREIGN KEY ("associate_id") REFERENCES "savings"."associates"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "portal"."associate_profile"
  ADD CONSTRAINT "portal_associate_profile_account_fk"
    FOREIGN KEY ("account_id") REFERENCES "portal"."accounts"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "portal_associate_profile_locality_fk"
    FOREIGN KEY ("locality_id") REFERENCES "core"."localities"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "portal"."sessions"
  ADD CONSTRAINT "portal_sessions_account_fk"
    FOREIGN KEY ("account_id") REFERENCES "portal"."accounts"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "portal"."otp_codes"
  ADD CONSTRAINT "portal_otp_codes_account_fk"
    FOREIGN KEY ("account_id") REFERENCES "portal"."accounts"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "portal"."access_log"
  ADD CONSTRAINT "portal_access_log_account_fk"
    FOREIGN KEY ("account_id") REFERENCES "portal"."accounts"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "portal"."email_log"
  ADD CONSTRAINT "portal_email_log_account_fk"
    FOREIGN KEY ("account_id") REFERENCES "portal"."accounts"("id") ON DELETE SET NULL;
--> statement-breakpoint

-- --- Permisos del rol portal_app (mínimo privilegio) ------------------------
-- Se aplican solo si el rol existe. La creación del rol y su contraseña las
-- gestiona el DBA (no se versiona ninguna credencial aquí).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'portal_app') THEN
    -- Esquemas
    GRANT USAGE ON SCHEMA portal, savings, core, tenant, treasury TO portal_app;

    -- Lecturas (solo SELECT) — ajustar/validar contra el esquema real en PR6
    GRANT SELECT ON
      savings.associates,
      savings.associate_accounts,
      core.states,
      core.municipalities,
      core.parishes,
      core.localities,
      treasury.bank_directory
    TO portal_app;

    -- Escritura en savings.associates SOLO por columnas allowlist
    GRANT UPDATE (phone, email, locality_id) ON savings.associates TO portal_app;

    -- Propiedad total del esquema portal
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA portal TO portal_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA portal TO portal_app;

    -- Timeouts defensivos del rol
    ALTER ROLE portal_app SET statement_timeout = '5s';
    ALTER ROLE portal_app SET idle_in_transaction_session_timeout = '15s';
    ALTER ROLE portal_app SET lock_timeout = '3s';
  END IF;
END $$;
