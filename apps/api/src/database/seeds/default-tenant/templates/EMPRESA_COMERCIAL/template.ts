import type { BusinessTypeTemplate } from '../template.types';
import { ACCOUNTS } from './accounts';

export const EMPRESA_COMERCIAL_TEMPLATE: BusinessTypeTemplate = {
  accounts: ACCOUNTS,
  defaultModules: [
    'ACCOUNTING',
    'INVENTORY',
    'PURCHASING',
    'BILLING',
    'BANKING',
    'TREASURY',
    'HR_PAYROLL',
    'AUDIT',
  ],

  roles: [
    { name: 'admin', description: 'Administrador con acceso de gestión', isDefault: false },
    { name: 'contador', description: 'Contador con acceso financiero', isDefault: false },
    { name: 'asistente', description: 'Asistente con acceso basico', isDefault: true },
  ],

  settings: [
    { key: 'TAX_SALES', value: '16', description: 'Porcentaje de IVA para Ventas', category: 'accounting' },
    { key: 'TAX_PURCHASES', value: '16', description: 'Porcentaje de IVA para Compras', category: 'accounting' },
    { key: 'DEFAULT_CURRENCY', value: 'Bs', description: 'Codigo de la Moneda Base del Sistema', category: 'general' },
    { key: 'ACCOUNTING_AUTO_POSTING_MASTER', value: 'true', description: 'Generar asiento contable en todos los modulos', category: 'accounting' },
    { key: 'DEFAULT_PROFIT_MARGIN', value: '30', description: 'Margen de ganancia predeterminado (%)', category: 'inventory' },
    { key: 'INVENTORY_VALUATION_METHOD', value: 'PROMEDIO', description: 'Método de valoración de inventario', category: 'inventory' },
    { key: 'BILLING_DUE_DAYS', value: '30', description: 'Días de crédito por defecto en facturación', category: 'billing' },
  ],

  moduleSettings: [
    // Inventory
    { module: 'inventory', submodule: 'products', key: 'PRODUCT_UTILITY_MARGIN', value: '25', description: 'Porcentaje de Utilidad Producto' },
    { module: 'inventory', submodule: 'products', key: 'PRODUCT_ADMIN_EXPENSE', value: '6', description: 'Gasto Administrativo Producto' },
    { module: 'inventory', submodule: 'services', key: 'DOC_SRV', value: '0', description: 'Consecutivo Código Servicio' },
    { module: 'inventory', submodule: 'fixed_assets', key: 'DOC_ACT', value: '0', description: 'Consecutivo Código Bienes o Activos' },
    { module: 'inventory', submodule: 'products', key: 'DOC_PRD', value: '0', description: 'Consecutivo SKU Producto' },
    { module: 'inventory', submodule: 'stock_entries', key: 'DOC_INV_ENT', value: '0', description: 'Consecutivo Inventario Entrada' },
    { module: 'inventory', submodule: 'stock_outputs', key: 'DOC_INV_SAL', value: '0', description: 'Consecutivo Inventario Salida' },
    { module: 'inventory', submodule: 'stock_adjustments', key: 'DOC_INV_AJU', value: '0', description: 'Consecutivo Inventario Ajuste' },
    // Purchasing
    { module: 'purchasing', submodule: 'suppliers', key: 'DOC_PROV', value: '0', description: 'Consecutivo Código Proveedor' },
    { module: 'purchasing', submodule: 'purchase_orders', key: 'DOC_ORD', value: '0', description: 'Consecutivo Orden de Compra' },
    { module: 'purchasing', submodule: 'purchase_receivings', key: 'DOC_FAC_P', value: '0', description: 'Consecutivo Recepción Factura' },
    { module: 'purchasing', submodule: 'bills', key: 'DOC_CXP', value: '0', description: 'Consecutivo Cuenta por Pagar' },
    { module: 'purchasing', submodule: 'bill_payments', key: 'DOC_PAG_P', value: '0', description: 'Consecutivo Pago a Proveedor' },
    { module: 'purchasing', submodule: 'bill_advances', key: 'DOC_ADV_P', value: '0', description: 'Consecutivo Anticipo Proveedor' },
    { module: 'purchasing', submodule: 'bill_transactions', key: 'DOC_TRS_P', value: '0', description: 'Consecutivo Transacción Proveedor' },
    { module: 'purchasing', submodule: 'credit_notes', key: 'DOC_NC_P', value: '0', description: 'Consecutivo Nota de Crédito Proveedor' },
    { module: 'purchasing', submodule: 'debit_notes', key: 'DOC_ND_P', value: '0', description: 'Consecutivo Nota de Débito Proveedor' },
    // Banking
    { module: 'banking', submodule: 'transactions', key: 'BATCH_TRANSACTION_BANK_CODE', value: '005823', description: 'Código Bancario para Transacciones en Lote' },
    { module: 'banking', submodule: 'bank_transactions', key: 'DOC_MB', value: '0', description: 'Consecutivo Movimiento Bancario' },
    // Accounting
    { module: 'accounting', submodule: 'chart_of_accounts', key: 'DOC_NRO_ASIENTO', value: '0', description: 'Consecutivo Asiento Contable' },
    // HR Payroll
    { module: 'hr_payroll', submodule: 'employees', key: 'DOC_EMP', value: '0', description: 'Consecutivo Empleado' },
    { module: 'hr_payroll', submodule: 'payroll', key: 'DOC_NOM', value: '0', description: 'Consecutivo Nómina' },
    // Billing
    { module: 'billing', submodule: 'invoices', key: 'DOC_FAC', value: '0', description: 'Consecutivo Factura de Venta' },
    { module: 'billing', submodule: 'invoices', key: 'AUTO_POST_ENTRY_BILLING', value: 'true', description: 'Generar asiento contable en facturación' },
    // Treasury
    { module: 'treasury', submodule: 'cash_management', key: 'DOC_CAJA', value: '0', description: 'Consecutivo Movimiento de Caja' },
    { module: 'treasury', submodule: 'cash_management', key: 'AUTO_POST_ENTRY_TREASURY', value: 'true', description: 'Generar asiento contable en movimientos de tesorería' },
    // Audit
    { module: 'audit', submodule: 'logs', key: 'LOG_RETENTION_DAYS', value: '365', description: 'Días de retención de logs de auditoría' },
  ],

  categories: [
    // supplier_type
    { type: 'supplier_type', code: 'nacional', name: 'Proveedor Nacional' },
    { type: 'supplier_type', code: 'internacional', name: 'Proveedor Internacional' },
    // product_category
    { type: 'product_category', code: 'bienes', name: 'Bienes' },
    { type: 'product_category', code: 'servicios', name: 'Servicios' },
    // document_type
    { type: 'document_type', code: 'factura', name: 'Factura' },
    { type: 'document_type', code: 'nota_credito', name: 'Nota de Crédito' },
    { type: 'document_type', code: 'nota_debito', name: 'Nota de Débito' },
    { type: 'document_type', code: 'orden_compra', name: 'Orden de Compra' },
    // nationality
    { type: 'nationality', code: 'V', name: 'Venezolano' },
    { type: 'nationality', code: 'E', name: 'Extranjero' },
    // gender
    { type: 'gender', code: 'M', name: 'Masculino' },
    { type: 'gender', code: 'F', name: 'Femenino' },
    // civil_status
    { type: 'civil_status', code: 'soltero', name: 'Soltero' },
    { type: 'civil_status', code: 'casado', name: 'Casado' },
    { type: 'civil_status', code: 'divorciado', name: 'Divorciado' },
    { type: 'civil_status', code: 'viudo', name: 'Viudo' },
    // account_type
    { type: 'account_type', code: 'corriente', name: 'Corriente' },
    { type: 'account_type', code: 'ahorro', name: 'Ahorro' },
  ],
};
