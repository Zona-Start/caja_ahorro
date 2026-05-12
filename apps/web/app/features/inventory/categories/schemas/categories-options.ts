export const GROUP_TYPES = {
  PRODUCTS: 'PRODUCTS',
  SERVICES: 'SERVICES',
  FIXED_ASSETS: 'FIXED_ASSETS',
} as const;

export type GroupType = (typeof GROUP_TYPES)[keyof typeof GROUP_TYPES];

export const GROUP_TYPE_OPTIONS = [
  { value: GROUP_TYPES.PRODUCTS, label: 'Productos' },
  { value: GROUP_TYPES.SERVICES, label: 'Servicios' },
  { value: GROUP_TYPES.FIXED_ASSETS, label: 'Activos Fijos' },
] as const;
