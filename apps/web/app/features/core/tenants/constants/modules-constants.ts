export const MODULE_CODES = [
  'ACCOUNTING',
  'LOANS',
  'CREDITS',
  'SAVINGS',
  'INVENTORY',
  'PURCHASING',
  'BILLING',
  'BANKING',
  'TREASURY',
  'HR_PAYROLL',
  'AUDIT',
] as const;

export type ModuleCode = (typeof MODULE_CODES)[number];

export const MODULE_LABELS: Record<ModuleCode, string> = {
  ACCOUNTING: 'Contabilidad',
  LOANS: 'Préstamos',
  CREDITS: 'Créditos',
  SAVINGS: 'Caja de Ahorro',
  INVENTORY: 'Inventario',
  PURCHASING: 'Compras',
  BILLING: 'Facturación',
  BANKING: 'Banca',
  TREASURY: 'Tesorería',
  HR_PAYROLL: 'RRHH / Nómina',
  AUDIT: 'Auditoría',
};
