import type { BusinessTypeTemplate } from '../template.types';
import { ACCOUNTS } from './accounts';

export const CAJA_AHORRO_TEMPLATE: BusinessTypeTemplate = {
  accounts: ACCOUNTS,
  defaultModules: [
    'ACCOUNTING',
    'SAVINGS',
    'LOANS',
    'CREDITS',
    'BANKING',
    'TREASURY',
    'AUDIT',
    'INVENTORY',
    'PURCHASING',
    'BILLING',
    'HR_PAYROLL'
  ],

  roles: [
    { name: 'admin', description: 'Administrador con acceso de gestión', isDefault: false },
    { name: 'ejecutivo', description: 'Ejecutivo con acceso de alto nivel', isDefault: false },
    { name: 'contador', description: 'Contador con acceso financiero', isDefault: false },
    { name: 'asistente', description: 'Asistente con acceso basico', isDefault: true },
  ],

  settings: [
    { key: 'TAX_SALES', value: '16', description: 'Porcentaje de IVA para Ventas', category: 'accounting' },
    { key: 'TAX_PURCHASES', value: '16', description: 'Porcentaje de IVA para Compras', category: 'accounting' },
    { key: 'DEFAULT_CURRENCY', value: 'VES', description: 'Codigo de la Moneda Base del Sistema', category: 'general' },
    { key: 'ACCOUNTING_AUTO_POSTING_MASTER', value: 'true', description: 'Generar asiento contable en todos los modulos', category: 'accounting' },
    { key: 'INTEREST_RATE_SAVINGS', value: '0.5', description: 'Tasa de interés anual para ahorros (%)', category: 'savings' },
    { key: 'MAX_WITHDRAWAL_PERCENTAGE', value: '80', description: 'Porcentaje máximo de retiro sobre saldo', category: 'savings' },
    { key: 'MIN_CONTRIBUTION_AMOUNT', value: '1', description: 'Monto mínimo de aporte', category: 'savings' },
  ],

  moduleSettings: [
    // Savings
    { module: 'savings', submodule: 'withdrawals', key: 'WITHDRAWAL_TIME_MONTHS', value: '4', description: 'Tiempo de Retiro en Meses' },
    { module: 'savings', submodule: 'withdrawals', key: 'AUTO_POST_ENTRY_WITHDRAWAL', value: 'true', description: 'Generar asiento contable en retiro' },
    { module: 'savings', submodule: 'contributions', key: 'DEFAULT_PAYROLL_TYPE', value: '5501', description: 'Tipo de Nómina por defecto' },
    { module: 'savings', submodule: 'contributions', key: 'AUTO_POST_ENTRY_CONTRIBUTION', value: 'true', description: 'Generar asiento contable en carga haberes' },
    { module: 'savings', submodule: 'contributions', key: 'DEFAULT_DISCOUNT_FREQUENCY', value: 'Mensual', description: 'Frecuencia de Descuento por defecto' },
    { module: 'savings', submodule: 'liquidations', key: 'AUTO_POST_ENTRY_LIQUIDATIONS', value: 'true', description: 'Generar asiento contable en liquidaciones' },
    { module: 'savings', submodule: 'members', key: 'SOC', value: '0', description: 'Consecutivo Referencia Asociado' },
    { module: 'savings', submodule: 'liquidation', key: 'SOC_LIQ', value: '0', description: 'Consecutivo Liquidación Movimiento Haberes' },
    { module: 'savings', submodule: 'withdrawals', key: 'SOC_RET', value: '0', description: 'Consecutivo Retiro Movimiento Haberes' },
    { module: 'savings', submodule: 'contributions', key: 'SOC_MS', value: '0', description: 'Consecutivo Movimiento Asociados' },
    { module: 'savings', submodule: 'contributions', key: 'DES_SOC', value: '0', description: 'Consecutivo Desembolsos Socios' },
    { module: 'savings', submodule: 'contributions', key: 'DES_LOT_SOC', value: '0', description: 'Consecutivo Lote Desembolsos Socios' },

    // Portfolio
    { module: 'portfolio', submodule: 'loans', key: 'DEFAULT_LOAN_INTEREST', value: '6', description: 'Porcentaje de Préstamo por defecto' },
    { module: 'portfolio', submodule: 'loans', key: 'AUTO_POST_ENTRY_LOAN', value: 'true', description: 'Generar asiento contable en préstamo' },
    { module: 'portfolio', submodule: 'credits', key: 'AUTO_POST_ENTRY_CREDIT', value: 'true', description: 'Generar asiento contable en crédito' },
    { module: 'portfolio', submodule: 'credits', key: 'AUTO_POST_ENTRY_CREDIT_PAYMENT', value: 'true', description: 'Generar asiento contable en pago de crédito' },
    { module: 'portfolio', submodule: 'loans', key: 'AUTO_POST_ENTRY_LOAN_PAYMENT', value: 'true', description: 'Generar asiento contable en pago de préstamo' },
    { module: 'portfolio', submodule: 'loans', key: 'PRE', value: '0', description: 'Consecutivo Préstamo' },
    { module: 'portfolio', submodule: 'loan_payments', key: 'PRE_PAG', value: '0', description: 'Consecutivo Pago de Préstamo' },
    { module: 'portfolio', submodule: 'credits', key: 'CRE', value: '0', description: 'Consecutivo Crédito' },
    { module: 'portfolio', submodule: 'credit_payments', key: 'CRE_PAG', value: '0', description: 'Consecutivo Pago Crédito' },

    //inventories
    { module: 'inventory', submodule: 'movements', key: 'INV_IN', value: '0', description: 'Consecutivo Movimiento Inventario Entrada' },
    { module: 'inventory', submodule: 'movements', key: 'INV_OUT', value: '0', description: 'Consecutivo Movimiento Inventario Salida' },
    { module: 'inventory', submodule: 'movements', key: 'INV_ADJ', value: '0', description: 'Consecutivo Movimiento Inventario Ajuste' },
    { module: 'inventory', submodule: 'products', key: 'PRD', value: '0', description: 'Consecutivo Producto' },
    { module: 'inventory', submodule: 'services', key: 'SRV', value: '0', description: 'Consecutivo Servicio' },
    { module: 'inventory', submodule: 'assets', key: 'ACT', value: '0', description: 'Consecutivo Bien o Activo' },

    //purchasing
    { module: 'purchasing', submodule: 'purchase_orders', key: 'OC', value: '0', description: 'Consecutivo Orden de Compra' },
    { module: 'purchasing', submodule: 'purchase_orders', key: 'OC-DEV', value: '0', description: 'Consecutivo Devolución de Orden de Compra' },
    { module: 'purchasing', submodule: 'suppliers', key: 'PROV', value: '0', description: 'Consecutivo Proveedor' },
    { module: 'purchasing', submodule: 'purchase_invoices', key: 'FAC-P', value: '0', description: 'Consecutivo Factura de Compra' },
    { module: 'purchasing', submodule: 'purchase_invoices', key: 'FAC-P-DEV', value: '0', description: 'Consecutivo Devolución de Factura de Compra' },
    { module: 'purchasing', submodule: 'accounts_payables', key: 'CXP', value: '0', description: 'Consecutivo Cuentas por Pagar' },
    { module: 'purchasing', submodule: 'accounts_payables', key: 'CXP-PAG', value: '0', description: 'Consecutivo Pago de Cuentas por Pagar' },
    { module: 'purchasing', submodule: 'accounts_payables', key: 'ANT-PRO', value: '0', description: 'Consecutivo Anticipo Proveedor' },
    { module: 'purchasing', submodule: 'accounts_payables', key: 'NC-PRO', value: '0', description: 'Consecutivo Notas de Credito a Proveedores' },
    { module: 'purchasing', submodule: 'accounts_payables', key: 'ND-PRO', value: '0', description: 'Consecutivo Notas de Debito a Proveedores' },


    // Banking
    { module: 'banking', submodule: 'transactions', key: 'BATCH_TRANSACTION_BANK_CODE', value: '005823', description: 'Código Bancario para Transacciones en Lote' },
    { module: 'banking', submodule: 'bank_transactions', key: 'MB', value: '0', description: 'Consecutivo Movimiento Bancario' },
    // Accounting
    { module: 'accounting', submodule: 'chart_of_accounts', key: 'NRO_ASIENTO', value: '0', description: 'Consecutivo Asiento Contable' },
    // Treasury
    { module: 'treasury', submodule: 'cash_management', key: 'DOC_CAJA', value: '0', description: 'Consecutivo Movimiento de Caja' },
    { module: 'treasury', submodule: 'cash_management', key: 'AUTO_POST_ENTRY_TREASURY', value: 'true', description: 'Generar asiento contable en movimientos de tesorería' },
    // Audit
    { module: 'audit', submodule: 'logs', key: 'LOG_RETENTION_DAYS', value: '365', description: 'Días de retención de logs de auditoría' },
  ],

  categories: [
    // associate_type
    { type: 'associate_type', code: 'empleados', name: 'Empleados' },
    { type: 'associate_type', code: 'gerencia', name: 'Nivel Gerencial' },
    { type: 'associate_type', code: 'pensionados', name: 'Pensionados' },
    { type: 'associate_type', code: 'jubilados', name: 'Jubilados' },
    { type: 'associate_type', code: 'ejecutivo', name: 'Nivel Ejecutivo' },
    { type: 'associate_type', code: 'comision_servicio', name: 'Personal en Comisión de Servicio' },
    { type: 'associate_type', code: 'contratado', name: 'Personal Contratado a Tiempo Determinado' },
    // discount_frequency
    { type: 'discount_frequency', code: 'semanal', name: 'Semanal' },
    { type: 'discount_frequency', code: 'quincenal', name: 'Quincenal' },
    { type: 'discount_frequency', code: 'mensual', name: 'Mensual' },
    { type: 'discount_frequency', code: 'trimestral', name: 'Trimestral' },
    { type: 'discount_frequency', code: 'semestral', name: 'Semestral' },
    { type: 'discount_frequency', code: 'anual', name: 'Anual' },
    // payroll_type
    { type: 'payroll_type', code: '5501', name: 'Aporte Empleados', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '5800', name: 'Descuentos Caja', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '5502', name: 'Prestamos Personales', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '5504', name: 'Prestamos Hipotecarios', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '5508', name: 'Credito Moto', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '5518', name: 'Prestamos Afianzados', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '5559', name: 'Credito Vehiculo', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '5634', name: 'Prestamos Mediano Plazo', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '5635', name: 'Prestamos a Largo Plazo', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '0059', name: 'Reintegro Caja', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '0020', name: 'Reintegro Prestamo', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '5594', name: 'Credito Telefono', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '5027', name: 'Credito Jornada Salud', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '5025', name: 'Credito Comercial', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    { type: 'payroll_type', code: '5022', name: 'Credi Salario', metadata: { deferredDate: '2025-09-30', dateCanceled: '2023-10-31', deferredNumber: '81', numberCanceled: '91', group: 'ASSETS' } },
    // nationality, gender, civil_status, account_type
    { type: 'nationality', code: 'V', name: 'Venezolano' },
    { type: 'nationality', code: 'E', name: 'Extranjero' },
    { type: 'gender', code: 'M', name: 'Masculino' },
    { type: 'gender', code: 'F', name: 'Femenino' },
    { type: 'civil_status', code: 'soltero', name: 'Soltero' },
    { type: 'civil_status', code: 'casado', name: 'Casado' },
    { type: 'civil_status', code: 'divorciado', name: 'Divorciado' },
    { type: 'civil_status', code: 'viudo', name: 'Viudo' },
    { type: 'account_type', code: 'corriente', name: 'Corriente' },
    { type: 'account_type', code: 'ahorro', name: 'Ahorro' },
  ],
};
