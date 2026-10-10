/* eslint-disable no-console */
/**
 * Fase 1 - Regeneración de tablas de amortización de PRÉSTAMOS migrados.
 *
 * Modelo: se CONSERVA la cuota de la fuente (public.prestamos_personales /
 * prestamos_personales_2) y el monto/plazos/fecha de inicio; se DERIVA la tasa
 * por cuota resolviendo la ecuación francesa:
 *
 *   cuota = C * r * (1+r)^n / ((1+r)^n - 1)
 *
 * Sin tope de tasa (se respeta la tasa implícita de la fuente).
 * Ancla (fuente de verdad): saldo contable 121.01.00.00.001 (debe - haber).
 * El prefijo de cuotas se marca PAID/PARTIAL para que el CAPITAL pendiente del
 * schedule sea EXACTAMENTE igual al saldo contable.
 *
 * Uso:
 *   node scripts/regenerate-loan-schedules.js            # dry-run
 *   node scripts/regenerate-loan-schedules.js --apply    # aplica (transacción)
 *
 * No crea movimientos de asociado ni asientos contables.
 * No toca el pago de migración (PRE-PAG-*).
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const APPLY = process.argv.includes('--apply');
const CTA_PRESTAMOS = '121.01.00.00.001';
const DAYS_PER_PLAZO = 15; // cadencia quincenal (cada plazo = 15 dias)
const DAYS_PER_YEAR_COMMERCIAL = 360; // base comercial: 24 plazos/año

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
/** Resuelve r de la cuota. null si cuota < C/n (imposible); 0 si cuota ~ C/n. */
function solveR(C, cuota, n) {
  const base = C / n;
  if (cuota < base - 0.01) return null;
  if (cuota <= base + 0.01) return 0;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 300; i++) {
    const r = (lo + hi) / 2;
    if (frenchCuota(C, r, n) > cuota) hi = r;
    else lo = r;
  }
  return (lo + hi) / 2;
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

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  try {
    await client.query('BEGIN');

    const { rows: loans } = await client.query(`
      SELECT l.id, l.custom_reference, l.status, l.requested_amount,
             l.expenses_amount, l.term_units, l."Installment_amount",
             l.start_date, l.created_by_id, a.cedula
      FROM savings.loans l
      JOIN savings.associates a ON a.id = l.associate_id
      WHERE l.status IN ('IN_PAYMENT','DISBURSED')
      ORDER BY l.custom_reference
    `);

    const { rows: contables } = await client.query(
      `SELECT auxiliar_socio, (debe - COALESCE(haber,0)) AS target
         FROM public.contables_asociados WHERE cuenta=$1`,
      [CTA_PRESTAMOS],
    );
    const targetByCedula = new Map(
      contables.map((c) => [String(c.auxiliar_socio), Number(c.target)]),
    );

    const { rows: source } = await client.query(`
      SELECT cedula, monto, cuota, plazos FROM public.prestamos_personales
      UNION ALL
      SELECT cedula, monto, cuota, plazos FROM public.prestamos_personales_2
    `);
    const sourceMap = new Map(); // `${cedula}|${plazos}` -> [{monto, cuota}]
    for (const s of source) {
      const key = `${s.cedula}|${s.plazos}`;
      if (!sourceMap.has(key)) sourceMap.set(key, []);
      sourceMap.get(key).push({ monto: Number(s.monto), cuota: Number(s.cuota) });
    }

    let processed = 0;
    let skippedNoTarget = 0;
    let skippedNoRate = 0;
    let usedFallback = 0;
    let mismatch = 0;
    const samples = [];

    for (const loan of loans) {
      const cedula = String(loan.cedula);
      const requested = Number(loan.requested_amount);
      const n = Number(loan.term_units);
      const target = targetByCedula.get(cedula);

      if (target === undefined) {
        skippedNoTarget++;
        console.log(`  [SKIP sin contable] ${loan.custom_reference} cedula=${cedula}`);
        continue;
      }
      if (!n || requested <= 0) {
        console.log(`  [SKIP datos invalidos] ${loan.custom_reference} req=${requested} n=${n}`);
        continue;
      }

      const key = `${cedula}|${n}`;
      const candidates = sourceMap.get(key) ?? [];
      let cuota;
      let capitalBase; // monto base de la fuente (sin gasto)
      if (candidates.length) {
        // La migración pudo dejar requested = monto (normal) o requested = monto*1.06.
        let best = null;
        let bestDist = Infinity;
        for (const c of candidates) {
          const dist = Math.min(
            Math.abs(c.monto - requested),
            Math.abs(c.monto - requested / 1.06),
          );
          if (dist < bestDist) {
            bestDist = dist;
            best = c;
          }
        }
        if (best && bestDist <= 1) {
          cuota = best.cuota;
          capitalBase = best.monto;
        }
      }
      if (cuota === undefined) {
        cuota = Number(loan.Installment_amount); // fallback (sin fuente)
        capitalBase = requested;
        usedFallback++;
        console.log(`  [INFO sin fuente, cuota app] ${loan.custom_reference} cuota=${cuota}`);
      }

      // Capital a amortizar = monto base + 6% de gasto.
      const C = round6(capitalBase * 1.06);

      const r = solveR(C, cuota, n);
      if (r === null) {
        skippedNoRate++;
        console.log(`  [SKIP cuota<=C/n] ${loan.custom_reference} cuota=${cuota} C/n=${round2(C / n)}`);
        continue;
      }

      const startDate = toDateStr(loan.start_date);
      const rows = buildFrenchSchedule(C, n, r, cuota, startDate);
      assignPayments(rows, C, target);
      correctResidual(rows, target);

      const pending = computePending(rows);
      const diff = round6(pending - target);
      if (Math.abs(diff) > 0.01) mismatch++;

      const annualRate = round6(
        r * (DAYS_PER_YEAR_COMMERCIAL / DAYS_PER_PLAZO) * 100,
      );
      if (samples.length < 12) {
        samples.push({
          ref: loan.custom_reference,
          cedula,
          C: round2(C),
          n,
          cuotaFuente: round6(cuota),
          tasaAnual: annualRate,
          target: round2(target),
          pending,
          diff,
        });
      }

      if (APPLY) {
        await client.query(
          'DELETE FROM savings.loan_amortization_schedule WHERE loan_id=$1',
          [loan.id],
        );
        for (const row of rows) {
          await client.query(
            `INSERT INTO savings.loan_amortization_schedule
               (loan_id, installment_number, due_date, principal_amount,
                interest_amount, total_installment_amount,
                principal_balance_pending, payment_status, paid_amount,
                created_by_id, updated_by_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
            [
              loan.id,
              row.n,
              row.dueDate,
              row.principal,
              row.interest,
              row.total,
              row.balancePending,
              row.status,
              row.paid,
              loan.created_by_id,
            ],
          );
        }
        const totalPayable = round6(rows.reduce((s, r2) => s + r2.total, 0));
        const totalInterest = round6(rows.reduce((s, r2) => s + r2.interest, 0));
        const endDate = rows[rows.length - 1].dueDate;
        await client.query(
          `UPDATE savings.loans
              SET "Installment_amount"=$1, total_payable=$2, total_interest=$3,
                  term_units=$4, interest_rate=$5, end_date=$6,
                  term_type='PLAZOS', updated_at=now()
            WHERE id=$7`,
          [round6(cuota), totalPayable, totalInterest, n, annualRate, endDate, loan.id],
        );
      }
      processed++;
    }

    console.log('\n=== MUESTRA ===');
    console.table(samples);
    console.log('\n=== RESUMEN ===');
    console.log(`Modo:                 ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
    console.log(`Loans procesados:     ${processed}`);
    console.log(`SKIP sin contable:    ${skippedNoTarget}`);
    console.log(`SKIP cuota<=C/n:      ${skippedNoRate}`);
    console.log(`Cuota fallback (app): ${usedFallback}`);
    console.log(`Pending != target:    ${mismatch}`);

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

main();
