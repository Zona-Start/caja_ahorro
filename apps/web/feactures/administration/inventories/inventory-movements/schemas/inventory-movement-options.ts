export const MOVEMENT_TYPES = {
  IN: 'ENTRADA',
  OUT: 'SALIDA',
  ADJUSTMENT: 'AJUSTE',
} as const;

export type MovementType = keyof typeof MOVEMENT_TYPES;
