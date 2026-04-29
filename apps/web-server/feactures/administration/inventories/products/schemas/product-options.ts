export const PRODUCT_STATUS_TYPES = {
  AVAILABLE: 'Diponible', // El producto está disponible para la venta
  DISABLED: 'No Disponible', // El producto no está disponible para la venta ni es visible públicamente en el catálogo
  OUT_OF_STOCK: 'Agotado', // El producto no tiene unidades disponibles para la venta en este momento
  COMMING_SOON: 'Proximamente', // El producto aún no está a la venta, pero los clientes pueden verlo y, en algunos casos, reservarlo
  ON_SALE: 'En Oferta', // en oferta
} as const;

export const UNIT_OF_MEASURE_TYPES = {
  UNIT: 'Unidad',
  KILOGRAM: 'Kilogramo',
  LITER: 'Litro',
  METER: 'Metro',
  BOX: 'Caja',
  PACK: 'Paquetes',
} as const;

export type UnitOfMeasureType = keyof typeof UNIT_OF_MEASURE_TYPES;

export type ProductStatusType = keyof typeof PRODUCT_STATUS_TYPES;
