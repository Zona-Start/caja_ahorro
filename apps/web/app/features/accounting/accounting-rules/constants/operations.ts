export const categoryOptions = [
  'SAVINGS_BANK',
  'PURCHASING',
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
  /** Fixed reference value for non-dynamic operations (sent as referenceValue to the backend) */
  referenceValue?: string;
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
  PURCHASING: 'Compras',
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
      { value: 'CREDIT_PAYMENT', label: 'Pago de Crédito', group: 'SYSTEM_EVENTS', referenceValue: 'Pago Creditos' },
      { value: 'LOAN_PAYMENT', label: 'Pago de Préstamo', group: 'SYSTEM_EVENTS', referenceValue: 'Pago Prestamo' },
      { value: 'SAVINGS_UPLOAD', label: 'Carga de Haberes voluntario', group: 'SYSTEM_EVENTS', referenceValue: 'Aporte Voluntario' },
      { value: 'SAVINGS_LIQUIDATION', label: 'Liquidación de Haberes', group: 'SYSTEM_EVENTS', referenceValue: 'Liquidacion Haberes' },
    ],
    PURCHASING: [
      { value: 'INVOICE_RECEPTION', label: 'Recepción de Factura', group: 'SYSTEM_EVENTS', referenceValue: 'Facturas' },
      { value: 'SUPPLIER_ADVANCE', label: 'Anticipo a Proveedor', group: 'SYSTEM_EVENTS', referenceValue: 'Anticipo' },
      { value: 'CREDIT_NOTE', label: 'Nota de Crédito', group: 'SYSTEM_EVENTS', referenceValue: 'NC' },
      { value: 'DEBIT_NOTE', label: 'Nota de Débito', group: 'SYSTEM_EVENTS', referenceValue: 'ND' },
      { value: 'SUPPLIER_PAYMENT', label: 'Pago a Proveedor', group: 'SYSTEM_EVENTS', referenceValue: 'Pago Proveedor' },
    ],
    INVENTORY: [
      { value: 'INVENTORY_ADJUSTMENT_NEG', label: 'Ajuste de Inventario (-)', group: 'SYSTEM_EVENTS', referenceValue: 'Ajuste Inv' },
      { value: 'SALE_OUTPUT', label: 'Salida por Venta', group: 'SYSTEM_EVENTS', referenceValue: 'Salida Inventario' },
    ],
  },
  TREASURY_FLOWS: {
    BANKING: [
      { value: 'TRANSFER_BETWEEN_ACCOUNTS', label: 'Transferencia entre Cuentas', group: 'TREASURY_FLOWS', referenceValue: 'Trans Cuentas' },
      { value: 'BANK_DEBIT_NOTE', label: 'Nota de Débito Bancaria', group: 'TREASURY_FLOWS', referenceValue: 'NDB' },
      { value: 'BANK_CREDIT_NOTE', label: 'Nota de Crédito Bancaria', group: 'TREASURY_FLOWS', referenceValue: 'NCB' },
      { value: 'CHECK_ISSUANCE_PAYMENT', label: 'Emisión de Cheque / Pago', group: 'TREASURY_FLOWS', referenceValue: 'Pagos Bancarios' },
      { value: 'BANK_INITIAL_BALANCE', label: 'Carga de Saldo Inicial', group: 'TREASURY_FLOWS', referenceValue: 'Carga Saldo Banco' },
      { value: 'BANK_FEE', label: 'Comisión por Cuenta', group: 'TREASURY_FLOWS', referenceValue: 'Comision Cuenta Banco' },
      { value: 'OTHER_BANKING', label: 'Otros', group: 'TREASURY_FLOWS', referenceValue: 'Otros Banco' },
    ],
  },
};

export const operationsByCategory: Record<Category, OperationDef[]> = (() => {
  const result: Record<Category, OperationDef[]> = {
    SAVINGS_BANK: [],
    PURCHASING: [],
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
    { value: 'LOAN_PAYMENT', label: 'Pago / Abono a Préstamo' },
    { value: 'CREDIT_PAYMENT', label: 'Pago / Abono a Crédito' },
    { value: 'LOAN_WITHHOLDING', label: 'Retención de Préstamo' },
  ],
  PURCHASING: [
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
