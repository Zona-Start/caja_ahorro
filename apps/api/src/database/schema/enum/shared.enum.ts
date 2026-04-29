import { pgEnum } from 'drizzle-orm/pg-core';

// Estados globales
export const statusEnum = pgEnum('status_enum', [
  'ACTIVE',
  'INACTIVE',
  'PENDING',
  'SUSPENDED',
  'LOCKED',
  'RETIRED',
  'ARCHIVED',
]);

export const currencyCodeEnum = pgEnum('currency_code', ['VES', 'USD', 'EUR']);

export const paymentMethodEnum = pgEnum('payment_method', [
  'CASH', // Efectivo
  'BANK_TRANSFER', // Transferencia bancaria
  'CHECK', // Cheque
  'DEPOSIT', // Depósito
  'OTHER', // Otro método
  'MOBILE_PAYMENT', //PAGO MOVIL
]);

// Datos demográficos compartidos
export const genderEnum = pgEnum('gender', ['FEMENINO', 'MASCULINO', 'OTRO']);

export const nationalityEnum = pgEnum('nationality', [
  'VENEZOLANO',
  'EXTRANJERO',
]);
