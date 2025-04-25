export const GROUP_TYPES = {
  GENERAL: 'General',
  DOCUMENTS: 'Documentos',
  LOANS: 'Prestamos',
  ACCOUTING: 'Contabilidad',
  ASSOCIATES: 'Asociados',
  BAKING: 'Bancos',
  CREDIT: 'Creditos',
} as const;

export type GroupType = keyof typeof GROUP_TYPES;
