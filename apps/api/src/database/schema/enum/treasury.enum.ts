import { treasurySchema } from "../_schemas";

export const bankTransactionCategory = treasurySchema.enum(
  'bank_transaction_category',
  [
    'MEMBER_CONTRIBUTION', // aportes / carga haberes
    'MEMBER_WITHDRAWAL', // retiro parcial
    'PAYROLL_SETTLEMENT', // liquidación final
    'LOAN_DISBURSEMENT',
    'LOAN_PAYMENT',
    'CREDIT_DISBURSEMENT',
    'CREDIT_PAYMENT',
    'BATCH_DISBURSEMENT',
    'SUPPLIER_PAYMENT',
    'SUPPLIER_ADVANCE_PAYMENT',
    'INTERNAL_TRANSFER',
    'BANK_FEE',
    'INTEREST_EARNED',
    'INTEREST_CHARGED',
    'BANK_ADJUSTMENT',
    'TAX_DEBIT',
    'TAX_CREDIT',
    'OTHER_INCOME',
    'OTHER_EXPENSE',
    'OPENING_BANK',
    'CLOSING_BANK',
  ],
);
export const internalLinkStatusEnum = treasurySchema.enum(
  'internal_link_status',
  ['LINKED', 'UNLINKED', 'PARTIALLY_LINKED', 'NOT_APPLICABLE'],
);
export const reconciliationStatusEnum = treasurySchema.enum(
  'reconciliation_status',
  ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED'],
);
export const reconciliationItemStatusEnum = treasurySchema.enum(
  'reconciliation_item_status',
  [
    'PENDING',
    'RECONCILED',
    'MANUAL_MATCH',
    'ADJUSTMENT',
    'EXCLUDED',
    'NON_EXISTENT_IN_BANK',
    'VOIDED',
  ],
);
