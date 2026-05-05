export const ENTRY_STATUS = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  POSTED: 'Contabilizado',
  CANCELLED: 'Anulado',
} as const;

export type EntryStatus = keyof typeof ENTRY_STATUS;

export enum EntryStatusEnum {
  DRAFT = 'Borrador',
  PENDING = 'Pendiente',
  POSTED = 'Contabilizado',
  CANCELLED = 'Anulado',
}
