export const DAYS_PER_YEAR = 365;
/** Base comercial (360 días) usada por la convención migrada: 24 plazos o 12 cuotas por año. */
export const DAYS_PER_YEAR_COMMERCIAL = 360;
export const DAYS_PER_PLAZO = 15; // plazos: quincenal (2 por mes)
export const DAYS_PER_INSTALLMENT = 30; // cuotas: mensual (1 por mes)

export type TermMode = 'installments' | 'quotas';

/**
 * Normaliza el modo de plazo a `installments` (plazos, quincenal) o
 * `quotas` (cuotas, mensual). Acepta tanto los valores internos como los
 * rótulos usados en configuración/bulk (Plazos, Cuotas, ...).
 */
export function normalizeTermMode(raw: string | null | undefined): TermMode {
  const v = String(raw ?? '')
    .trim()
    .toUpperCase();
  if (
    ['PLAZOS', 'PLAZO', 'INSTALLMENTS', 'QUINCENAL', 'QUINCENALES'].includes(v)
  ) {
    return 'installments';
  }
  return 'quotas';
}

/**
 * Tasa efectiva por cuota bajo el modelo de "interés diario": la tasa anual
 * se lleva a día y cada cuota representa los días del modo.
 *
 *   plazos (installments) -> 15 días
 *   cuotas (quotas)       -> 30 días
 *
 *   r = (tasaAnual / 100) * (días / 360)
 *
 * Base comercial de 360 días: plazos -> 24/año (15/360 = 1/24),
 * cuotas -> 12/año (30/360 = 1/12). Es la base de la convención migrada.
 * Es la base para generar la tabla de amortización francesa (interés
 * decreciente) tanto de préstamos como de créditos.
 */
export function periodRate(
  annualRatePercent: number,
  rawMode: string | null | undefined,
): number {
  const days =
    normalizeTermMode(rawMode) === 'installments'
      ? DAYS_PER_PLAZO
      : DAYS_PER_INSTALLMENT;
  return (annualRatePercent / 100) * (days / DAYS_PER_YEAR_COMMERCIAL);
}
