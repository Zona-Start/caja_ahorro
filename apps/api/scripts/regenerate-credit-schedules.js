/* eslint-disable no-console */
/**
 * Fases 2 y 3 - Regeneración de tablas de amortización de CRÉDITOS migrados
 * (comercial y jornada de salud).
 *
 * Modelo: se CONSERVAN monto, fecha de inicio y cuota de la fuente; los plazos
 * son ajustables. Se DERIVA la tasa de (monto, cuota, plazos); si supera el
 * TOPE del 12% anual, se fija en 12% y se DERIVA el número de plazos.
 *
 * Ancla (fuente de verdad): saldo contable por auxiliar_socio:
 *   - CREDITOS COMERCIALES -> 121.01.00.00.005
 *   - JORNADA SALUD        -> 121.01.00.00.007
 *
 * Casos especiales:
 *   - CRE-000002: cuota forzada a 1358.
 *   - CRE-000036: se deja como está (sin fuente).
 *
 * Uso:
 *   node scripts/regenerate-credit-schedules.js --type=comercial [--apply]
 *   node scripts/regenerate-credit-schedules.js --type=jornada   [--apply]
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const APPLY = process.argv.includes('--apply');
const typeArg = (process.argv.find((a) => a.startsWith('--type=')) || '').split('=')[1];
const TYPES = {
  comercial: {
    name: 'CREDITOS COMERCIALES',
    account: '121.01.00.00.005',
    capitalIncludesExpenses: false, // comercial: sin gasto financiado
  },
  jornada: {
    name: 'JORNADA SALUD',
    account: '121.01.00.00.007',
    capitalIncludesExpenses: true, // jornada: capital = monto + 8% gasto
  },
};
const DAYS_PER_PLAZO = 15; // cadencia quincenal (cada plazo = 15 dias)
const DAYS_PER_YEAR_COMMERCIAL = 360; // base comercial: 24 plazos/año
const ANNUAL_RATE_CAP = 12;
const RATE_CAP =
  (ANNUAL_RATE_CAP / 100) * (DAYS_PER_PLAZO / DAYS_PER_YEAR_COMMERCIAL);
const OVERRIDES = { 'CRE-000002': { cuota: 1358 } };
const SKIP = new Set(['CRE-000036']);

function round6(n) {
  return Number(n.toFixed(6));
}
function round2(n) {
  return Number(n.toFixed(2));
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
function frenchCuota(C, r, n) {
  if (r === 0) return C / n;
  const factor = Math.pow(1 + r, n);
  return (C * r * factor) / (factor - 1);
}
function solveR(C, cuota, n) {
  if (cuota <= C / n) return null;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 300; i++) {
    const r = (lo + hi) / 2;
    if (frenchCuota(C, r, n) > cuota) hi = r;
    else lo = r;
  }
  return (lo + hi) / 2;
}
/** Deriva n para que la cuota francesa = cuota, con tasa fija r. */
function solveN(C, cuota, r) {
  if (C * r >= cuota) return null;
  const n = -Math.log(1 - (C * r) / cuota) / Math.log(1 + r);
  return Math.max(1, Math.round(n));
}
function buildFrenchSchedule(C, n, r, cuota, startDate) {
  const rows = [];
  let balance = C;
  for (let i = 1; i <= n; i++) {
    const interest = balance * r;
    let principal = cuota - interest;
    if (i === n) principal = balance;
    if (principal < 0) principal = 0;
    balance -= principal;
    rows.push({
      n: i,
      dueDate: addDays(startDate, i * DAYS_PER_PLAZO),
      principal: round6(principal),
      interest: round6(interest),
      total: round6(principal + interest),
      balancePending: round6(Math.max(0, balance)),
    });
  }
  return rows;
}
function assignPayments(rows, C, target) {
  const paidCapitalTarget = C - target;
  let cum = 0;
  let boundaryReached = false;
  for (const row of rows) {
    if (!boundaryReached && cum + row.principal <= paidCapitalTarget + 1e-6) {
      row.status = 'PAID';
      row.paid = row.total;
      cum += row.principal;
    } else if (!boundaryReached && paidCapitalTarget - cum > 1e-6) {
      const capInRow = paidCapitalTarget - cum;
      row.status = 'PARTIAL';
      row.paid = round6(row.interest + capInRow);
      cum = paidCapitalTarget;
      boundaryReached = true;
    } else {
      row.status = 'PENDING';
      row.paid = 0;
      boundaryReached = true;
    }
  }
}
function computePending(rows) {
  return round6(
    rows.reduce((sum, r) => {
      const capitalPagado = Math.max(0, r.paid - Math.max(0, r.interest));
      return sum + Math.max(0, r.principal - capitalPagado);
    }, 0),
  );
}
function correctResidual(rows, target) {
  const residual = round6(target - computePending(rows));
  if (Math.abs(residual) < 1e-9) return;
  for (let k = rows.length - 1; k >= 0; k--) {
    if (rows[k].status === 'PENDING' || rows[k].status === 'PARTIAL') {
      rows[k].principal = round6(rows[k].principal + residual);
      // Mantener la consistencia de la fila: total = principal + interés.
      rows[k].total = round6(rows[k].total + residual);
      return;
    }
  }
}

async function runType(typeKey) {
  const type = TYPES[typeKey];
  if (!type) throw new Error('--type invalido (use comercial|jornada)');

  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  try {
    await client.query('BEGIN');

    const { rows: credits } = await client.query(
      `SELECT c.id, c.custom_reference, c.status, c.requested_amount,
              c.expenses_amount, c.term_units, c.start_date, c.created_by_id,
              a.cedula
         FROM savings.credits c
         JOIN savings.associates a ON a.id = c.associate_id
         JOIN savings.credits_types ct ON ct.id = c.credit_type_id
        WHERE ct.name = $1 AND c.status IN ('IN_PAYMENT','APPROVED')
        ORDER BY c.custom_reference`,
      [type.name],
    );

    const { rows: contables } = await client.query(
      `SELECT auxiliar_socio, (debe - COALESCE(haber,0)) AS target
         FROM public.contables_asociados WHERE cuenta=$1`,
      [type.account],
    );
    const targetByCedula = new Map(
      contables.map((c) => [String(c.auxiliar_socio), Number(c.target)]),
    );

    const sourceTable =
      typeKey === 'jornada'
        ? 'creditos_comercial_jornada_salud'
        : 'creditos_comercial';
    const { rows: source } = await client.query(
      `SELECT cedula, monto, cuota, plazos FROM public.${sourceTable}`,
    );
    const sourceMap = new Map();
    for (const s of source) {
      const key = `${s.cedula}|${round2(s.monto)}`;
      if (!sourceMap.has(key)) {
        sourceMap.set(key, { cuota: Number(s.cuota), plazos: Number(s.plazos) });
      }
    }

    let processed = 0;
    let skippedNoTarget = 0;
    let skippedNoRate = 0;
    let capped = 0;
    let mismatch = 0;
    const samples = [];

    for (const credit of credits) {
      const cedula = String(credit.cedula);
      const requested = Number(credit.requested_amount);
      const expenses = Number(credit.expenses_amount || 0);
      const C = requested + (type.capitalIncludesExpenses ? expenses : 0);
      const target = targetByCedula.get(cedula);

      if (SKIP.has(credit.custom_reference)) {
        console.log(`  [SKIP por diseño] ${credit.custom_reference}`);
        continue;
      }
      if (target === undefined) {
        skippedNoTarget++;
        console.log(`  [SKIP sin contable] ${credit.custom_reference} cedula=${cedula}`);
        continue;
      }
      if (!C || C <= 0) {
        console.log(`  [SKIP datos invalidos] ${credit.custom_reference} C=${C}`);
        continue;
      }

      const override = OVERRIDES[credit.custom_reference];
      const key = `${cedula}|${round2(requested)}`;
      const src = sourceMap.get(key);
      let cuota = override?.cuota ?? src?.cuota;
      if (cuota === undefined) {
        console.log(`  [SKIP sin fuente] ${credit.custom_reference} cedula=${cedula}`);
        continue;
      }

      const nSource = src?.plazos || Number(credit.term_units) || 1;
      let r = solveR(C, cuota, nSource);
      let n = nSource;
      let wasCapped = false;
      if (r === null || r > RATE_CAP + 1e-9) {
        r = RATE_CAP;
        const nDerived = solveN(C, cuota, r);
        if (nDerived === null) {
          skippedNoRate++;
          console.log(`  [SKIP no derivable] ${credit.custom_reference} cuota=${cuota} C*r=${round2(C * r)}`);
          continue;
        }
        n = nDerived;
        wasCapped = true;
        capped++;
      }

      const startDate = toDateStr(credit.start_date);
      const rows = buildFrenchSchedule(C, n, r, cuota, startDate);
      assignPayments(rows, C, target);
      correctResidual(rows, target);

      const pending = computePending(rows);
      const diff = round6(pending - target);
      if (Math.abs(diff) > 0.01) mismatch++;

      const annualRate = round6(
        r * (DAYS_PER_YEAR_COMMERCIAL / DAYS_PER_PLAZO) * 100,
      );
      if (samples.length < 40) {
        samples.push({
          ref: credit.custom_reference,
          cedula,
          C: round2(C),
          n,
          cuota: round6(cuota),
          tasaAnual: annualRate,
          topada: wasCapped ? 'SI' : '',
          target: round2(target),
          pending,
          diff,
        });
      }

      if (APPLY) {
        await client.query(
          'DELETE FROM savings.credit_amortization_schedule WHERE credit_id=$1',
          [credit.id],
        );
        for (const row of rows) {
          await client.query(
            `INSERT INTO savings.credit_amortization_schedule
               (credit_id, installment_number, due_date, principal_amount,
                interest_amount, total_installment_amount,
                principal_balance_pending, payment_status, paid_amount,
                created_by_id, updated_by_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
            [
              credit.id,
              row.n,
              row.dueDate,
              row.principal,
              row.interest,
              row.total,
              row.balancePending,
              row.status,
              row.paid,
              credit.created_by_id,
            ],
          );
        }
        const totalPayable = round6(rows.reduce((s, r2) => s + r2.total, 0));
        const totalInterest = round6(rows.reduce((s, r2) => s + r2.interest, 0));
        const endDate = rows[rows.length - 1].dueDate;
        await client.query(
          `UPDATE savings.credits
              SET "Installment_amount"=$1, total_payable=$2, total_interest=$3,
                  term_units=$4, interest_rate=$5, end_date=$6,
                  expenses_amount=$7, term_type='PLAZOS', updated_at=now()
            WHERE id=$8`,
          [
            round6(cuota),
            totalPayable,
            totalInterest,
            n,
            annualRate,
            endDate,
            type.capitalIncludesExpenses ? expenses : 0,
            credit.id,
          ],
        );
      }
      processed++;
    }

    console.log(`\n=== ${type.name} (cuenta ${type.account}) ===`);
    console.table(samples);
    console.log(`Modo:               ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
    console.log(`Procesados:         ${processed}`);
    console.log(`SKIP sin contable:  ${skippedNoTarget}`);
    console.log(`SKIP no derivable:  ${skippedNoRate}`);
    console.log(`Topados a 12%:      ${capped}`);
    console.log(`Pending != target:  ${mismatch}`);

    if (APPLY) {
      await client.query('COMMIT');
      console.log('COMMIT aplicado.');
    } else {
      await client.query('ROLLBACK');
      console.log('Dry-run: ROLLBACK (nada escrito).');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error, se hizo ROLLBACK:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

async function main() {
  const keys = typeArg ? [typeArg] : ['comercial', 'jornada'];
  for (const key of keys) {
    await runType(key);
  }
}

main();
