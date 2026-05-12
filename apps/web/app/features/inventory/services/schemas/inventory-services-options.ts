export enum InventoryServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const INVENTORY_SERVICE_STATUS_OPTIONS: Record<
  InventoryServiceStatus,
  string
> = {
  [InventoryServiceStatus.ACTIVE]: 'Activo',
  [InventoryServiceStatus.INACTIVE]: 'Inactivo',
};
