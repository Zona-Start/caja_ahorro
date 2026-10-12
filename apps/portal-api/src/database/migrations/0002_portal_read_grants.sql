-- ============================================================================
--  Migración custom: grants de LECTURA ampliados para `portal_app`
-- ============================================================================
--  El portal requiere leer tablas de savings/core/tenant/treasury/inventory.
--  Se concede SOLO lectura (más la escritura por columnas ya definida), lo que
--  mantiene el mínimo privilegio de escritura.
--
--  Se aplica solo si el rol `portal_app` existe.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'portal_app') THEN
    GRANT USAGE ON SCHEMA savings, core, tenant, treasury, inventory TO portal_app;

    GRANT SELECT ON ALL TABLES IN SCHEMA
      savings, core, tenant, treasury, inventory
    TO portal_app;

    -- Tablas/vistas futuras en esos esquemas.
    ALTER DEFAULT PRIVILEGES IN SCHEMA savings
      GRANT SELECT ON TABLES TO portal_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA core
      GRANT SELECT ON TABLES TO portal_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA tenant
      GRANT SELECT ON TABLES TO portal_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA treasury
      GRANT SELECT ON TABLES TO portal_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA inventory
      GRANT SELECT ON TABLES TO portal_app;

    -- Reforzar escritura SOLO por columnas allowlist en savings.associates.
    GRANT UPDATE (phone, email, locality_id) ON savings.associates TO portal_app;
  END IF;
END $$;
