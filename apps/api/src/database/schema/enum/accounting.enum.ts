import { accountingSchema } from "../_schemas";

export const accountNatureEnum = accountingSchema.enum('account_nature', [
  'DEBIT',
  'CREDIT',
]);

export const accountTypeEnum = accountingSchema.enum('account_type', [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
  'MEMORANDUM',
]);

export const cycleStatusEnum = accountingSchema.enum('cycle_status', [
  'OPEN',
  'CLOSED',
  'CLOSING',
  'PENDING',
]);

export const entryStatusEnum = accountingSchema.enum(
  'accounting_entry_status',
  [
    'DRAFT', // Editable, no validado aún
    'PENDING', // Validado, pendiente de contabilizar
    'POSTED', // Contabilizado (afecta saldos)
    'CANCELLED', // Anulado
  ],
);
