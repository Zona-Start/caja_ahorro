import { isAxiosError } from 'axios';

export interface AccountingWarningResult {
  isAccountingWarning: boolean;
  message: string;
}

/**
 * Patrones que indican que la operación financiera fue persistida en el
 * backend, pero no se pudo generar el asiento contable automático debido
 * a una configuración faltante (regla contable / asientos automáticos).
 *
 * El backend lanza un 400 Bad Request con este tipo de mensajes cuando la
 * regla contable no existe, por lo que el cliente debe tratarlo como una
 * advertencia de negocio y no como un fallo de la operación.
 */
const ACCOUNTING_WARNING_PATTERNS = [
  'asientos automáticos',
  'regla contable',
  'asiento contable',
  'no se pudo crear el asiento',
];

/**
 * Inspecciona un error ( típicamente AxiosError proveniente del apiClient )
 * y determina si corresponde a una advertencia contable (operación exitosa
 * pero sin asiento contable generado). Devuelve además el mensaje legible
 * que se debe presentar al usuario.
 */
export function resolveAccountingWarning(
  error: unknown,
): AccountingWarningResult {
  let rawMessage = '';

  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const dataMessage = error.response?.data?.message;
    if (Array.isArray(dataMessage)) {
      rawMessage = dataMessage.join(' ');
    } else if (typeof dataMessage === 'string') {
      rawMessage = dataMessage;
    }
  }

  if (!rawMessage && error instanceof Error) {
    rawMessage = error.message;
  }

  const normalized = rawMessage.toLowerCase();
  const isAccountingWarning = ACCOUNTING_WARNING_PATTERNS.some((pattern) =>
    normalized.includes(pattern.toLowerCase()),
  );

  return {
    isAccountingWarning,
    message: rawMessage || 'No se pudo completar la operación.',
  };
}