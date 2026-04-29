export const MOVEMENT_TYPES = {
  IN: 'Entrada',
  OUT: 'Salida',
  ADJUST_IN: 'Ajuste Entrada',
  ADJUST_OUT: 'Ajuste Salida',
} as const;

export type MovementType = keyof typeof MOVEMENT_TYPES;
