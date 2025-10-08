export const GROUP_TYPES = {
  PRODUCT: 'Productos',
  SERVICE: 'Servicios',
  FIXED_ASSET: 'Bienes o Activos',
} as const;

export type GroupType = keyof typeof GROUP_TYPES;
export const GROUP_TYPE_OPTIONS = Object.entries(GROUP_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);
