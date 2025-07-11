export const ESTATUS_TYPES = {
  ACTIVE: 'ACTIVO', // EEl producto está disponible para la venta
  UNDER_MAINTENANCE: 'EN MANTENIMIENTO', // El producto no está disponible para la venta ni es visible públicamente en el catálogo
  INACTIVE: 'INACTIVO', // El producto no tiene unidades disponibles para la venta en este momento
  DEREGISTERED: 'RETIRADO', // El producto aún no está a la venta, pero los clientes pueden verlo y, en algunos casos, reservarlo
} as const;

export type EstatusType = keyof typeof ESTATUS_TYPES;
