export const categoryOptions = [
  'SAVINGS_BANK',
  'ADMINISTRATIVE',
  'BANKING',
  'ACCOUNTING',
  'INVENTORY',
] as const;

export type Category = (typeof categoryOptions)[number];

export type OperationGroup = 'OPERATIVE_MODELS' | 'SYSTEM_EVENTS' | 'TREASURY_FLOWS';

export interface OperationDef {
  value: string;
  label: string;
  isDynamic?: boolean;
  group: OperationGroup;
}

export interface RoleDef {
  value: string;
  label: string;
}

export const groupLabels: Record<OperationGroup, string> = {
  OPERATIVE_MODELS: 'Modelos Operativos',
  SYSTEM_EVENTS: 'Eventos del Sistema',
  TREASURY_FLOWS: 'Flujos de Tesorería',
};

export const categoryTranslations: Record<Category, string> = {
  SAVINGS_BANK: 'Caja de Ahorro',
  ADMINISTRATIVE: 'Administrativa',
  BANKING: 'Bancaria',
  ACCOUNTING: 'Contable',
  INVENTORY: 'Inventario',
};

export const operationsByGroup: Record<
  OperationGroup,
  Partial<Record<Category, OperationDef[]>>
> = {
  OPERATIVE_MODELS: {
    SAVINGS_BANK: [
      { value: 'PAYROLL_CONCEPT', label: 'Concepto Nómina', isDynamic: true, group: 'OPERATIVE_MODELS' },
      { value: 'WITHDRAWAL_TYPE', label: 'Tipo de Retiro', isDynamic: true, group: 'OPERATIVE_MODELS' },
      { value: 'LOAN_TYPE', label: 'Tipo de Préstamo', isDynamic: true, group: 'OPERATIVE_MODELS' },
      { value: 'CREDIT_TYPE', label: 'Tipo de Crédito', isDynamic: true, group: 'OPERATIVE_MODELS' },
    ],
  },
  SYSTEM_EVENTS: {
    SAVINGS_BANK: [
      { value: 'CREDIT_PAYMENT', label: 'Pago de Crédito', group: 'SYSTEM_EVENTS' },
      { value: 'CREDIT_PAYMENT', label: 'Pago de Crédito', group: 'SYSTEM_EVENTS' },
      { value: 'LOAN_PAYMENT', label: 'Pago de Préstamo', group: 'SYSTEM_EVENTS' },
      { value: 'LOAN_DISBURSEMENT', label: 'Desembolso Préstamo', group: 'SYSTEM_EVENTS' },
      { value: 'INTEREST_ACCRUAL', label: 'Causación de Intereses', group: 'SYSTEM_EVENTS' },
      { value: 'SAVINGS_UPLOAD', label: 'Carga de Haberes', group: 'SYSTEM_EVENTS' },
    ],
    ADMINISTRATIVE: [
      { value: 'INVOICE_RECEPTION', label: 'Recepción de Factura', group: 'SYSTEM_EVENTS' },
      { value: 'SUPPLIER_ADVANCE', label: 'Anticipo a Proveedor', group: 'SYSTEM_EVENTS' },
      { value: 'CREDIT_NOTE', label: 'Nota de Crédito', group: 'SYSTEM_EVENTS' },
      { value: 'SUPPLIER_PAYMENT', label: 'Pago a Proveedor', group: 'SYSTEM_EVENTS' },
    ],
    BANKING: [
      { value: 'EMPLOYER_DEPOSIT_RECEPTION', label: 'Recepción Depósito Patronal', group: 'SYSTEM_EVENTS' },
      { value: 'LOAN_COLLECTION_PAYROLL', label: 'Recaudación Préstamos (Nómina)', group: 'SYSTEM_EVENTS' },
      { value: 'LOAN_COLLECTION_WINDOW', label: 'Cobro de Préstamo (Ventanilla)', group: 'SYSTEM_EVENTS' },
      { value: 'CONTRIBUTION_INCOME_PAYROLL', label: 'Ingreso por Aportes (Nómina)', group: 'SYSTEM_EVENTS' },
    ],
    ACCOUNTING: [
      { value: 'FISCAL_YEAR_CLOSING', label: 'Cierre de Ejercicio (Anual)', group: 'SYSTEM_EVENTS' },
      { value: 'EXCHANGE_DIFFERENCE', label: 'Diferencia de Cambio', group: 'SYSTEM_EVENTS' },
      { value: 'ASSET_DEPRECIATION', label: 'Depreciación de Activos', group: 'SYSTEM_EVENTS' },
      { value: 'EXPENSE_AMORTIZATION', label: 'Amortización de Gastos', group: 'SYSTEM_EVENTS' },
      { value: 'MANUAL_ADJUSTMENT', label: 'Ajuste Manual', group: 'SYSTEM_EVENTS' },
    ],
    INVENTORY: [
      { value: 'GOODS_RECEIPT', label: 'Recepción de Mercancía', group: 'SYSTEM_EVENTS' },
      { value: 'INVENTORY_ADJUSTMENT_NEG', label: 'Ajuste de Inventario (-)', group: 'SYSTEM_EVENTS' },
      { value: 'SALE_OUTPUT', label: 'Salida por Venta', group: 'SYSTEM_EVENTS' },
      { value: 'WAREHOUSE_TRANSFER', label: 'Transferencia entre Almacenes', group: 'SYSTEM_EVENTS' },
    ],
  },
  TREASURY_FLOWS: {
    BANKING: [
      { value: 'TRANSFER_BETWEEN_ACCOUNTS', label: 'Transferencia entre Cuentas', group: 'TREASURY_FLOWS' },
      { value: 'BANK_DEBIT_NOTE', label: 'Nota de Débito Bancaria', group: 'TREASURY_FLOWS' },
      { value: 'BANK_CREDIT_NOTE', label: 'Nota de Crédito Bancaria', group: 'TREASURY_FLOWS' },
      { value: 'CHECK_ISSUANCE_PAYMENT', label: 'Emisión de Cheque / Pago', group: 'TREASURY_FLOWS' },
      { value: 'BANK_INITIAL_BALANCE', label: 'Carga de Saldo Inicial', group: 'TREASURY_FLOWS' },
      { value: 'BANK_FEE', label: 'Comisión por Cuenta', group: 'TREASURY_FLOWS' },
      { value: 'OTHER_BANKING', label: 'Otros', group: 'TREASURY_FLOWS' },
    ],
  },
};

export const operationsByCategory: Record<Category, OperationDef[]> = (() => {
  const result: Record<Category, OperationDef[]> = {
    SAVINGS_BANK: [],
    ADMINISTRATIVE: [],
    BANKING: [],
    ACCOUNTING: [],
    INVENTORY: [],
  };
  for (const group of Object.values(operationsByGroup)) {
    for (const [catKey, ops] of Object.entries(group)) {
      const cat = catKey as Category;
      if (result[cat] && ops) {
        result[cat].push(...ops);
      }
    }
  }
  return result;
})();

export const operationTypeTranslations: Record<string, string> = Object.fromEntries(
  Object.values(operationsByCategory)
    .flat()
    .map((op) => [op.value, op.label]),
);

export function getOperationDef(operationType: string): OperationDef | undefined {
  for (const catOps of Object.values(operationsByCategory)) {
    const found = catOps.find((op) => op.value === operationType);
    if (found) return found;
  }
  return undefined;
}

export const roleOptionsByCategory: Record<Category, RoleDef[]> = {
  SAVINGS_BANK: [
    { value: 'ASSOCIATED_SAVINGS', label: 'Ahorro Asociados (Haberes)' },
    { value: 'EMPLOYER_CONTRIBUTION', label: 'Aporte Patrono (Haberes)' },
    { value: 'VOLUNTARY_SAVINGS', label: 'Ahorro Voluntario (Haberes)' },
    { value: 'PARTIAL_WITHDRAWAL_SAVINGS', label: 'Retiro Parcial (Haberes)' },
    { value: 'SPECIAL_WITHDRAWAL_SAVINGS', label: 'Retiro Especial / Consumo (Haberes)' },
    { value: 'DIVIDENDS_PAYABLE', label: 'Dividendos / Excedentes por Pagar' },
    { value: 'SAVINGS_RECEIVABLE', label: 'Ahorro x Cobrar (Activo)' },
    { value: 'EMPLOYER_RECEIVABLE', label: 'Aporte x Cobrar (Activo)' },
    { value: 'LOAN_PRINCIPAL', label: 'Préstamo Capital (Activo)' },
    { value: 'CREDIT_PRINCIPAL', label: 'Crédito Capital (CP/LP)' },
    { value: 'OPERATION_COUNTERPART', label: 'Inventario / Cuenta x Pagar' },
    { value: 'BANK_ACCOUNT', label: 'Banco Institución' },
    { value: 'CASH_ACCOUNT', label: 'Caja Principal' },
    { value: 'SERVICE_FEE_INCOME', label: 'Ingresos por Comisiones' },
    { value: 'LOAN_INTEREST_INCOME', label: 'Ingresos por Intereses' },
  ],
  ADMINISTRATIVE: [
    { value: 'PURCHASE_VAT', label: 'Iva Compra' },
    { value: 'SUPPLIER_CONTROL', label: 'Proveedor Control' },
    { value: 'GASTO_OPERATIVO', label: 'Gasto Operativo' },
  ],
  BANKING: [
    { value: 'SOURCE_BANK', label: 'Banco Origen' },
    { value: 'DESTINATION_BANK', label: 'Banco Destino' },
    { value: 'GENERAL_COUNTERPART', label: 'Contra Partida General' },
  ],
  INVENTORY: [
    { value: 'INV_ACTIVO', label: 'Activo' },
    { value: 'INV_COSTO_VENTA', label: 'Costo Venta' },
  ],
  ACCOUNTING: [
    { value: 'CONT_FISCAL_YEAR_RESULT', label: 'Resultado Ejercicio' },
    { value: 'CONT_CUENTA_CIERRE', label: 'Cuenta Cierre' },
  ],
};
