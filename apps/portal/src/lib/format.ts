/** Formateadores compartidos por las páginas del portal. */

export const money = (v: unknown): string =>
  v == null || v === ''
    ? '—'
    : `Bs. ${Number(v).toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

export const dateFmt = (v: unknown): string =>
  v
    ? new Date(String(v)).toLocaleDateString('es-VE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : '—';

export const text = (v: unknown): string =>
  v == null || v === '' ? '—' : String(v);

export const percent = (v: unknown): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(1)}%`;
};
