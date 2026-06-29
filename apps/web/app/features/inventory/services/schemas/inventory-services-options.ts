import { z } from 'zod';

export enum InventoryServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const SERVICE_TYPE_OPTIONS = [
  { value: 'USO_INTERNO', label: 'Uso Interno' },
  { value: 'USO_ASOCIADO', label: 'Uso Asociado' },
] as const;

export const INVENTORY_SERVICE_STATUS_OPTIONS: Record<InventoryServiceStatus, string> = {
  [InventoryServiceStatus.ACTIVE]: 'Activo',
  [InventoryServiceStatus.INACTIVE]: 'Inactivo',
};
