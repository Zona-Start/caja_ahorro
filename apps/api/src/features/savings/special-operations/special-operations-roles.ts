/**
 * Claves de rol contable para Operaciones Especiales.
 * El sufijo es el tipo de retiro, préstamo o crédito tal como se muestra
 * en el paso 4, para que el asiento tenga una cuenta por tipo.
 */
const normalizeType = (value: string) =>
  value.trim().replace(/::/g, ':').replace(/\s+/g, ' ');

export const buildWithdrawalRole = (type: string) =>
  `RETIRO::${normalizeType(type)}`;

export const buildLoanRole = (type: string) =>
  `PRESTAMO::${normalizeType(type)}`;

export const buildCreditRole = (type: string) =>
  `CREDITO::${normalizeType(type)}`;
