// ==========================================
// 1. ACCIONES (Los verbos del sistema)

import { authSchema } from "../_schemas";



// ==========================================
export const permissionActionEnum = authSchema.enum('permission_action', [
  'read', // Leer, listar, ver detalle
  'create', // Registrar nuevos datos
  'update', // Editar datos existentes (sin eliminar)
  'delete', // Eliminar o anular registros
  'execute', // Ejecutar una acción
  'approve', // Aprobar una acción
  'reject', // Rechazar una acción
  'process', // Ejecutar lógica de negocio (ej. procesar un asiento contable)
  'disburse', // Acción financiera de soltar dinero (ej. en liquidaciones)
  'mass_upload', // Carga mediante Excel/CSV (ej. carga de haberes)
  'mass_disburse', // Desembolso por lotes
]);

// ==========================================
// 2. RECURSOS (Módulo : Submódulo)
// ==========================================
// Formato recomendado: "modulo:submodulo" para fácil lectura
export const permissionResourceEnum = authSchema.enum('permission_resource', [
  // --- MODULE: SAVINGS (Caja Ahorro) ---
  'savings:members',
  'savings:contributions',
  'savings:withdrawals',
  'savings:liquidations',
  'savings:configuration',

  // --- MODULE: PORTFOLIO (Cartera / Préstamos) ---
  'portfolio:loans',
  'portfolio:credits',
  'portfolio:payments',
  'portfolio:products',

  // --- MODULE: ACCOUNTING (Contabilidad) ---
  'accounting:chart_of_accounts',
  'accounting:rules',
  'accounting:journal_entries',
  'accounting:reports',
  'accounting:cycles',
  'accounting:balances',

  // --- MODULE: BANKING (Banco) ---
  'banking:directory',
  'banking:accounts',
  'banking:transactions',
  'banking:reconciliation',

  // --- MODULE: INVENTORY (Inventario) ---
  'inventory:products',
  'inventory:services',
  'inventory:assets',
  'inventory:stock',

  // --- MODULE: PURCHASING (Compras) ---
  'purchasing:orders',
  'purchasing:providers',
  'purchasing:invoices',
  'purchasing:payments',
  'purchasing:reports',
  'purchasing:accounts_payable',

  // --- MODULE: IAM (Identity & Access Management) ---
  'iam:users',
  'iam:roles',
  'iam:permissions',
  'iam:sessions',

  // --- MODULE: CATALOG (Catálogos Globales) ---
  'catalog:currencies',
  'catalog:exchange_rates',
  'catalog:categories',
  'catalog:geography',

  // --- MODULE: SYSTEM (Sistema) ---
  'system:tenants',
  'system:tenants-systems',
  'system:global',
  'system:currencies',
  'system:modules',
]);

// ==========================================
// 3. SCOPE (La frontera de los datos)
// ==========================================
export const permissionScopeEnum = authSchema.enum('permission_scope', [
  'all', // Acceso global. (Ej. El Gerente General ve TODAS las liquidaciones)
  'team', // Acceso por equipo.
  'department', // Acceso por área. (Ej. Solo el área contable aprueba los asientos)
  'branch', // Acceso por sucursal. (Ej. El cajero solo procesa retiros de SU agencia)
  'tenant', // Acceso por tenant.
  'global', // Acceso global.
  'own', // Acceso personal. (Ej. El asociado solo lee SUS propios haberes)
]);
