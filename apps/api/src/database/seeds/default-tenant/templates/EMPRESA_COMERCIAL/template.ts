import type { BusinessTypeTemplate } from '../template.types';
import { ACCOUNTS } from './accounts';

export const EMPRESA_COMERCIAL_TEMPLATE: BusinessTypeTemplate = {
  accounts: ACCOUNTS,
  defaultModules: [
    'INVENTORY',
    'PURCHASING',
    'SALES',
    'BANKING',
    'TREASURY',
    'HR_PAYROLL',
    'AUDIT',
    'IAM',
    'SYSTEM',
  ],

  roles: [
    {
      name: 'admin',
      description: 'Administrador con acceso de gestión',
      isDefault: false,
    },
    {
      name: 'contador',
      description: 'Contador con acceso financiero',
      isDefault: false,
    },
    {
      name: 'asistente',
      description: 'Asistente con acceso basico',
      isDefault: true,
    },
  ],

  settings: [
    {
      key: 'TAX_SALES',
      value: '16',
      description: 'Porcentaje de IVA para Ventas',
      category: 'inventory',
    },
    {
      key: 'TAX_PURCHASES',
      value: '16',
      description: 'Porcentaje de IVA para Compras',
      category: 'inventory',
    },
    {
      key: 'VAT_RATE',
      value: '16',
      description: 'Porcentaje de retención de IVA para Gastos',
      category: 'expenses',
    },
    {
      key: 'ISLR_RATE',
      value: '3',
      description: 'Porcentaje de retención de ISLR para Gastos',
      category: 'expenses',
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
    {
      key: 'DEFAULT_PROFIT_MARGIN',
      value: '30',
      description: 'Margen de ganancia predeterminado (%)',
      category: 'inventory',
    },
    {
      key: 'INVENTORY_VALUATION_METHOD',
      value: 'PROMEDIO',
      description: 'Método de valoración de inventario',
      category: 'inventory',
    },
    {
      key: 'BILLING_DUE_DAYS',
      value: '30',
      description: 'Días de crédito por defecto en facturación',
      category: 'sales',
    },
    {
      key: 'PRICING_CURRENCY_MODE',
      value: 'MULTI_CURRENCY',
      description: 'Tipo de Manejo de inventario',
      category: 'inventory',
    },
    {
      key: 'USE_DIFFERENTIAL_RATES',
      value: 'false',
      description: 'Uso de Tasas Diferentes',
      category: 'general',
    },
  ],

  moduleSettings: [
    //inventories
    {
      module: 'inventory',
      submodule: 'movements',
      key: 'INV-IN',
      value: '0',
      description: 'Consecutivo Movimiento Inventario Entrada',
    },
    {
      module: 'inventory',
      submodule: 'movements',
      key: 'INV-OUT',
      value: '0',
      description: 'Consecutivo Movimiento Inventario Salida',
    },
    {
      module: 'inventory',
      submodule: 'movements',
      key: 'INV-ADJ',
      value: '0',
      description: 'Consecutivo Movimiento Inventario Ajuste',
    },
    {
      module: 'inventory',
      submodule: 'products',
      key: 'PRD',
      value: '0',
      description: 'Consecutivo Producto',
    },
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
    {
      module: 'inventory',
      submodule: 'services',
      key: 'SRV',
      value: '0',
      description: 'Consecutivo Servicio',
    },
    {
      module: 'inventory',
      submodule: 'assets',
      key: 'ACT',
      value: '0',
      description: 'Consecutivo Bien o Activo',
    },
    //purchasing
    {
      module: 'purchasing',
      submodule: 'purchase_orders',
      key: 'OC',
      value: '0',
      description: 'Consecutivo Orden de Compra',
    },
    {
      module: 'purchasing',
      submodule: 'purchase_orders',
      key: 'OC-DEV',
      value: '0',
      description: 'Consecutivo Devolución de Orden de Compra',
    },
    {
      module: 'purchasing',
      submodule: 'suppliers',
      key: 'PROV',
      value: '0',
      description: 'Consecutivo Proveedor',
    },
    {
      module: 'purchasing',
      submodule: 'purchase_invoices',
      key: 'FAC-P',
      value: '0',
      description: 'Consecutivo Factura de Compra',
    },
    {
      module: 'purchasing',
      submodule: 'purchase_invoices',
      key: 'FAC-P-DEV',
      value: '0',
      description: 'Consecutivo Devolución de Factura de Compra',
    },
    {
      module: 'purchasing',
      submodule: 'accounts_payables',
      key: 'CXP',
      value: '0',
      description: 'Consecutivo Cuentas por Pagar',
    },
    {
      module: 'purchasing',
      submodule: 'accounts_payables',
      key: 'ANT-PRO',
      value: '0',
      description: 'Consecutivo Anticipo Proveedor',
    },
    {
      module: 'purchasing',
      submodule: 'accounts_payables',
      key: 'NC-PRO',
      value: '0',
      description: 'Consecutivo Notas de Credito a Proveedores',
    },
    {
      module: 'purchasing',
      submodule: 'accounts_payables',
      key: 'ND-PRO',
      value: '0',
      description: 'Consecutivo Notas de Debito a Proveedores',
    },
    {
      module: 'purchasing',
      submodule: 'suppliers_payments',
      key: 'PAG-PRO',
      value: '0',
      description: 'Consecutivo Pago a Proveedores',
    },
    {
      module: 'purchasing',
      submodule: 'suppliers_transactions',
      key: 'TRS-PRO',
      value: '0',
      description: 'Consecutivo Transacción Proveedores',
    },
    // Banking
    {
      module: 'banking',
      submodule: 'bank_transactions',
      key: 'MB',
      value: '0',
      description: 'Consecutivo Movimiento Bancario',
    },
    // Accounting
    {
      module: 'accounting',
      submodule: 'chart_of_accounts',
      key: 'NRO-ASIENTO',
      value: '0',
      description: 'Consecutivo Asiento Contable',
    },
    // Treasury
    {
      module: 'treasury',
      submodule: 'cash_management',
      key: 'DOC-CAJA',
      value: '0',
      description: 'Consecutivo Movimiento de Caja',
    },
    {
      module: 'treasury',
      submodule: 'cash_management',
      key: 'AUTO_POST_ENTRY_TREASURY',
      value: 'true',
      description: 'Generar asiento contable en movimientos de tesorería',
    },
    // HR Payroll
    {
      module: 'hr_payroll',
      submodule: 'employees',
      key: 'EMP',
      value: '0',
      description: 'Consecutivo Empleado',
    },
    {
      module: 'hr_payroll',
      submodule: 'payroll',
      key: 'NOM',
      value: '0',
      description: 'Consecutivo Nómina',
    },
    // Billing
    {
      module: 'sales',
      submodule: 'invoices',
      key: 'FAC',
      value: '0',
      description: 'Consecutivo Factura de Venta',
    },
    {
      module: 'accounting',
      submodule: 'invoices',
      key: 'AUTO_POST_ENTRY_SALES',
      value: 'true',
      description: 'Generar asiento contable en facturación',
    },
    // Audit
    {
      module: 'audit',
      submodule: 'logs',
      key: 'LOG_RETENTION_DAYS',
      value: '365',
      description: 'Días de retención de logs de auditoría',
    },
  ],

  categories: [
    // supplier_type
    { type: 'supplier_type', code: 'nacional', name: 'Proveedor Nacional' },
    {
      type: 'supplier_type',
      code: 'internacional',
      name: 'Proveedor Internacional',
    },
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


export const expenseCategories = [
  // --- SERVICIOS PÚBLICOS Y OFICINA ---
  { name: 'Electricidad y Energía', isActive: true },
  { name: 'Agua Potable', isActive: true },
  { name: 'Internet y Telecomunicaciones', isActive: true },
  { name: 'Alquiler de Oficinas / Locales', isActive: true },
  { name: 'Papelería y Útiles de Oficina', isActive: true },
  { name: 'Limpieza y Mantenimiento', isActive: true },

  // --- TECNOLOGÍA Y SOFTWARE ---
  { name: 'Suscripciones Software / SaaS', isActive: true },
  { name: 'Hosting y Servicios Cloud', isActive: true },
  { name: 'Soporte y Equipos Tecnológicos', isActive: true },

  // --- LOGÍSTICA Y TRANSPORTE ---
  { name: 'Combustible y Lubricantes', isActive: true },
  { name: 'Peajes y Estacionamientos', isActive: true },
  { name: 'Mantenimiento de Vehículos', isActive: true },
  { name: 'Servicios de Delivery / Envíos', isActive: true },

  // --- VIÁTICOS Y GASTOS DE REPRESENTACIÓN ---
  { name: 'Transporte y Taxis (Uber/Didi)', isActive: true },
  { name: 'Alimentación y Cenas de Negocios', isActive: true },
  { name: 'Hospedaje y Hoteles', isActive: true },
  { name: 'Pasajes Aéreos / Terrestres', isActive: true },

  // --- MARKETING Y VENTAS ---
  { name: 'Publicidad Digital (Meta/Google Ads)', isActive: true },
  { name: 'Eventos y Material POP', isActive: true },
  { name: 'Comisiones por Ventas', isActive: true },

  // --- RECURSOS HUMANOS / BIENESTAR ---
  { name: 'Seguros y Gastos Médicos', isActive: true },
  { name: 'Capacitaciones y Cursos', isActive: true },
  { name: 'Cafetería y Snacks para Empleados', isActive: true },
  { name: 'Uniformes y Ropa de Trabajo', isActive: true },

  // --- FINANCIEROS Y LEGALES ---
  { name: 'Comisiones Bancarias', isActive: true },
  { name: 'Honorarios Profesionales (Abogados/Contadores)', isActive: true },
  { name: 'Patentes, Tasas e Impuestos Municipales', isActive: true },
  { name: 'Multas y Sanciones', isActive: true },

  // --- OTROS ---
  { name: 'Gastos Menores / Varios', isActive: true }
];