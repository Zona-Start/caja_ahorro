export interface PendingBalanceInstallment {
  principalAmount: string | number | null;
  interestAmount: string | number | null;
  paidAmount: string | number | null;
  paymentStatus: string;
}

/**
 * Saldo pendiente administrativo de un préstamo/crédito.
 *
 * Es la única fuente de verdad del saldo: suma el CAPITAL pendiente de cada
 * cuota, aplicando la prelación de pago (el pago cubre primero el interés y
 * luego el capital). Coincide con el saldo contable de la cuenta de préstamo/
 * crédito (que se debita por el capital y se acredita por el capital pagado).
 *
 *   capitalPagado = max(0, paidAmount - interestAmount)
 *   capitalPendiente = max(0, principalAmount - capitalPagado)
 *
 * Las cuotas 'PAID' aportan 0 automáticamente.
 */
export function computePendingBalance(
  installments: PendingBalanceInstallment[],
): number {
  const total = installments.reduce((sum, i) => {
    const principal = Number(i.principalAmount ?? 0);
    // Ignorar intereses negativos (schedules migrados corruptos no deben
    // generar "capital pagado fantasma").
    const interest = Math.max(0, Number(i.interestAmount ?? 0));
    const paid = Number(i.paidAmount ?? 0);
    const capitalPagado = Math.max(0, paid - interest);
    const capitalPendiente = Math.max(0, principal - capitalPagado);
    return sum + capitalPendiente;
  }, 0);

  return parseFloat(total.toFixed(6));
}
