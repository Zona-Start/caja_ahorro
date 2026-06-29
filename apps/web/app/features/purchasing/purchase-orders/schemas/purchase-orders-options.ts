export const LINE_TYPES = [
  { value: 'SALES_INVENTORY', label: 'Producto' },
  { value: 'SERVICE', label: 'Servicio' },
  { value: 'EXPENSE', label: 'Gasto' },
] as const;

export const ORDER_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'RECEIVED', label: 'Recibido' },
  { value: 'INVOICED', label: 'Facturado' },
  { value: 'CLOSED', label: 'Cerrado' },
  { value: 'CANCELLED', label: 'Cancelado' },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  RECEIVED: 'Recibido',
  INVOICED: 'Facturado',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
};

export const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  PENDING: 'outline',
  RECEIVED: 'default',
  INVOICED: 'default',
  CLOSED: 'default',
  CANCELLED: 'destructive',
};
