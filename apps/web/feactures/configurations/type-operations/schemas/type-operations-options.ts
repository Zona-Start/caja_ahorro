export const GROUP_TYPES = {
  ASSETS: 'Haberes',
  LOANS: 'Prestamos',
  CREDIT: 'Creditos',
} as const;

export type GroupType = keyof typeof GROUP_TYPES;
