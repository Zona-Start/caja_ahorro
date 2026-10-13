import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { dateFmt, money, text } from '../lib/format';
import {
  CREDIT_STATUS_TYPES,
  LOAN_STATUS_TYPES,
  PAYMENT_LOAN_STATUS,
  PAYMENT_METHOD_TYPES,
  TERM_TYPES,
  WITHDRAWAL_STATUS_TYPES,
  label,
  statusTone,
} from '../lib/labels';

type Kind = 'prestamo' | 'credito' | 'retiro';

function mv(v: unknown): string {
  return v == null || v === '' ? 'N/A' : money(v);
}
function pct(v: unknown): string {
  return v == null || v === '' ? 'N/A' : `${v}%`;
}
function termLabel(units: unknown, type: unknown): string {
  const t = type ? (TERM_TYPES[String(type)] ?? String(type)) : '';
  const u = units == null || units === '' ? '' : String(units);
  return `${u} ${t}`.trim() || 'N/A';
}

function Field({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: ReactNode }) {
  return (
    <div className="stat">
      <div className="label">{title}</div>
      <div className="value" style={{ fontSize: '1.15rem' }}>{value}</div>
    </div>
  );
}

function StatusBadge({ value, map }: { value: unknown; map: Record<string, string> }) {
  return <span className={`badge ${statusTone(value)}`}>{label(map, value)}</span>;
}

function Schedule({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <div className="schedule-scroll">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Vence</th>
            <th>Capital</th>
            <th>Interés</th>
            <th>Cuota</th>
            <th>Pagado</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={String(r.id ?? i)}>
              <td>{text(r.installmentNumber)}</td>
              <td>{dateFmt(r.dueDate)}</td>
              <td>{money(r.principalAmount)}</td>
              <td>{money(r.interestAmount)}</td>
              <td>{money(r.totalInstallmentAmount)}</td>
              <td>{money(r.paidAmount)}</td>
              <td>
                <StatusBadge value={r.paymentStatus} map={PAYMENT_LOAN_STATUS} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DetailModal() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>('prestamo');
  const [id, setId] = useState('');
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delegación de clicks en los botones "Ver".
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest?.('.js-detail') as HTMLElement | null;
      if (!btn) return;
      e.preventDefault();
      setKind((btn.dataset.kind as Kind) ?? 'prestamo');
      setId(btn.dataset.id ?? '');
      setOpen(true);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (!open || !id) return;
    let active = true;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/detail/${kind}/${id}`)
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!active) return;
        if (!res.ok) setError(body?.message ?? 'No se pudo cargar el detalle.');
        else setData(body?.data ?? null);
      })
      .catch(() => active && setError('No se pudo cargar el detalle.'))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [open, kind, id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const title =
    kind === 'prestamo'
      ? 'Datos del préstamo'
      : kind === 'credito'
        ? 'Datos del crédito'
        : 'Datos del retiro';

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="modal-panel" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading && <p className="muted">Cargando…</p>}
          {error && <div className="alert">{error}</div>}

          {data && kind === 'prestamo' && (
            <>
              <div className="modal-section">
                <h3>Datos del préstamo</h3>
                <div className="modal-dl">
                  <Field k="Tipo" v={text(data.loan?.loanTypeName)} />
                  <Field k="Estado" v={<StatusBadge value={data.loan?.status} map={LOAN_STATUS_TYPES} />} />
                  <Field k="Referencia" v={text(data.loan?.customReference)} />
                  <Field k="Fecha solicitud" v={dateFmt(data.loan?.requestDate)} />
                  <Field k="Aprobación" v={dateFmt(data.loan?.approvalDate)} />
                  <Field k="Desembolso" v={dateFmt(data.loan?.disbursementDate)} />
                  <Field k="Tasa" v={pct(data.loan?.interestRate)} />
                  <Field k="Plazo" v={termLabel(data.loan?.termUnits, data.loan?.termType)} />
                  <Field k="Moneda" v={text(data.loan?.currencyCode)} />
                </div>
              </div>

              <div className="modal-section">
                <h3>Resumen</h3>
                <div className="modal-cards">
                  <Card title="Monto Solicitado" value={mv(data.loan?.requestedAmount)} />
                  <Card title="Cuota" value={mv(data.loan?.installmentAmount)} />
                  <Card title="Gasto Admin." value={mv(data.loan?.expensesAmount)} />
                  <Card title="Interés Total" value={mv(data.loan?.totalInterest)} />
                  <Card title="Total a Pagar" value={mv(data.loan?.totalPayable)} />
                  <Card title="Total Pagado" value={mv(data.summary?.totalPaid)} />
                  <Card title="Pendiente" value={mv(data.summary?.totalPending)} />
                </div>
              </div>

              <div className="modal-section">
                <h3>Plan de amortización</h3>
                <Schedule rows={data.amortizationSchedule ?? []} />
              </div>
            </>
          )}

          {data && kind === 'credito' && (
            <>
              <div className="modal-section">
                <h3>Datos del crédito</h3>
                <div className="modal-dl">
                  <Field k="Tipo" v={text(data.credit?.creditTypeName)} />
                  <Field k="Estado" v={<StatusBadge value={data.credit?.status} map={CREDIT_STATUS_TYPES} />} />
                  <Field k="Referencia" v={text(data.credit?.customReference)} />
                  <Field k="Fecha solicitud" v={dateFmt(data.credit?.requestDate)} />
                  <Field k="Aprobación" v={dateFmt(data.credit?.approvalDate)} />
                  <Field k="Tasa" v={pct(data.credit?.interestRate)} />
                  <Field k="Plazo" v={termLabel(data.credit?.termUnits, data.credit?.termType)} />
                  <Field k="Moneda" v={text(data.credit?.currencyCode)} />
                </div>
              </div>

              <div className="modal-section">
                <h3>Resumen</h3>
                <div className="modal-cards">
                  <Card title="Monto Solicitado" value={mv(data.credit?.requestedAmount)} />
                  <Card title="Cuota" value={mv(data.credit?.installmentAmount)} />
                  <Card title="Gasto Admin." value={mv(data.credit?.expensesAmount)} />
                  <Card title="Interés Total" value={mv(data.credit?.totalInterest)} />
                  <Card title="Total a Pagar" value={mv(data.credit?.totalPayable)} />
                  <Card title="Total Pagado" value={mv(data.summary?.totalPaid)} />
                  <Card title="Pendiente" value={mv(data.summary?.totalPending)} />
                </div>
              </div>

              <div className="modal-section">
                <h3>Plan de amortización</h3>
                <Schedule rows={data.amortizationSchedule ?? []} />
              </div>
            </>
          )}

          {data && kind === 'retiro' && (
            <>
              <div className="modal-section">
                <div className="modal-dl">
                  <Field k="Referencia" v={text(data.withdrawal?.referenceCode)} />
                  <Field k="Tipo" v={text(data.withdrawal?.withdrawalTypeName)} />
                  <Field k="Fecha Solicitud" v={dateFmt(data.withdrawal?.withdrawalDate)} />
                  <Field k="Estado" v={<StatusBadge value={data.withdrawal?.status} map={WITHDRAWAL_STATUS_TYPES} />} />
                  <Field k="Método de Pago" v={label(PAYMENT_METHOD_TYPES, data.withdrawal?.paymentMethod)} />
                </div>
              </div>

              <div className="modal-section">
                <div className="modal-cards">
                  <Card title="Monto Solicitado" value={mv(data.withdrawal?.requestedAmount)} />
                  <Card title="Gastos" value={mv(data.withdrawal?.administrativeFee)} />
                  <Card title="Monto Desembolsado" value={mv(data.withdrawal?.disbursedAmount)} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
