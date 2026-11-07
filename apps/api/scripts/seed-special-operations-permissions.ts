import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/database/schema';

/**
 * Seed idempotente de permisos para Operaciones Especiales.
 *
 * Uso:
 *   pnpm --filter api db:seed:special-operations
 *
 * No modifica el esquema. Solo inserta permisos y asigna roles existentes.
 */
async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    ssl: false,
  });

  const db = drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;

  console.log('Sembrando permisos de Operaciones Especiales...');

  await db.execute(sql`
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
    )
  `);

  // Lectura para todos los roles de tenants con SAVINGS activo.
  await db.execute(sql`
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
      )
  `);

  // Crear, configurar y ejecutar para administradores y ejecutivos.
  await db.execute(sql`
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
      )
  `);

  // Crear para asistentes (la lectura ya se asignó arriba).
  await db.execute(sql`
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
      )
  `);

  // Normalizar el tipo de retiro interno si fue creado con el sufijo del tenant.
  await db.execute(sql`
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
      )
  `);

  const permissionsResult = await db.execute(sql`
    SELECT resource, action, scope
    FROM "auth"."permissions"
    WHERE resource = 'savings:special-operations'
    ORDER BY action
  `);

  const rolesResult = await db.execute(sql`
    SELECT r.name AS role, p.action
    FROM "auth"."roles" r
    JOIN "auth"."role_permissions" rp ON rp.role_id = r.id
    JOIN "auth"."permissions" p ON p.id = rp.permission_id
    WHERE p.resource = 'savings:special-operations'
    ORDER BY r.name, p.action
  `);

  console.log('Permisos disponibles:', permissionsResult.rows);
  console.log('Permisos asignados por rol:', rolesResult.rows);

  await pool.end();
  console.log('✅ Seed de permisos de Operaciones Especiales completado.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      '❌ Error sembrando permisos de Operaciones Especiales:',
      error,
    );
    process.exit(1);
  });
