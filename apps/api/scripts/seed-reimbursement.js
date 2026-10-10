/* eslint-disable no-console */
/**
 * Seed de datos para el módulo de REINTEGROS (tenants existentes):
 *  - Permisos `savings:reimbursement:*` en auth.permissions.
 *  - Asignación al rol 'admin'.
 *  - module_settings: REI + AUTO_POST_ENTRY_REIMBURSEMENTS.
 *  - Regla contable REIMBURSEMENT (SAVINGS_BANK) con cuentas destino
 *    copiadas de SAVINGS_UPLOAD (VOLUNTARY_SAVINGS) y SAVINGS_LIQUIDATION
 *    (BANK_ACCOUNT).
 *
 * Idempotente. Uso: node scripts/seed-reimbursement.js [--apply]
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const APPLY = process.argv.includes('--apply');

function getDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = fs.readFileSync(envPath, 'utf8');
  const match = env.match(/DATABASE_URL="([^"]+)"/);
  if (!match) throw new Error('DATABASE_URL no encontrada en .env');
  return match[1].split('?')[0];
}

const PERMISSIONS = [
  ['create', 'Registrar Reintegro', 'Registrar reintegro de saldo a favor.'],
  ['read', 'Consultar Reintegros', 'Ver reintegros de saldo a favor.'],
  ['approve', 'Aprobar Reintegro', 'Aprobar solicitud de reintegro.'],
  ['process', 'Procesar Reintegro', 'Procesar reintegro a haberes.'],
  ['disburse', 'Desembolsar Reintegro', 'Desembolsar reintegro en efectivo.'],
];

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  try {
    await client.query('BEGIN');

    const { rows: tenants } = await client.query(`SELECT id FROM tenant.tenants`);

    // 1) Permisos (idempotente por resource+action, sin constraint único).
    for (const [action, name, description] of PERMISSIONS) {
      await client.query(
        `INSERT INTO auth.permissions (name, resource, action, scope, description, is_active)
         SELECT $1::varchar, 'savings:reimbursement'::varchar, $2::varchar, 'tenant'::varchar, $3::text, true
         WHERE NOT EXISTS (
           SELECT 1 FROM auth.permissions
           WHERE resource = 'savings:reimbursement' AND action = $2::varchar
         )`,
        [name, action, description],
      );
    }

    // 2) Asignar al rol admin (idempotente).
    const { rows: adminRoles } = await client.query(
      `SELECT id FROM auth.roles WHERE name = 'admin'`,
    );
    for (const role of adminRoles) {
      await client.query(
        `INSERT INTO auth.role_permissions (role_id, permission_id)
         SELECT $1, p.id FROM auth.permissions p
         WHERE p.resource = 'savings:reimbursement'
           AND NOT EXISTS (
             SELECT 1 FROM auth.role_permissions rp
             WHERE rp.role_id = $1 AND rp.permission_id = p.id
           )`,
        [role.id],
      );
    }

    // 3) module_settings + regla contable por tenant
    for (const tenant of tenants) {
      const tid = tenant.id;

      for (const [key, value, description] of [
        ['REI', '0', 'Consecutivo Reintegro de Saldo a Favor'],
        [
          'AUTO_POST_ENTRY_REIMBURSEMENTS',
          'true',
          'Generar asiento contable en reintegros',
        ],
      ]) {
        await client.query(
          `INSERT INTO core.module_settings (tenant_id, module, submodule, key, value, description, is_active)
           SELECT $1::uuid, 'savings'::varchar, 'reimbursements'::varchar, $2::varchar, $3::varchar, $4::text, true
           WHERE NOT EXISTS (
             SELECT 1 FROM core.module_settings
             WHERE tenant_id = $1::uuid AND module = 'savings'
               AND submodule = 'reimbursements' AND key = $2::varchar
           )`,
          [tid, key, value, description],
        );
      }

      const { rows: voluntary } = await client.query(
        `SELECT d.account_plan_id FROM accounting.accounting_rules r
         JOIN accounting.accounting_rule_details d ON d.rule_id = r.id
         WHERE r.tenant_id = $1 AND r.category='SAVINGS_BANK'
           AND r.operation_type='SAVINGS_UPLOAD' AND r.is_active
           AND d.account_role='VOLUNTARY_SAVINGS' LIMIT 1`,
        [tid],
      );
      const { rows: bank } = await client.query(
        `SELECT d.account_plan_id FROM accounting.accounting_rules r
         JOIN accounting.accounting_rule_details d ON d.rule_id = r.id
         WHERE r.tenant_id = $1 AND r.category='SAVINGS_BANK'
           AND r.operation_type='SAVINGS_LIQUIDATION' AND r.is_active
           AND d.account_role='BANK_ACCOUNT' LIMIT 1`,
        [tid],
      );

      const { rows: existing } = await client.query(
        `SELECT id FROM accounting.accounting_rules
         WHERE tenant_id=$1 AND category='SAVINGS_BANK'
           AND operation_type='REIMBURSEMENT' LIMIT 1`,
        [tid],
      );

      let ruleId = existing[0]?.id;
      if (!ruleId) {
        const { rows: ins } = await client.query(
          `INSERT INTO accounting.accounting_rules
             (tenant_id, category, operation_type, reference_value, description, is_active)
           VALUES ($1, 'SAVINGS_BANK', 'REIMBURSEMENT', 'Reintegro Saldo a Favor',
                   'Regla para reintegro de saldo a favor al asociado', true)
           RETURNING id`,
          [tid],
        );
        ruleId = ins[0].id;

        if (voluntary[0]?.account_plan_id) {
          await client.query(
            `INSERT INTO accounting.accounting_rule_details (rule_id, account_role, movement_type, is_auxiliary, account_plan_id)
             VALUES ($1, 'VOLUNTARY_SAVINGS', 'CREDIT', true, $2)`,
            [ruleId, voluntary[0].account_plan_id],
          );
        }
        if (bank[0]?.account_plan_id) {
          await client.query(
            `INSERT INTO accounting.accounting_rule_details (rule_id, account_role, movement_type, is_auxiliary, account_plan_id)
             VALUES ($1, 'BANK_ACCOUNT', 'CREDIT', false, $2)`,
            [ruleId, bank[0].account_plan_id],
          );
        }
      }
    }

    if (APPLY) {
      await client.query('COMMIT');
      console.log('COMMIT aplicado.');
    } else {
      await client.query('ROLLBACK');
      console.log('Dry-run: ROLLBACK (nada escrito). Usa --apply.');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error, ROLLBACK:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
