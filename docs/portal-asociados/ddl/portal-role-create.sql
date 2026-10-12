-- ============================================================================
--  Portal del Asociado · Creación del rol `portal_app` (ejecutar como DBA)
--  Estado: DISEÑO/OPERACIÓN. NO versionar credenciales reales.
-- ============================================================================
--
--  Este paso lo ejecuta el DBA UNA vez por entorno. La contraseña debe generarse
--  y guardarse en el gestor de secretos (nunca en el repo).
--
--  Los GRANT y timeouts del rol los aplica la migración `0001_portal_fks_and_grants.sql`
--  de `apps/portal-api` (solo si el rol ya existe).
-- ============================================================================

CREATE ROLE portal_app LOGIN PASSWORD '<GENERAR-Y-GUARDAR-EN-SECRET-MANAGER>';

-- No otorgar privilegios elevados:
--   portal_app NO es superuser, NO crea bases de datos, NO crea roles.
-- (El rol por defecto ya viene sin estos atributos.)

-- Verificación:
--   SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin
--   FROM pg_roles WHERE rolname = 'portal_app';
