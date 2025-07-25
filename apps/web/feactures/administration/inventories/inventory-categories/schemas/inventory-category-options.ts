export const GROUP_TYPES = {
  PRODUCT: 'PRODUCTO',
  SERVICE: 'SERVICIO',
  FIXED_ASSET: 'BIEN O ACTIVO',
} as const;

export type GroupType = keyof typeof GROUP_TYPES;
export const GROUP_TYPE_OPTIONS = Object.entries(GROUP_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);
