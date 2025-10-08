export const PAYMENT_METHOD = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia bancaria',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  OTHER: 'Otro método',
  MOBILE_PAYMENT: 'Pago móvil',
} as const;

export const BANK_TRANSACTION_CATEGORY = {
  // Transacciones con Asociados y Ahorros
  MEMBER_CONTRIBUTION: 'Aportes y Carga de Haberes', // Reemplaza MEMBER_DUES
  MEMBER_WITHDRAWAL: 'Retiro Parcial de Haberes', // Retiro parcial
  PAYROLL_SETTLEMENT: 'Liquidación Final de Haberes', // Liquidación total

  // Transacciones de Cartera (Préstamos y Créditos)
  LOAN_DISBURSEMENT: 'Desembolso de Préstamo', // Salida de dinero por préstamo
  LOAN_PAYMENT: 'Pago de Cuota de Préstamo', // Entrada de dinero por pago de préstamo
  CREDIT_DISBURSEMENT: 'Desembolso de Crédito', // Salida de dinero por crédito
  CREDIT_PAYMENT: 'Pago de Cuota de Crédito', // Entrada de dinero por pago de crédito
  BATCH_DISBURSEMENT: 'Desembolso por Lote', // Desembolso masivo (lote) de retiros, préstamos, créditos, anticipos, etc.

  // Transacciones Operativas y de Proveedores
  SUPPLIER_PAYMENT: 'Pago a Proveedores (Factura)', // Reemplaza ADMINISTRATIVE_EXPENSES específico
  SUPPLIER_ADVANCE_PAYMENT: 'Anticipo a Proveedores', // Nuevo: distingue pagos de anticipos

  // Transacciones Bancarias y Ajustes
  BANK_FEE: 'Comisiones Bancarias',
  INTEREST_EARNED: 'Intereses Ganados (Banco)', // Ingreso
  INTEREST_CHARGED: 'Cargos por Intereses (Banco)', // Gasto
  TAX_DEBIT: 'Débito por Impuestos/Retenciones', // Salida por concepto fiscal
  TAX_CREDIT: 'Crédito por Impuestos/Devolución', // Entrada por concepto fiscal
  BANK_ADJUSTMENT: 'Ajuste Bancario Especial', // Ajustes por redondeo, apertura, etc.

  // Movimientos Generales y de Respaldo
  INTERNAL_TRANSFER: 'Transferencia Entre Cuentas Propias', // Entre cuentas de la caja
  OTHER_INCOME: 'Otros Ingresos No Clasificados',
  OTHER_EXPENSE: 'Otros Egresos No Clasificados',

  // *Opcional: Si aún necesitas categorías para reportes de saldo inicial/final, mantenlas*
  OPENING_BANK: 'Apertura de Banco',
  CLOSING_BANK: 'Cierre de Banco',
} as const;

export const INTERNAL_LINK_STATUS = {
  LINKED: 'Vinculado',
  UNLINKED: 'No Vinculado',
  PARTIALLY_LINKED: 'Parcialmente Vinculado',
  NOT_APPLICABLE: 'No Aplica',
} as const;

export const RECONCILIATION_ITEM_STATUS = {
  // --- Estados Principales ---
  PENDING: 'Pendiente de Conciliación', // Esperando ser conciliado o vinculado
  RECONCILED: 'Conciliado', // Vinculado mediante reglas automáticas
  MANUAL_MATCH: 'Conciliado Manualmente', // Vinculado por un usuario (la acción de desvincular lo regresa a PENDING)

  // --- Estados de Manejo y Exclusión ---
  ADJUSTMENT: 'Ajuste Contable', // Marcado como ajuste directo a cuentas (ej. comisiones bancarias)
  EXCLUDED: 'Excluido del Proceso', // Ítem que no requiere conciliación o fue descartado intencionalmente

  // --- Estados de Error o Mantenimiento ---
  NON_EXISTENT_IN_BANK: 'No Existe en el Extracto Bancario', // Usado para transacciones internas que no se ven en el banco
  VOIDED: 'Anulado/Cancelado', // Transacción que fue anulada en el sistema (no debe conciliarse)
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHOD;
export type BankTransactionCategory = keyof typeof BANK_TRANSACTION_CATEGORY;
export type InternalLinkStatus = keyof typeof INTERNAL_LINK_STATUS;
export type ReconciliationItemStatus = keyof typeof RECONCILIATION_ITEM_STATUS;

export const paymentMethodKeys = Object.keys(PAYMENT_METHOD) as [
  keyof typeof PAYMENT_METHOD,
  ...Array<keyof typeof PAYMENT_METHOD>,
];
export const categoryKeys = Object.keys(BANK_TRANSACTION_CATEGORY) as [
  keyof typeof BANK_TRANSACTION_CATEGORY,
  ...Array<keyof typeof BANK_TRANSACTION_CATEGORY>,
];
export const reconciliationStatusKeys = Object.keys(
  RECONCILIATION_ITEM_STATUS,
) as [
  keyof typeof RECONCILIATION_ITEM_STATUS,
  ...Array<keyof typeof RECONCILIATION_ITEM_STATUS>,
];
export const internalLinkStatusKeys = Object.keys(INTERNAL_LINK_STATUS) as [
  keyof typeof INTERNAL_LINK_STATUS,
  ...Array<keyof typeof INTERNAL_LINK_STATUS>,
];
