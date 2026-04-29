import { inventorySchema } from "../_schemas";


export const movementTypeInventory = inventorySchema.enum(
  'movement_type_inventory',
  [
    'IN',
    'OUT',
    'ADJUST_IN',
    'ADJUST_OUT',
    'TRANSFER',
    'COMMIT',
    'UN_COMMIT',
    'ORDERED',
    'RECEIVED',
  ],
);

export const unitOfMeasureEnum = inventorySchema.enum('unit_of_measure', [
  'UNIT',
  'KILOGRAM',
  'LITER',
  'METER',
  'BOX',
  'PACK',
]);

export const invoiceTypeEnum = inventorySchema.enum('invoice_type_enum', [
  'EXPENSE',
  'PURCHASE',
]);

export const fixedAssetsInventoryStatus = inventorySchema.enum(
  'fixed_assets_inventory_status',
  [
    'ACTIVE', // En uso y operativo
    'UNDER_MAINTENANCE', // Actualmente en reparación
    'INACTIVE', // No en uso, pero aún propiedad de la caja
    'DEREGISTERED', // Ya no es propiedad de la caja
  ],
);
export const productStatus = inventorySchema.enum('product_status', [
  'AVAILABLE', // EEl producto está disponible para la venta
  'DISABLED', // El producto no está disponible para la venta ni es visible públicamente en el catálogo
  'OUT_OF_STOCK', // El producto no tiene unidades disponibles para la venta en este momento
  'COMMING_SOON', // El producto aún no está a la venta, pero los clientes pueden verlo y, en algunos casos, reservarlo
  'ON_SALE', // en oferta
]);
export const priceTypeEnum = inventorySchema.enum('price_type', [
  'COST',
  'SELLING',
  'OFFER',
]);
