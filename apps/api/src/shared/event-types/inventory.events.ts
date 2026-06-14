export const INVENTORY_EVENTS = {
  PRODUCT_CREATED: 'inventory.product.created',
  PRODUCT_UPDATED: 'inventory.product.updated',
  PRODUCT_PRICE_CHANGED: 'inventory.product.price.changed',
  SERVICE_CREATED: 'inventory.service.created',
  SERVICE_UPDATED: 'inventory.service.updated',
  SERVICE_PRICE_CHANGED: 'inventory.service.price.changed',
  MOVEMENT_CREATED: 'inventory.movement.created',
  MOVEMENT_REVERSED: 'inventory.movement.reversed',
  STOCK_LEVEL_CHANGED: 'inventory.stock.level.changed',
  FIXED_ASSET_CREATED: 'inventory.fixed.asset.created',
  FIXED_ASSET_DEPRECIATED: 'inventory.fixed.asset.depreciated',
} as const;

export interface InventoryProductCreatedEvent {
  tenantId: string;
  productId: string;
  sku: string;
  name: string;
  categoryId: string;
  timestamp: string;
}

export interface InventoryProductUpdatedEvent {
  tenantId: string;
  productId: string;
  sku: string;
  changes: Record<string, any>;
  timestamp: string;
}

export interface InventoryProductPriceChangedEvent {
  tenantId: string;
  productId: string;
  previousPrice: number;
  newPrice: number;
  timestamp: string;
}

export interface InventoryMovementCreatedEvent {
  tenantId: string;
  movementId: string;
  itemId: string;
  itemType: string;
  movementType: string;
  quantity: number;
  referenceId?: string;
  referenceType?: string;
  timestamp: string;
}

export interface InventoryMovementReversedEvent {
  tenantId: string;
  movementId: string;
  originalMovementId: string;
  itemId: string;
  itemType: string;
  timestamp: string;
}

export interface InventoryStockLevelChangedEvent {
  tenantId: string;
  itemId: string;
  itemType: string;
  previousQuantity: number;
  newQuantity: number;
  timestamp: string;
}

export interface InventoryFixedAssetCreatedEvent {
  tenantId: string;
  assetId: string;
  name: string;
  acquisitionCost: number;
  timestamp: string;
}

export interface InventoryFixedAssetDepreciatedEvent {
  tenantId: string;
  assetId: string;
  period: string;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  timestamp: string;
}
