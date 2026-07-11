import { inventorySchema } from '../_schemas';

export const movementTypeInventoryEnum = inventorySchema.enum(
  'movement_type_inventory',
  [
    // === FLUJO DE COMPRAS (PROVEEDORES) ===
    'PURCHASE_RECEIPT', // Entrada por Recepción de Compra / Proveedor
    'SUPPLIER_RETURN', // Salida por Devolución de mercancía al Proveedor

    // === FLUJO DE VENTAS / ENTREGAS (ASOCIADOS O CLIENTES) ===
    'STOCK_DELIVERY', // Salida por Despacho de Venta o entrega de bienes por Crédito
    'CUSTOMER_RETURN', // Entrada por Devolución de un Cliente/Asociado

    // === TRANSFERENCIAS INTERNAS (MULTIBODEGA / SUCURSALES) ===
    'INTERNAL_TRANSFER_OUT', // Salida física desde un almacén origen hacia tránsito/otro almacén
    'INTERNAL_TRANSFER_IN', // Entrada física al almacén destino proveniente de otra bodega

    // === AJUSTES DE AUDITORÍA Y CONTROL ===
    'INVENTORY_ADJUSTMENT_IN', // Entrada por ajuste manual (Sobrante de inventario)
    'INVENTORY_ADJUSTMENT_OUT', // Salida por ajuste manual (Faltante de inventario)
    'STOCK_WASTE', // Salida directa por merma, rotura, fecha de vencimiento o daño

    // === OPERACIONES Y GASTOS INTERNOS ===
    'INTERNAL_CONSUMPTION', // Salida de inventario para uso o gasto operativo de la propia institución
    'PRODUCTION_CONSUMPTION', // Salida / Consumo de componentes o materia prima para armar un KIT/Combo
    'PRODUCTION_OUTPUT', // Entrada del producto final armado/KIT terminado al inventario
  ],
);

/**
 * Enum para controlar el ciclo de vida y la auditoría del movimiento (Maestro-Detalle).
 */
export const inventoryMovementStatusEnum = inventorySchema.enum(
  'inventory_movement_status',
  [
    'draft', // Borrador: No afecta el stock actual (físico ni proyectado)
    'completed', // Completado: Afecta el inventario y bloquea el documento contra modificaciones
    'cancelled', // Cancelado: Revierte el impacto en el stock y requiere justificación/auditoría
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
