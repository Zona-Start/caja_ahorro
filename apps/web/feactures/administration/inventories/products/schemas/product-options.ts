export const PRODUCT_STATUS_TYPES = {
  AVAILABLE: 'DISPONIBLE', // El producto está disponible para la venta
  DISABLED: 'NO DISPONIBLE', // El producto no está disponible para la venta ni es visible públicamente en el catálogo
  OUT_OF_STOCK: 'AGOTADO', // El producto no tiene unidades disponibles para la venta en este momento
  COMMING_SOON: 'PROXIMAMENTE', // El producto aún no está a la venta, pero los clientes pueden verlo y, en algunos casos, reservarlo
  ON_SALE: 'EN OFERTA', // en oferta
} as const;

export type ProductStatusType = keyof typeof PRODUCT_STATUS_TYPES;
