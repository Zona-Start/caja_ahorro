export const ESTATUS_TYPES = {
  ACTIVE: 'ACTIVO',
  INACTIVE: 'INACTIVO',
  SUSPENDED: 'SUSPENDIDO',
} as const;

export const SUPPLIER_CATEGORY_TYPES = {
  ASSETS: 'ACTIVOS',
  SERVICE: 'SERVICIOS',
  PRODUCTS: 'PRODUCTOS',
  MATERIALS: 'MATERIALES',
  FURNITURE: 'MOBILIARIO',
  OTHERS: 'OTROS',
} as const;

export type SupplierCategoryType = keyof typeof SUPPLIER_CATEGORY_TYPES;
export type EstatusType = keyof typeof ESTATUS_TYPES;
