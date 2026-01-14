// 1. Tipos para las Categorías Principales
export type AccountingCategory =
  | 'SAVINGS_BANK'
  | 'ADMINISTRATIVE'
  | 'BANKING'
  | 'ACCOUNTING'
  | 'INVENTORY';

// 2. Tipos para las Operaciones (Desglosado por Categoría para mayor precisión)
export type SavingsOperation =
  | 'PAYROLL_CONCEPT'
  | 'WITHDRAWAL_TYPE'
  | 'LOAN_TYPE'
  | 'CREDIT_TYPE'
  | 'CREDIT_PAYMENT'
  | 'LOAN_PAYMENT'
  | 'LOAN_DISBURSEMENT'
  | 'INTEREST_ACCRUAL'
  | 'SAVINGS_UPLOAD';

export type AdministrativeOperation =
  | 'INVOICE_RECEPTION'
  | 'SUPPLIER_ADVANCE'
  | 'CREDIT_NOTE'
  | 'SUPPLIER_PAYMENT';

export type BankingOperation =
  | 'TRANSFER_BETWEEN_ACCOUNTS'
  | 'BANK_DEBIT_NOTE'
  | 'BANK_CREDIT_NOTE'
  | 'CHECK_ISSUANCE_PAYMENT'
  | 'EMPLOYER_DEPOSIT_RECEPTION'
  | 'LOAN_COLLECTION_PAYROLL'
  | 'LOAN_COLLECTION_WINDOW'
  | 'CONTRIBUTION_INCOME_PAYROLL'
  | 'BANK_INITIAL_BALANCE'
  | 'BANK_FEE'
  | 'OTHER_BANKING';

export type AccountingOperation =
  | 'FISCAL_YEAR_CLOSING'
  | 'EXCHANGE_DIFFERENCE'
  | 'ASSET_DEPRECIATION'
  | 'EXPENSE_AMORTIZATION'
  | 'MANUAL_ADJUSTMENT';

export type InventoryOperation =
  | 'GOODS_RECEIPT'
  | 'INVENTORY_ADJUSTMENT_NEG'
  | 'SALE_OUTPUT'
  | 'WAREHOUSE_TRANSFER';

// 3. Tipo Global que une todas las operaciones
export type OperationType =
  | SavingsOperation
  | AdministrativeOperation
  | BankingOperation
  | AccountingOperation
  | InventoryOperation;

// 4. Tipos para los Roles de cada Categoría

export type SavingsRole =
  | 'ASSOCIATED_ACCOUNT'
  | 'EMPLOYER_ACCOUNT'
  | 'LOAN_ACCOUNT'
  | 'CREDIT_ACCOUNT'
  | 'WITHDRAWAL_ACCOUNT'
  | 'INTEREST_EARNED'
  | 'SPECIAL_QUOTAS'
  | 'EXPENSE'
  | 'ASSOCIATED_EARNINGS'
  | 'LOAN_RECEIVABLE'
  | 'INTEREST_OVERDUE'
  | 'CASH_SAVINGS_ACCOUNT';

export type AdministrativeRole =
  | 'PURCHASE_VAT'
  | 'SUPPLIER_CONTROL'
  | 'GASTO_OPERATIVO';

export type BankingRole =
  | 'SOURCE_BANK'
  | 'DESTINATION_BANK'
  | 'GENERAL_COUNTERPART'
  | 'INITIAL_BALANCE_CAPITAL';

export type InventoryRole =
  | 'INV_ACTIVO'
  | 'INV_TRANSIT_PAYABLE'
  | 'INV_AJUSTE_GASTO'
  | 'INV_COSTO_VENTA'
  | 'INV_ORIGEN'
  | 'INV_DESTINO';

export type AccountingRole =
  | 'CONT_FISCAL_YEAR_RESULT'
  | 'CONT_CUENTA_CIERRE'
  | 'CONT_DIF_CAMBIO_GASTO'
  | 'CONT_DIF_CAMBIO_INGRESO'
  | 'CONT_FOREIGN_CURRENCY_ASSET'
  | 'CONT_ACCUMULATED_DEP'
  | 'CONT_DEP_GASTO'
  | 'CONT_AMORT_GASTO'
  | 'CONT_ACTIVO_DIFERIDO';

// 5. Tipo Global que une todos los roles posibles
export type AccountRole =
  | SavingsRole
  | AdministrativeRole
  | BankingRole
  | InventoryRole
  | AccountingRole;
