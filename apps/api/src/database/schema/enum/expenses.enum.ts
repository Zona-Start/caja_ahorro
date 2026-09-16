import { treasurySchema } from '../_schemas';

export const cashSessionStatusEnum = treasurySchema.enum(
  'cash_session_status',
  ['OPEN', 'CLOSED'],
);

export const cashMovementTypeEnum = treasurySchema.enum('cash_movement_type', [
  'INFLOW',
  'OUTFLOW',
]);

export const cashMovementReferenceTypeEnum = treasurySchema.enum(
  'cash_movement_reference_type',
  [
    'EXPENSE',
    'SALE',
    'MANUAL_ADJUSTMENT',
    'PETTY_CASH_REPLENISHMENT',
    'PETTY_CASH_DISBURSEMENT',
    'CASH_OPENING',
    'CASH_CLOSING',
  ],
);

export const expenseTypeEnum = treasurySchema.enum('expense_type', [
  'EXPRESS',
  'FORMAL_INVOICE',
]);

export const expensePaymentStatusEnum = treasurySchema.enum(
  'expense_payment_status',
  ['PAID', 'PENDING'],
);

export const expensePaymentSourceEnum = treasurySchema.enum(
  'expense_payment_source',
  ['CASH_REGISTER', 'BANK_ACCOUNT', 'PETTY_CASH'],
);

export const expenseStatusEnum = treasurySchema.enum('expense_status', [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'PAID',
  'REJECTED',
]);

// Naturaleza del gasto: fijo (recurrente/programado) o variable (transaccional)
export const expenseNatureEnum = treasurySchema.enum('expense_nature', [
  'FIXED',
  'VARIABLE',
]);

export const pettyCashVoucherStatusEnum = treasurySchema.enum(
  'petty_cash_voucher_status',
  ['OPEN', 'LIQUIDATED', 'SETTLED'],
);

export const pettyCashSettlementStatusEnum = treasurySchema.enum(
  'petty_cash_settlement_status',
  ['OPEN', 'CLOSED'],
);

export const pettyCashReplenishmentStatusEnum = treasurySchema.enum(
  'petty_cash_replenishment_status',
  ['NONE', 'PENDING', 'PAID'],
);

export const expenseReportStatusEnum = treasurySchema.enum(
  'expense_report_status',
  ['PENDING', 'APPROVED', 'REJECTED', 'PAID'],
);

export const recurringFrequencyEnum = treasurySchema.enum(
  'recurring_frequency',
  ['MONTHLY', 'BIWEEKLY', 'QUARTERLY', 'ANNUAL'],
);
