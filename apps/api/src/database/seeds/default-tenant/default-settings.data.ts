// src/database/seeds/data/default-settings.data.ts

export const DEFAULT_TENANT_SETTINGS = [
  {
    key: 'TAX_SALES',
    value: '16',
    description: 'Porcentaje de IVA para Ventas',
    category: 'accounting',
  },
  {
    key: 'TAX_PURCHASES',
    value: '16',
    description: 'Porcentaje de IVA para Compras',
    category: 'accounting',
  },
  {
    key: 'DEFAULT_CURRENCY',
    value: 'Bs',
    description: 'Codigo de la Moneda Base del Sistema',
    category: 'general',
  },
  {
    key: 'ACCOUNTING_AUTO_POSTING_MASTER',
    value: 'true',
    description: 'Generar asiento contable en todos los modulos',
    category: 'accounting',
  },
];

export const DEFAULT_MODULE_SETTINGS = [
  // === REGLAS DE NEGOCIO POR MÓDULO ===
  // Módulo: Caja de Ahorro (Savings)
  {
    module: 'savings',
    submodule: 'withdrawals',
    key: 'WITHDRAWAL_TIME_MONTHS',
    value: '4',
    description: 'Tiempo de Retiro en Meses',
  },
  {
    module: 'savings',
    submodule: 'withdrawals',
    key: 'AUTO_POST_ENTRY_WITHDRAWAL',
    value: 'true',
    description: 'Generar asiento contable en retiro',
  },
  {
    module: 'savings',
    submodule: 'contributions',
    key: 'DEFAULT_PAYROLL_TYPE',
    value: '5501',
    description: 'Tipo de Nómina por defecto',
  },
  {
    module: 'savings',
    submodule: 'contributions',
    key: 'AUTO_POST_ENTRY_CONTRIBUTION',
    value: 'true',
    description: 'Generar asiento contable en carga haberes',
  },
  {
    module: 'savings',
    submodule: 'contributions',
    key: 'DEFAULT_DISCOUNT_FREQUENCY',
    value: 'Mensual',
    description: 'Frecuencia de Descuento por defecto',
  },
  {
    module: 'savings',
    submodule: 'liquidations',
    key: 'AUTO_POST_ENTRY_LIQUIDATIONS',
    value: 'true',
    description: 'Generar asiento contable en liquidaciones',
  },

  // Módulo: Cartera / Préstamos (Portfolio)
  {
    module: 'portfolio',
    submodule: 'loans',
    key: 'DEFAULT_LOAN_INTEREST',
    value: '6',
    description: 'Porcentaje de Préstamo por defecto',
  },
  {
    module: 'portfolio',
    submodule: 'loans',
    key: 'AUTO_POST_ENTRY_LOAN',
    value: 'true',
    description: 'Generar asiento contable en préstamo',
  },
  {
    module: 'portfolio',
    submodule: 'credits',
    key: 'AUTO_POST_ENTRY_CREDIT',
    value: 'true',
    description: 'Generar asiento contable en crédito',
  },
  {
    module: 'portfolio',
    submodule: 'credits',
    key: 'AUTO_POST_ENTRY_CREDIT_PAYMENT',
    value: 'true',
    description: 'Generar asiento contable en pago de crédito',
  },
  {
    module: 'portfolio',
    submodule: 'loans',
    key: 'AUTO_POST_ENTRY_LOAN_PAYMENT',
    value: 'true',
    description: 'Generar asiento contable en pago de préstamo',
  },

  // Módulo: Inventario (Inventory)
  {
    module: 'inventory',
    submodule: 'products',
    key: 'PRODUCT_UTILITY_MARGIN',
    value: '25',
    description: 'Porcentaje de Utilidad Producto',
  },
  {
    module: 'inventory',
    submodule: 'products',
    key: 'PRODUCT_ADMIN_EXPENSE',
    value: '6',
    description: 'Gasto Administrativo Producto',
  },

  // Módulo: Contabilidad y Bancos (Accounting / Banking)
  {
    module: 'banking',
    submodule: 'transactions',
    key: 'BATCH_TRANSACTION_BANK_CODE',
    value: '005823',
    description: 'Código Bancario para Transacciones en Lote',
  },

  // === CONSECUTIVOS DE DOCUMENTOS (Counters) ===
  // Nota: Todos inicializan en "0" para un tenant nuevo.

  // Savings (Caja Ahorro)
  {
    module: 'savings',
    submodule: 'members',
    key: 'DOC_SOC',
    value: '0',
    description: 'Consecutivo Referencia Asociado',
  },
  {
    module: 'savings',
    submodule: 'liquidation',
    key: 'DOC_RH_LIQ',
    value: '0',
    description: 'Consecutivo Liquidación Movimiento Haberes',
  },
  {
    module: 'savings',
    submodule: 'withdrawals',
    key: 'DOC_RH_RET',
    value: '0',
    description: 'Consecutivo Retiro Movimiento Haberes',
  },
  {
    module: 'savings',
    submodule: 'contributions',
    key: 'DOC_MS',
    value: '0',
    description: 'Consecutivo Movimiento Asociados',
  },

  // Portfolio (Préstamos y Créditos)
  {
    module: 'portfolio',
    submodule: 'loans',
    key: 'DOC_PRE',
    value: '0',
    description: 'Consecutivo Préstamo',
  },
  {
    module: 'portfolio',
    submodule: 'loan_payments',
    key: 'DOC_PRE_PAG',
    value: '0',
    description: 'Consecutivo Pago de Préstamo',
  },
  {
    module: 'portfolio',
    submodule: 'credits',
    key: 'DOC_CRE',
    value: '0',
    description: 'Consecutivo Crédito',
  },
  {
    module: 'portfolio',
    submodule: 'credit_payments',
    key: 'DOC_CRE_PAG',
    value: '0',
    description: 'Consecutivo Pago Crédito',
  },
  {
    module: 'portfolio',
    submodule: 'loan_disbursements',
    key: 'DOC_LOT_P',
    value: '0',
    description: 'Consecutivo Lote Desembolsos',
  },

  // Inventory (Inventario)
  {
    module: 'inventory',
    submodule: 'services',
    key: 'DOC_SRV',
    value: '0',
    description: 'Consecutivo Código Servicio',
  },
  {
    module: 'inventory',
    submodule: 'fixed_assets',
    key: 'DOC_ACT',
    value: '0',
    description: 'Consecutivo Código Bienes o Activos',
  },
  {
    module: 'inventory',
    submodule: 'products',
    key: 'DOC_PRD',
    value: '0',
    description: 'Consecutivo SKU Producto',
  },
  {
    module: 'inventory',
    submodule: 'stock_entries',
    key: 'DOC_INV_ENT',
    value: '0',
    description: 'Consecutivo Inventario Entrada',
  },
  {
    module: 'inventory',
    submodule: 'stock_outputs',
    key: 'DOC_INV_SAL',
    value: '0',
    description: 'Consecutivo Inventario Salida',
  },
  {
    module: 'inventory',
    submodule: 'stock_adjustments',
    key: 'DOC_INV_AJU',
    value: '0',
    description: 'Consecutivo Inventario Ajuste',
  },

  // Purchasing (Compras y Cuentas por Pagar)
  {
    module: 'purchasing',
    submodule: 'suppliers',
    key: 'DOC_PROV',
    value: '0',
    description: 'Consecutivo Código Proveedor',
  },
  {
    module: 'purchasing',
    submodule: 'purchase_orders',
    key: 'DOC_ORD',
    value: '0',
    description: 'Consecutivo Orden de Compra',
  },
  {
    module: 'purchasing',
    submodule: 'purchase_receivings',
    key: 'DOC_FAC_P',
    value: '0',
    description: 'Consecutivo Recepción Factura',
  },
  {
    module: 'purchasing',
    submodule: 'bills',
    key: 'DOC_CXP',
    value: '0',
    description: 'Consecutivo Cuenta por Pagar',
  },
  {
    module: 'purchasing',
    submodule: 'bill_payments',
    key: 'DOC_PAG_P',
    value: '0',
    description: 'Consecutivo Pago a Proveedor',
  },
  {
    module: 'purchasing',
    submodule: 'bill_advances',
    key: 'DOC_ADV_P',
    value: '0',
    description: 'Consecutivo Anticipo Proveedor',
  },
  {
    module: 'purchasing',
    submodule: 'bill_transactions',
    key: 'DOC_TRS_P',
    value: '0',
    description: 'Consecutivo Transacción Proveedor',
  },
  {
    module: 'purchasing',
    submodule: 'credit_notes',
    key: 'DOC_NC_P',
    value: '0',
    description: 'Consecutivo Nota de Crédito Proveedor',
  },
  {
    module: 'purchasing',
    submodule: 'debit_notes',
    key: 'DOC_ND_P',
    value: '0',
    description: 'Consecutivo Nota de Débito Proveedor',
  },

  // Accounting & Banking (Contabilidad y Bancos)
  {
    module: 'accounting',
    submodule: 'chart_of_accounts',
    key: 'DOC_NRO_ASIENTO',
    value: '0',
    description: 'Consecutivo Asiento Contable',
  },
  {
    module: 'banking',
    submodule: 'bank_transactions',
    key: 'DOC_MB',
    value: '0',
    description: 'Consecutivo Movimiento Bancario',
  },
];
