export interface ForeignExchangePriorPayment {
  balancePending: string | number | null;
  exchangeRate: string | number | null;
}

export interface ForeignExchangeGainParams {
  currencyCode?: string | null;
  paymentRate: number;
  creationRate: number;
  /** Capital pendiente en la moneda del préstamo/crédito antes del pago. */
  pendingPrincipalForeign: number;
  /** Capital original en la moneda del préstamo/crédito. */
  originalPrincipalForeign?: number;
  /** Pagos anteriores al pago actual, en orden cronológico. */
  priorPayments?: ForeignExchangePriorPayment[];
  /** Solo se reconoce diferencia cuando el pago liquida la deuda. */
  closesDebt: boolean;
}

/**
 * Calcula la ganancia por diferencia de cambio al liquidar un préstamo/crédito
 * en divisa. La deuda contable está expresada en Bs a la tasa de creación;
 * los pagos se aplican a la tasa del día de pago. Si al liquidar el pago en Bs
 * supera el saldo contable pendiente, la diferencia es una ganancia cambiaria.
 */
export function calculateForeignExchangeGain(
  params: ForeignExchangeGainParams,
): number {
  const currency = String(params.currencyCode ?? '').toUpperCase();
  if (!params.closesDebt || !currency || currency === 'VES') return 0;

  const paymentRate = Number(params.paymentRate);
  const creationRate = Number(params.creationRate);
  const pendingPrincipal = Number(params.pendingPrincipalForeign);
  if (
    !Number.isFinite(paymentRate) ||
    !Number.isFinite(creationRate) ||
    !Number.isFinite(pendingPrincipal) ||
    paymentRate <= 0 ||
    creationRate <= 0 ||
    pendingPrincipal <= 0
  ) {
    return 0;
  }

  let remainingDebtBase = pendingPrincipal * creationRate;
  const priorPayments = params.priorPayments ?? [];
  const originalPrincipal = Number(params.originalPrincipalForeign ?? 0);

  // Reconstruye el saldo contable en Bs a partir de los pagos anteriores.
  // Cada pago acreditó capital por la reducción de capital en divisa
  // multiplicada por la tasa con la que se pagó.
  if (
    priorPayments.length > 0 &&
    originalPrincipal > 0 &&
    priorPayments.every(
      (p) => p.balancePending !== null && p.balancePending !== undefined,
    )
  ) {
    let previousBalance = originalPrincipal;
    let priorPrincipalBase = 0;

    for (const payment of priorPayments) {
      const balanceAfter = Number(payment.balancePending);
      if (!Number.isFinite(balanceAfter)) {
        priorPrincipalBase = NaN;
        break;
      }

      const principalPaid = Math.max(0, previousBalance - balanceAfter);
      const rate = Number(payment.exchangeRate ?? 0) || creationRate;
      priorPrincipalBase += principalPaid * rate;
      previousBalance = balanceAfter;
    }

    if (Number.isFinite(priorPrincipalBase)) {
      remainingDebtBase = Math.max(
        0,
        originalPrincipal * creationRate - priorPrincipalBase,
      );
    }
  }

  const paymentPrincipalBase = pendingPrincipal * paymentRate;
  const gain = paymentPrincipalBase - remainingDebtBase;
  return gain > 0 ? Number(gain.toFixed(2)) : 0;
}
