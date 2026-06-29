export const ESTATUS_TYPES = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  IN_PAYMENT: 'En Pago',
  PAID: 'Pagado',
} as const;

export const CREDIT_MODALITY = {
  ORDINARY: 'Ordinario',
  SPECIAL_QUOTAS: 'Cuotas Especiales',
} as const;

export const PAYMENT_METHOD = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia Bancaria',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  MOBILE_PAYMENT: 'Pago Móvil',
  OTHER: 'Otro',
} as const;

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  installments: 'Plazos (Quincenal)',
  quotas: 'Cuotas (Mensual)',
};

export const CASA_COMERCIAL_TYPES = {
  inventory: 'Inventario Interno',
  supplier: 'Proveedor',
} as const;

export const STATUS_CLASSES: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_PAYMENT: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
};

export const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'Seleccionar...' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'deposit', label: 'Depósito' },
  { value: 'pago_movil', label: 'Pago Móvil' },
  { value: 'check', label: 'Cheque' },
  { value: 'cash', label: 'Efectivo' },
];

export type EstatusType = keyof typeof ESTATUS_TYPES;
export type CreditModality = keyof typeof CREDIT_MODALITY;
export type PaymentMethod = keyof typeof PAYMENT_METHOD;
