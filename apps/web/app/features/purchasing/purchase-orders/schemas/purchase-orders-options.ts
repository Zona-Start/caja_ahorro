export const ORDER_STATUS = {
  DRAFT: 'Borrador',
  APPROVED: 'Aprobado',
  INVOICED: 'Facturado',
  CANCELLED: 'Cancelado',
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS;

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS).map(
  ([value, label]) => ({ value, label }),
);

export const LINE_TYPES = [
  { value: 'PRODUCT', label: 'Producto' },
  { value: 'SERVICE', label: 'Servicio' },
  { value: 'EXPENSE', label: 'Gasto' },
  { value: 'MATERIAL', label: 'Material' },
] as const;

export const CURRENCY_CODES = [
  { value: 'USD', label: 'USD - Dólar' },
  { value: 'VES', label: 'VES - Bolívar' },
] as const;
