export const MOVEMENT_TYPE = {
  PURCHASE_RECEIPT: 'PURCHASE_RECEIPT',
  SUPPLIER_RETURN: 'SUPPLIER_RETURN',
  STOCK_DELIVERY: 'STOCK_DELIVERY',
  CUSTOMER_RETURN: 'CUSTOMER_RETURN',
  INTERNAL_TRANSFER_OUT: 'INTERNAL_TRANSFER_OUT',
  INTERNAL_TRANSFER_IN: 'INTERNAL_TRANSFER_IN',
  INVENTORY_ADJUSTMENT_IN: 'INVENTORY_ADJUSTMENT_IN',
  INVENTORY_ADJUSTMENT_OUT: 'INVENTORY_ADJUSTMENT_OUT',
  STOCK_WASTE: 'STOCK_WASTE',
  INTERNAL_CONSUMPTION: 'INTERNAL_CONSUMPTION',
} as const;

export type MovementType = (typeof MOVEMENT_TYPE)[keyof typeof MOVEMENT_TYPE];

export const MOVEMENT_TYPE_OPTIONS: Record<MovementType, string> = {
  PURCHASE_RECEIPT: 'Recepción de Compra',
  SUPPLIER_RETURN: 'Devolución a Proveedor',
  STOCK_DELIVERY: 'Despacho / Venta',
  CUSTOMER_RETURN: 'Devolución de Cliente',
  INTERNAL_TRANSFER_OUT: 'Transferencia (Salida)',
  INTERNAL_TRANSFER_IN: 'Transferencia (Entrada)',
  INVENTORY_ADJUSTMENT_IN: 'Ajuste de Inventario (Entrada)',
  INVENTORY_ADJUSTMENT_OUT: 'Ajuste de Inventario (Salida)',
  STOCK_WASTE: 'Merma / Desecho',
  INTERNAL_CONSUMPTION: 'Consumo Interno',
} as const;

export const MOVEMENT_TYPE_BADGE_VARIANT: Record<
  MovementType,
  'success' | 'destructive' | 'warning' | 'default' | 'secondary' | 'outline'
> = {
  PURCHASE_RECEIPT: 'success',
  SUPPLIER_RETURN: 'destructive',
  STOCK_DELIVERY: 'destructive',
  CUSTOMER_RETURN: 'success',
  INTERNAL_TRANSFER_OUT: 'warning',
  INTERNAL_TRANSFER_IN: 'warning',
  INVENTORY_ADJUSTMENT_IN: 'outline',
  INVENTORY_ADJUSTMENT_OUT: 'outline',
  STOCK_WASTE: 'destructive',
  INTERNAL_CONSUMPTION: 'secondary',
} as const;

export const MOVEMENT_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const MOVEMENT_STATUS_OPTIONS: Record<string, string> = {
  draft: 'Borrador',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export const MOVEMENT_STATUS_BADGE_VARIANT: Record<
  string,
  'default' | 'success' | 'destructive'
> = {
  draft: 'default',
  completed: 'success',
  cancelled: 'destructive',
};
