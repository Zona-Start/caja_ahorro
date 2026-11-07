-- ============================================================
-- Permisos de Operaciones Especiales
-- Script idempotente para ejecutar directamente en PostgreSQL.
--
-- Uso:
--   Ejecutar todo el archivo en DBeaver/pgAdmin contra la base
--   del tenant. No requiere el runner de migraciones.
-- ============================================================

-- 1) Crear los permisos si no existen.
INSERT INTO "auth"."permissions" ("name", "resource", "action", "scope", "description", "is_active")
SELECT v.name, v.resource, v.action, v.scope, v.description, true
FROM (
  VALUES
    ('Consultar Operaciones Especiales', 'savings:special-operations', 'read', 'tenant', 'Ver el historial y el detalle de operaciones especiales.'),
    ('Crear Operaciones Especiales', 'savings:special-operations', 'create', 'tenant', 'Cargar archivos y preparar operaciones especiales.'),
    ('Configurar Cuentas de Operaciones Especiales', 'savings:special-operations', 'config', 'tenant', 'Definir la regla contable de una operación especial en el wizard.'),
    ('Ejecutar Operaciones Especiales', 'savings:special-operations', 'execute', 'tenant', 'Confirmar y ejecutar una operación especial.')
) AS v(name, resource, action, scope, description)
WHERE NOT EXISTS (
  SELECT 1
  FROM "auth"."permissions" p
  WHERE p.resource = v.resource
    AND p.action = v.action
    AND p.scope = v.scope
    AND p.deleted_at IS NULL
);

-- 2) Asignar lectura a todos los roles de tenants con SAVINGS activo.
INSERT INTO "auth"."role_permissions" ("role_id", "permission_id", "is_custom")
SELECT r.id, p.id, false
FROM "auth"."roles" r
JOIN "tenant"."tenant_modules" tm
  ON tm.tenant_id = r.tenant_id
 AND tm.module_code = 'SAVINGS'
 AND tm.status = 'ENABLED'
JOIN "auth"."permissions" p
  ON p.resource = 'savings:special-operations'
 AND p.action = 'read'
 AND p.deleted_at IS NULL
WHERE r.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "auth"."role_permissions" rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 3) Asignar create/config/execute a administradores y ejecutivos.
INSERT INTO "auth"."role_permissions" ("role_id", "permission_id", "is_custom")
SELECT r.id, p.id, false
FROM "auth"."roles" r
JOIN "tenant"."tenant_modules" tm
  ON tm.tenant_id = r.tenant_id
 AND tm.module_code = 'SAVINGS'
 AND tm.status = 'ENABLED'
JOIN "auth"."permissions" p
  ON p.resource = 'savings:special-operations'
 AND p.action IN ('create', 'config', 'execute')
 AND p.deleted_at IS NULL
WHERE r.deleted_at IS NULL
  AND r.name IN ('admin', 'ejecutivo', 'executive')
  AND NOT EXISTS (
    SELECT 1 FROM "auth"."role_permissions" rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 4) Asignar create a asistentes.
INSERT INTO "auth"."role_permissions" ("role_id", "permission_id", "is_custom")
SELECT r.id, p.id, false
FROM "auth"."roles" r
JOIN "tenant"."tenant_modules" tm
  ON tm.tenant_id = r.tenant_id
 AND tm.module_code = 'SAVINGS'
 AND tm.status = 'ENABLED'
JOIN "auth"."permissions" p
  ON p.resource = 'savings:special-operations'
 AND p.action = 'create'
 AND p.deleted_at IS NULL
WHERE r.deleted_at IS NULL
  AND r.name IN ('asistente', 'assistant')
  AND NOT EXISTS (
    SELECT 1 FROM "auth"."role_permissions" rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 5) Normalizar el tipo de retiro interno si fue creado con sufijo del tenant.
UPDATE "savings"."withdrawal_types" wt
SET "description" = 'Retiro Préstamo vs Haberes'
WHERE wt."is_system" = true
  AND wt."description" LIKE 'Retiro Préstamo vs Haberes%'
  AND wt."description" <> 'Retiro Préstamo vs Haberes'
  AND NOT EXISTS (
    SELECT 1
    FROM "savings"."withdrawal_types" wt2
    WHERE wt2."tenant_id" = wt."tenant_id"
      AND wt2."description" = 'Retiro Préstamo vs Haberes'
      AND wt2."id" <> wt."id"
  );

-- 6) Verificación.
SELECT p.resource, p.action, p.scope
FROM "auth"."permissions" p
WHERE p.resource = 'savings:special-operations'
ORDER BY p.action;

SELECT r.name AS role, p.resource, p.action
FROM "auth"."roles" r
JOIN "auth"."role_permissions" rp ON rp.role_id = r.id
JOIN "auth"."permissions" p ON p.id = rp.permission_id
WHERE p.resource = 'savings:special-operations'
ORDER BY r.name, p.action;
