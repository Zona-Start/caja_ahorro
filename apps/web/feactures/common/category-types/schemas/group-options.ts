export const GROUP_TYPES = {
  TIPOS_ASOCIADOS: 'TIPOS_ASOCIADOS',
  TIPO_FRECUENCIA: 'FRECUENCIA_NOMINA',
} as const;

export type AccountType = keyof typeof GROUP_TYPES;
