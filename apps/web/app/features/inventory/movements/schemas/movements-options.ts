export const MOVEMENT_TYPE = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUST_IN: 'ADJUST_IN',
  ADJUST_OUT: 'ADJUST_OUT',
  TRANSFER: 'TRANSFER',
  COMMIT: 'COMMIT',
  UN_COMMIT: 'UN_COMMIT',
  ORDERED: 'ORDERED',
  RECEIVED: 'RECEIVED',
} as const;

export type MovementType = (typeof MOVEMENT_TYPE)[keyof typeof MOVEMENT_TYPE];

export const MOVEMENT_TYPE_OPTIONS: Record<MovementType, string> = {
  [MOVEMENT_TYPE.IN]: 'Entrada',
  [MOVEMENT_TYPE.OUT]: 'Salida',
  [MOVEMENT_TYPE.ADJUST_IN]: 'Ajuste Entrada',
  [MOVEMENT_TYPE.ADJUST_OUT]: 'Ajuste Salida',
  [MOVEMENT_TYPE.TRANSFER]: 'Transferencia',
  [MOVEMENT_TYPE.COMMIT]: 'Comprometido',
  [MOVEMENT_TYPE.UN_COMMIT]: 'Descomprometido',
  [MOVEMENT_TYPE.ORDERED]: 'Ordenado',
  [MOVEMENT_TYPE.RECEIVED]: 'Recibido',
} as const;

export const MOVEMENT_TYPE_BADGE_VARIANT: Record<
  MovementType,
  'success' | 'danger' | 'warning' | 'default' | 'secondary' | 'outline'
> = {
  [MOVEMENT_TYPE.IN]: 'success',
  [MOVEMENT_TYPE.OUT]: 'danger',
  [MOVEMENT_TYPE.ADJUST_IN]: 'warning',
  [MOVEMENT_TYPE.ADJUST_OUT]: 'warning',
  [MOVEMENT_TYPE.TRANSFER]: 'default',
  [MOVEMENT_TYPE.COMMIT]: 'secondary',
  [MOVEMENT_TYPE.UN_COMMIT]: 'secondary',
  [MOVEMENT_TYPE.ORDERED]: 'default',
  [MOVEMENT_TYPE.RECEIVED]: 'success',
};

export const ITEM_TYPE = {
  PRODUCT: 'PRODUCT',
  RAW_MATERIAL: 'RAW_MATERIAL',
  FINISHED_GOOD: 'FINISHED_GOOD',
  PACKAGING: 'PACKAGING',
  SUPPLIES: 'SUPPLIES',
} as const;

export type ItemType = (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE];

export const ITEM_TYPE_OPTIONS: Record<ItemType, string> = {
  [ITEM_TYPE.PRODUCT]: 'Producto',
  [ITEM_TYPE.RAW_MATERIAL]: 'Materia Prima',
  [ITEM_TYPE.FINISHED_GOOD]: 'Producto Terminado',
  [ITEM_TYPE.PACKAGING]: 'Empaque',
  [ITEM_TYPE.SUPPLIES]: 'Suministros',
} as const;

export const DOCUMENT_TYPE = {
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  PURCHASE_INVOICE: 'PURCHASE_INVOICE',
  SALE_ORDER: 'SALE_ORDER',
  SALE_INVOICE: 'SALE_INVOICE',
  STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT',
  TRANSFER_ORDER: 'TRANSFER_ORDER',
  RECEIPT: 'RECEIPT',
  DELIVERY_NOTE: 'DELIVERY_NOTE',
  OTHER: 'OTHER',
} as const;

export type DocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];

export const DOCUMENT_TYPE_OPTIONS: Record<DocumentType, string> = {
  [DOCUMENT_TYPE.PURCHASE_ORDER]: 'Orden de Compra',
  [DOCUMENT_TYPE.PURCHASE_INVOICE]: 'Factura de Compra',
  [DOCUMENT_TYPE.SALE_ORDER]: 'Orden de Venta',
  [DOCUMENT_TYPE.SALE_INVOICE]: 'Factura de Venta',
  [DOCUMENT_TYPE.STOCK_ADJUSTMENT]: 'Ajuste de Stock',
  [DOCUMENT_TYPE.TRANSFER_ORDER]: 'Orden de Transferencia',
  [DOCUMENT_TYPE.RECEIPT]: 'Recibo',
  [DOCUMENT_TYPE.DELIVERY_NOTE]: 'Nota de Entrega',
  [DOCUMENT_TYPE.OTHER]: 'Otro',
} as const;
