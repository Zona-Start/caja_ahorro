/** Formateadores compartidos por las páginas del portal. */

const CURRENCY_SYMBOLS: Record<string, string> = {
  VES: 'Bs.',
  USD: 'US$',
  EUR: '€',
};

export const money = (v: unknown, currency = 'VES'): string => {
  if (v == null || v === '') return '—';
  const symbol = CURRENCY_SYMBOLS[String(currency)] ?? String(currency);
  return `${symbol} ${Number(v).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/** Moneda visible: solo se considera divisa si tiene tasa guardada. */
export const displayCurrency = (
  currencyCode: unknown,
  exchangeRate: unknown,
): string => {
  const code = String(currencyCode ?? 'VES');
  const rate = Number(exchangeRate ?? 0);
  return code !== 'VES' && rate > 0 ? code : 'VES';
};

/** Tasa de creación guardada en el préstamo/crédito. */
export const creationRate = (exchangeRate: unknown): number => {
  const rate = Number(exchangeRate ?? 0);
  return rate > 0 ? rate : 1;
};

/** Tasa del día; si no viene, usa la tasa de creación. */
export const currentRate = (
  currentExchangeRate: unknown,
  exchangeRate: unknown,
): number => {
  const current = Number(currentExchangeRate ?? 0);
  if (current > 0) return current;
  return creationRate(exchangeRate);
};

/** Equivalente en Bs de un monto en divisa. */
export const bsEquivalent = (value: unknown, rate: number): string => {
  if (value == null || value === '') return '—';
  return money(Number(value) * rate, 'VES');
};

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
