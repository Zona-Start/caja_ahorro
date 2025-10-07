/**
 * Query Key Factory - Centralizada para toda la aplicación
 *
 * Este archivo centraliza todas las claves de consulta para TanStack Query.
 * Sigue el patrón de Query Key Factory para una mejor organización y
 * facilita la invalidación de queries de manera robusta y predecible.
 *
 * Patrón utilizado:
 * - _def: Clave base del módulo para invalidar todo
 * - all: Para listas generales (sin filtros específicos)
 * - list: Para listas con filtros dinámicos
 * - detail: Para obtener un recurso específico por ID
 */

export const queryKeys = {
  // =============================================
  // ACCOUNTING ACCOUNTS (Cuentas Contables)
  // =============================================
  accountingAccounts: {
    _def: ['accounting_accounts'],
    all: () => [...queryKeys.accountingAccounts._def],
    list: (filters?: Record<string, any>) => [
      ...queryKeys.accountingAccounts._def,
      'list',
      filters,
    ],
    paginated: (params?: Record<string, any>) => ['paginated_accounts', params],
    detail: (id: number) => [
      ...queryKeys.accountingAccounts._def,
      'detail',
      id,
    ],
  },

  // =============================================
  // ACCOUNTING CYCLES (Ciclos Contables)
  // =============================================
  accountingCycles: {
    _def: ['accounting_cycles'],
    all: () => [...queryKeys.accountingCycles._def],
    list: (filters?: Record<string, any>) => [
      ...queryKeys.accountingCycles._def,
      'list',
      filters,
    ],
    paginated: (params?: Record<string, any>) => [
      'paginated_accounting_cycles',
      params,
    ],
    detail: (id: number) => [...queryKeys.accountingCycles._def, 'detail', id],
  },

  // =============================================
  // ACCOUNTING ENTRIES (Asientos Contables)
  // =============================================
  accountingEntries: {
    _def: ['accounting_entries'],
    all: () => [...queryKeys.accountingEntries._def],
    list: (filters?: Record<string, any>) => [
      ...queryKeys.accountingEntries._def,
      'list',
      filters,
    ],
    paginated: (params?: Record<string, any>) => [
      'paginated_accounting_entries',
      params,
    ],
    detail: (id: number) => [...queryKeys.accountingEntries._def, 'detail', id],
  },

  // =============================================
  // ADMINISTRATION MODULE - ACCOUNTS PAYABLE
  // =============================================
  accountsPayable: {
    _def: ['accounts-payable'],
    all: (params?: Record<string, any>) => [
      ...queryKeys.accountsPayable._def,
      params,
    ],
    detail: (id: number) => ['account-payable', id],
    paymentHistory: (id: number) => ['payment-history', id],
    appliedTransactions: (id: number) => ['applied-transactions', id],
    bySuppliers: (params?: Record<string, any>) => [
      'accounts-payable-by-suppliers',
      params,
    ],
  },

  // =============================================
  // ADMINISTRATION MODULE - PURCHASE ORDERS
  // =============================================
  purchaseOrders: {
    _def: ['purchase-orders'],
    all: (params?: Record<string, any>) => [
      ...queryKeys.purchaseOrders._def,
      params,
    ],
    detail: (id: number) => ['purchase-orders-by-id', id],
    forInvoice: (params?: Record<string, any>) => [
      'purchase-orders-for-invoice',
      params,
    ],
  },

  // =============================================
  // ADMINISTRATION MODULE - SUPPLIER INVOICES
  // =============================================
  supplierInvoices: {
    _def: ['supplier-invoices'],
    all: (params?: Record<string, any>) => [
      ...queryKeys.supplierInvoices._def,
      params,
    ],
    detail: (id: number) => ['supplier-invoice', id],
    bySupplier: (supplierId?: number) => [
      'supplier-invoices-by-supplier',
      supplierId,
    ],
    draftPending: () => ['supplier-invoices-draft-pending'],
  },

  // =============================================
  // ADMINISTRATION MODULE - SUPPLIER PAYMENTS
  // =============================================
  supplierPayments: {
    _def: ['payments-by-supplier'],
    all: (params?: Record<string, any>) => [
      ...queryKeys.supplierPayments._def,
      params,
    ],
  },

  // =============================================
  // ADMINISTRATION MODULE - SUPPLIER TRANSACTIONS
  // =============================================
  supplierTransactions: {
    _def: ['supplier-transactions'],
    all: (params?: Record<string, any>) => [
      ...queryKeys.supplierTransactions._def,
      params,
    ],
    detail: (id: number) => ['supplier-transaction', id],
    advances: () => ['supplier-transaction-advance'],
    noteCredit: () => ['supplier-transaction-note-credit'],
    noteDebit: () => ['supplier-transaction-note-debit'],
    appliedTrasaction: (id: number | null) => ['supplier-transaction-applied-transaction', id],
  },

  // =============================================
  // ADMINISTRATION MODULE - SUPPLIERS
  // =============================================
  suppliers: {
    _def: ['supplier'],
    all: (params?: Record<string, any>) => [
      ...queryKeys.suppliers._def,
      params,
    ],
    detail: (id: number) => ['supplier-by-id', id],
    count: () => ['supplier-count'],
    listAll: () => ['supplier-all'],
  },

  // =============================================
  // INVENTORIES MODULE - FIXED ASSETS
  // =============================================
  fixedAssets: {
    _def: ['fixed-asset'],
    all: (params?: Record<string, any>) => [
      ...queryKeys.fixedAssets._def,
      params,
    ],
    listAll: () => ['fixed-asset-all'],
  },

  // =============================================
  // INVENTORIES MODULE - INVENTORY CATEGORIES
  // =============================================
  inventoryCategories: {
    _def: ['inventory-categories'],
    all: (params?: Record<string, any>) => [
      ...queryKeys.inventoryCategories._def,
      params,
    ],
    listAll: (group?: string) => ['inventory-categories-all', group],
    detail: (id: number) => ['inventory-category', id],
  },

  // =============================================
  // INVENTORIES MODULE - INVENTORY MOVEMENTS
  // =============================================
  inventoryMovements: {
    _def: ['inventory-movements'],
    all: (params?: Record<string, any>) => [
      ...queryKeys.inventoryMovements._def,
      params,
    ],
  },

  // =============================================
  // INVENTORIES MODULE - PRODUCTS
  // =============================================
  products: {
    _def: ['products'],
    all: (params?: Record<string, any>) => [...queryKeys.products._def, params],
    listAll: () => ['products-all'],
    detail: (id: number) => ['product', id],
  },

  // =============================================
  // INVENTORIES MODULE - SERVICES
  // =============================================
  services: {
    _def: ['services'],
    all: (params?: Record<string, any>) => [...queryKeys.services._def, params],
    listAll: () => ['services-all'],
  },
};

// =============================================
// UTILITY TYPES (opcional, para TypeScript)
// =============================================
export type QueryKeys = typeof queryKeys;

// Accounting Module Types
export type AccountingAccountsKeys = QueryKeys['accountingAccounts'];
export type AccountingCyclesKeys = QueryKeys['accountingCycles'];
export type AccountingEntriesKeys = QueryKeys['accountingEntries'];

// Administration Module Types
export type AccountsPayableKeys = QueryKeys['accountsPayable'];
export type PurchaseOrdersKeys = QueryKeys['purchaseOrders'];
export type SupplierInvoicesKeys = QueryKeys['supplierInvoices'];
export type SupplierPaymentsKeys = QueryKeys['supplierPayments'];
export type SupplierTransactionsKeys = QueryKeys['supplierTransactions'];
export type SuppliersKeys = QueryKeys['suppliers'];

// Inventories Module Types
export type FixedAssetsKeys = QueryKeys['fixedAssets'];
export type InventoryCategoriesKeys = QueryKeys['inventoryCategories'];
export type InventoryMovementsKeys = QueryKeys['inventoryMovements'];
export type ProductsKeys = QueryKeys['products'];
export type ServicesKeys = QueryKeys['services'];
