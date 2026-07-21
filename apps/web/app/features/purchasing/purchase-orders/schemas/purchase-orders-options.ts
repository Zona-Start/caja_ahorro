export const LINE_TYPES = [
  { value: 'SALES_INVENTORY', label: 'Producto' },
  { value: 'FIXED_ASSET', label: 'Activo Fijo' },
  { value: 'SERVICE', label: 'Servicio' },
  { value: 'SERVICE_EXPENSE', label: 'Servicio (Gasto)' },
  { value: 'EXPENSE', label: 'Gasto' },
] as const;

export const ORDER_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'APPROVED', label: 'Aprobada' },
  { value: 'PARTIALLY_RECEIVED', label: 'Recibido Parcial' },
  { value: 'RECEIVED', label: 'Recibido' },
  { value: 'CLOSED', label: 'Cerrado' },
  { value: 'CANCELLED', label: 'Cancelado' },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  APPROVED: 'Aprobada',
  PARTIALLY_RECEIVED: 'Recibido Parcial',
  RECEIVED: 'Recibido',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
};

export const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  APPROVED: 'outline',
  PARTIALLY_RECEIVED: 'default',
  RECEIVED: 'default',
  CLOSED: 'default',
  CANCELLED: 'destructive',
};
