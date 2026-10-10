/* eslint-disable no-console */
/**
 * Corrección puntual de tablas de amortización corrompidas por la migración.
 *
 *  - CRE-000002: regenera el schedule (capital 10.000, cuota 179,68, interés 12%
 *    anual quincenal 0,5%, 66 plazos) y deja la cuota 1 con paid_amount 80,48
 *    (100% capital) => saldo pendiente 9.919,52.
 *  - CRE-000036: ajusta requested_amount a 2.501,38 (= total 2.739,36 - gastos
 *    237,98) y corrige la cuota 24 (quita el interés negativo), dejando el saldo
 *    pendiente en 399,43.
 *
 * Uso:
 *   node scripts/fix-credit-schedules.js
 *
 * No crea movimientos de asociado ni asientos contables.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const CREDIT_2 = 'b77ac544-28a9-4c5a-a6ae-941db959d6fb'; // CRE-000002
const CREDIT_36 = 'ff999b5c-9c52-432a-9a25-ebfc472ce6dc'; // CRE-000036

const CAPITAL_2 = 10000;
const RATE_PERIOD_2 = 0.005; // 12% anual / 24 quincenas
const INSTALLMENT_2 = 179.68;
const PAID_2 = 80.48;

const REQUESTED_36 = 2501.38;
const PRINCIPAL_36 = 114.14;
const INSTALLMENT_36 = 114.14;

function round6(n) {
  return Number(n.toFixed(6));
}

function toDateStr(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function getDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = fs.readFileSync(envPath, 'utf8');
  const match = env.match(/DATABASE_URL="([^"]+)"/);
  if (!match) throw new Error('DATABASE_URL no encontrada en .env');
  return match[1].split('?')[0];
}

/**
 * Schedule de CRE-000002: cuota 1 = capital puro (interés 0) para que el abono
 * de 80,48 vaya 100% a capital; el resto se amortiza con cuotas francesas de
 * 179,68 (0,5% quincenal), ajustando la última al residuo.
 */
function buildSchedule000002() {
  const rows = [];
  let balance = CAPITAL_2;
  let n = 1;

  // Cuota 1: capital puro
  const firstPrincipal = Math.min(INSTALLMENT_2, balance);
  balance -= firstPrincipal;
  rows.push({
    n,
    principal: round6(firstPrincipal),
    interest: 0,
    total: round6(firstPrincipal),
    balancePending: round6(Math.max(0, balance)),
  });
  n++;

  // Cuotas siguientes: francesas
  while (balance > 0.005) {
    const interest = balance * RATE_PERIOD_2;
    let principal = INSTALLMENT_2 - interest;
    let total = INSTALLMENT_2;
    if (principal >= balance) {
      principal = balance;
      total = principal + interest;
    }
    balance -= principal;
    rows.push({
      n,
      principal: round6(principal),
      interest: round6(interest),
      total: round6(total),
      balancePending: round6(Math.max(0, balance)),
    });
    n++;
  }

  // Si la última cuota es un residuo insignificante, fusionarla con la anterior.
  if (rows.length > 1 && rows[rows.length - 1].total < 1) {
    const last = rows.pop();
    const prev = rows[rows.length - 1];
    prev.principal = round6(prev.principal + last.principal);
    prev.interest = round6(prev.interest + last.interest);
    prev.total = round6(prev.total + last.total);
    prev.balancePending = 0;
  }

  return rows;
}

async function fixCredit000002(client) {
  const {
    rows: [credit],
  } = await client.query(
    'SELECT start_date, created_by_id FROM savings.credits WHERE id=$1',
    [CREDIT_2],
  );
  if (!credit) throw new Error('CRE-000002 no encontrado');

  const startDate = toDateStr(credit.start_date);
  const schedule = buildSchedule000002();
  const totalInstallments = schedule.length;

  await client.query(
    'DELETE FROM savings.credit_amortization_schedule WHERE credit_id=$1',
    [CREDIT_2],
  );

  let totalPayable = 0;
  let totalInterest = 0;

  for (const row of schedule) {
    const isFirst = row.n === 1;
    const paid = isFirst ? PAID_2 : 0;
    const status = isFirst ? 'PARTIAL' : 'PENDING';

    await client.query(
      `INSERT INTO savings.credit_amortization_schedule
         (credit_id, installment_number, due_date, principal_amount,
          interest_amount, total_installment_amount, principal_balance_pending,
          payment_status, paid_amount, created_by_id, updated_by_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
      [
        CREDIT_2,
        row.n,
        addDays(startDate, row.n * 15),
        row.principal,
        row.interest,
        row.total,
        row.balancePending,
        status,
        paid,
        credit.created_by_id,
      ],
    );

    totalPayable += row.total;
    totalInterest += row.interest;
  }

  await client.query(
    `UPDATE savings.credits
       SET "Installment_amount"=$1,
           total_payable=$2,
           total_interest=$3,
           term_units=$4,
           interest_rate=12,
           term_type='CUOTAS',
           updated_at=now()
     WHERE id=$5`,
    [INSTALLMENT_2, round6(totalPayable), round6(totalInterest), totalInstallments, CREDIT_2],
  );

  console.log(
    `[CRE-000002] schedule regenerado: ${totalInstallments} cuotas | total=${round6(
      totalPayable,
    )} | interés=${round6(totalInterest)} | cuota=${INSTALLMENT_2} | pendiente=${round6(
      CAPITAL_2 - PAID_2,
    )}`,
  );
}

async function fixCredit000036(client) {
  await client.query(
    'UPDATE savings.credits SET requested_amount=$1, updated_at=now() WHERE id=$2',
    [REQUESTED_36, CREDIT_36],
  );

  const result = await client.query(
    `UPDATE savings.credit_amortization_schedule
       SET principal_amount=$1,
           interest_amount=0,
           total_installment_amount=$2,
           updated_at=now()
     WHERE credit_id=$3 AND installment_number=24`,
    [PRINCIPAL_36, INSTALLMENT_36, CREDIT_36],
  );
  if (result.rowCount === 0) {
    throw new Error('CRE-000036: cuota 24 no encontrada');
  }

  console.log(
    `[CRE-000036] requested_amount=${REQUESTED_36} | cuota 24 corregida (interés negativo eliminado)`,
  );
}

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  try {
    await client.query('BEGIN');
    await fixCredit000002(client);
    await fixCredit000036(client);
    await client.query('COMMIT');
    console.log('Listo.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error, se hizo ROLLBACK:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
