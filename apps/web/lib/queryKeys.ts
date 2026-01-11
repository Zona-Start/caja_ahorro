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
    list: (filters?: Record<string, unknown>) => [
      ...queryKeys.accountingAccounts._def,
      'list',
      filters,
    ],
    paginated: (params?: Record<string, unknown>) => [
      ...queryKeys.accountingAccounts._def,
      'paginated',
      params,
    ],
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
    list: (filters?: Record<string, unknown>) => [
      ...queryKeys.accountingCycles._def,
      'list',
      filters,
    ],
    paginated: (params?: Record<string, unknown>) => [
      ...queryKeys.accountingCycles._def,
      'paginated',
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
    list: (filters?: Record<string, unknown>) => [
      ...queryKeys.accountingEntries._def,
      'list',
      filters,
    ],
    paginated: (params?: Record<string, unknown>) => [
      ...queryKeys.accountingEntries._def,
      'paginated',
      params,
    ],
    detail: (id: number) => [...queryKeys.accountingEntries._def, 'detail', id],
  },

  // =============================================
  // ACCOUNTING CONFIGURATIONS (Configuraciones Contables)
  // =============================================
  accountingConfigurations: {
    _def: ['accounting_configurations'],
    all: () => [...queryKeys.accountingConfigurations._def],
    list: (filters?: Record<string, unknown>) => [
      ...queryKeys.accountingConfigurations._def,
      'list',
      filters,
    ],
    paginated: (params?: Record<string, unknown>) => [
      ...queryKeys.accountingConfigurations._def,
      'paginated',
      params,
    ],
    detail: (id: number) => [id],
  },

  // =============================================
  // ACCOUNTING RULES (Reglas Contables)
  // =============================================
  accountingRules: {
    _def: ['accounting_rules'],
    all: () => [...queryKeys.accountingRules._def],
    list: (params?: Record<string, unknown>) => [
      ...queryKeys.accountingRules._def,
      'list',
      params,
    ],
    detail: (id: number) => [...queryKeys.accountingRules._def, 'detail', id],
  },

  // =============================================
  // ACCOUNTING BALANCES (Balances Contables)
  // =============================================
  accountingBalances: {
    _def: ['accounting_balances'],
    all: () => [...queryKeys.accountingBalances._def],
    list: (filters?: Record<string, unknown>) => [
      ...queryKeys.accountingBalances._def,
      'list',
      filters,
    ],
    paginated: (params?: Record<string, unknown>) => [
      ...queryKeys.accountingBalances._def,
      'paginated',
      params,
    ],
    detail: (id: number) => [
      ...queryKeys.accountingBalances._def,
      'detail',
      id,
    ],
  },

  // =============================================
  // ADMINISTRATION MODULE - ACCOUNTS PAYABLE
  // =============================================
  accountsPayable: {
    _def: ['accounts-payable'] as const,

    all: () => [...queryKeys.accountsPayable._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.accountsPayable._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.accountsPayable._def, 'detail', id],

    paymentHistory: (id: number) => [
      ...queryKeys.accountsPayable._def,
      'payment-history',
      id,
    ],

    appliedTransactions: (id: number) => [
      ...queryKeys.accountsPayable._def,
      'applied-transactions',
      id,
    ],

    bySuppliers: (params?: Record<string, unknown>) => [
      ...queryKeys.accountsPayable._def,
      'by-suppliers',
      params,
    ],
  },

  // =============================================
  // ADMINISTRATION MODULE - PURCHASE ORDERS
  // =============================================
  purchaseOrders: {
    _def: ['purchase-orders'] as const,

    all: () => [...queryKeys.purchaseOrders._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.purchaseOrders._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.purchaseOrders._def, 'detail', id],

    forInvoice: (params?: Record<string, unknown>) => [
      ...queryKeys.purchaseOrders._def,
      'for-invoice',
      params,
    ],
  },

  // =============================================
  // ADMINISTRATION MODULE - SUPPLIER INVOICES
  // =============================================
  supplierInvoices: {
    _def: ['supplier-invoices'] as const,

    all: () => [...queryKeys.supplierInvoices._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.supplierInvoices._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.supplierInvoices._def, 'detail', id],

    bySupplier: (supplierId?: number) => [
      ...queryKeys.supplierInvoices._def,
      'by-supplier',
      supplierId,
    ],

    draftPending: () => [...queryKeys.supplierInvoices._def, 'draft-pending'],
  },

  // =============================================
  // ADMINISTRATION MODULE - SUPPLIER PAYMENTS
  // =============================================
  supplierPayments: {
    _def: ['supplier-payments'] as const,

    all: () => [...queryKeys.supplierPayments._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.supplierPayments._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.supplierPayments._def, 'detail', id],
  },

  // =============================================
  // ADMINISTRATION MODULE - SUPPLIER TRANSACTIONS
  // =============================================
  supplierTransactions: {
    _def: ['supplier-transactions'] as const,

    all: () => [...queryKeys.supplierTransactions._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.supplierTransactions._def,
      'list',
      params,
    ],

    detail: (id: number) => [
      ...queryKeys.supplierTransactions._def,
      'detail',
      id,
    ],

    advances: () => [...queryKeys.supplierTransactions._def, 'advances'],

    noteCredit: () => [...queryKeys.supplierTransactions._def, 'note-credit'],

    noteDebit: () => [...queryKeys.supplierTransactions._def, 'note-debit'],

    appliedTransaction: (id: number | null) => [
      ...queryKeys.supplierTransactions._def,
      'applied-transaction',
      id,
    ],
  },

  // =============================================
  // ADMINISTRATION MODULE - SUPPLIERS
  // =============================================
  suppliers: {
    _def: ['suppliers'] as const,

    all: () => [...queryKeys.suppliers._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.suppliers._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.suppliers._def, 'detail', id],

    count: () => [...queryKeys.suppliers._def, 'count'],

    listAll: () => [...queryKeys.suppliers._def, 'list-all'],
  },

  // =============================================
  // INVENTORIES MODULE - FIXED ASSETS
  // =============================================
  fixedAssets: {
    _def: ['fixed-assets'] as const,

    all: () => [...queryKeys.fixedAssets._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.fixedAssets._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.fixedAssets._def, 'detail', id],

    listAll: () => [...queryKeys.fixedAssets._def, 'list-all'],
  },

  // =============================================
  // INVENTORIES MODULE - INVENTORY CATEGORIES
  // =============================================
  inventoryCategories: {
    _def: ['inventory-categories'] as const,

    all: () => [...queryKeys.inventoryCategories._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.inventoryCategories._def,
      'list',
      params,
    ],

    detail: (id: number) => [
      ...queryKeys.inventoryCategories._def,
      'detail',
      id,
    ],

    listByGroup: (group?: string) => [
      ...queryKeys.inventoryCategories._def,
      'list-by-group',
      group,
    ],
  },

  // =============================================
  // INVENTORIES MODULE - INVENTORY MOVEMENTS
  // =============================================
  inventoryMovements: {
    _def: ['inventory-movements'] as const,

    all: () => [...queryKeys.inventoryMovements._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.inventoryMovements._def,
      'list',
      params,
    ],

    detail: (id: number) => [
      ...queryKeys.inventoryMovements._def,
      'detail',
      id,
    ],
  },

  // =============================================
  // INVENTORIES MODULE - PRODUCTS
  // =============================================
  products: {
    _def: ['products'] as const,

    all: () => [...queryKeys.products._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.products._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.products._def, 'detail', id],

    listAll: () => [...queryKeys.products._def, 'list-all'],
  },

  // =============================================
  // INVENTORIES MODULE - SERVICES
  // =============================================
  services: {
    _def: ['services'] as const,

    all: () => [...queryKeys.services._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.services._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.services._def, 'detail', id],

    listAll: () => [...queryKeys.services._def, 'list-all'],
  },

  // =============================================
  // BANKS MODULE - BANK ACCOUNTS
  // =============================================
  bankAccounts: {
    _def: ['bank-accounts'] as const,

    all: () => [...queryKeys.bankAccounts._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.bankAccounts._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.bankAccounts._def, 'detail', id],

    listAll: () => [...queryKeys.bankAccounts._def, 'list-all'],
  },

  // =============================================
  // BANKS MODULE - BANK DIRECTORY
  // =============================================
  bankDirectory: {
    _def: ['bank-directory'] as const,

    all: () => [...queryKeys.bankDirectory._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.bankDirectory._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.bankDirectory._def, 'detail', id],

    listAll: () => [...queryKeys.bankDirectory._def, 'list-all'],
  },

  // =============================================
  // BANKS MODULE - BANK MOVEMENTS
  // =============================================
  bankMovements: {
    _def: ['bank-movements'] as const,

    all: () => [...queryKeys.bankMovements._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.bankMovements._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.bankMovements._def, 'detail', id],
  },

  // =============================================
  // BANKS MODULE - LINKABLES
  // =============================================
  linkables: {
    _def: ['linkables'] as const,

    all: () => [...queryKeys.linkables._def],

    byParams: (params?: Record<string, unknown>) => [
      ...queryKeys.linkables._def,
      'by-params',
      params,
    ],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.linkables._def,
      'list',
      params,
    ],
  },

  // =============================================
  // SAVINGS BANKS MODULE - INDIVIDUAL ASSET LOAD
  // =============================================
  associatesForIndividualAssetLoad: {
    _def: ['associates-for-individual-asset-load'] as const,

    all: () => [...queryKeys.associatesForIndividualAssetLoad._def],

    byCedula: (cedula: string) => [
      ...queryKeys.associatesForIndividualAssetLoad._def,
      'by-cedula',
      cedula,
    ],
  },

  // =============================================
  // SAVINGS BANKS MODULE - PAYMENT BATCHES
  // =============================================
  paymentBatches: {
    _def: ['payment-batches'] as const,

    all: () => [...queryKeys.paymentBatches._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.paymentBatches._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.paymentBatches._def, 'detail', id],
  },

  // =============================================
  // SAVINGS BANKS MODULE - PAYMENT BATCH SOURCES
  // =============================================
  paymentBatchSources: {
    _def: ['payment-batch-sources'] as const,

    all: () => [...queryKeys.paymentBatchSources._def],

    approvedLoans: () => [
      ...queryKeys.paymentBatchSources._def,
      'approved-loans',
    ],

    approvedWithdrawals: () => [
      ...queryKeys.paymentBatchSources._def,
      'approved-withdrawals',
    ],

    approvedLiquidations: () => [
      ...queryKeys.paymentBatchSources._def,
      'approved-liquidations',
    ],
  },

  // =============================================
  // SAVINGS BANKS MODULE - SETTLEMENTS
  // =============================================
  settlements: {
    _def: ['settlements'] as const,

    all: () => [...queryKeys.settlements._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.settlements._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.settlements._def, 'detail', id],
  },

  // =============================================
  // SAVINGS BANKS MODULE - ASSOCIATES FOR SETTLEMENT
  // =============================================
  associatesForSettlement: {
    _def: ['associates-for-settlement'] as const,

    all: () => [...queryKeys.associatesForSettlement._def],

    byCedula: (cedula: string) => [
      ...queryKeys.associatesForSettlement._def,
      'by-cedula',
      cedula,
    ],
  },

  // =============================================
  // SAVINGS BANKS MODULE - WITHDRAWALS
  // =============================================
  withdrawals: {
    _def: ['withdrawals'] as const,

    all: () => [...queryKeys.withdrawals._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.withdrawals._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.withdrawals._def, 'detail', id],
  },

  // =============================================
  // SAVINGS BANKS MODULE - ASSOCIATES FOR WITHDRAWAL
  // =============================================
  associatesForWithdrawal: {
    _def: ['associates-for-withdrawal'] as const,

    all: () => [...queryKeys.associatesForWithdrawal._def],

    byCedula: (cedula: string) => [
      ...queryKeys.associatesForWithdrawal._def,
      'by-cedula',
      cedula,
    ],
  },

  // =============================================
  // SAVINGS BANKS MODULE - WITHDRAWAL TYPES
  // =============================================
  withdrawalTypes: {
    _def: ['withdrawal-types'] as const,

    all: () => [...queryKeys.withdrawalTypes._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.withdrawalTypes._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.withdrawalTypes._def, 'detail', id],

    listAll: () => [...queryKeys.withdrawalTypes._def, 'list-all'],
  },

  // =============================================
  // SAVINGS BANKS MODULE - CREDIT MANAGEMENTS
  // =============================================
  creditManagements: {
    _def: ['credit-managements'] as const,

    all: () => [...queryKeys.creditManagements._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.creditManagements._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.creditManagements._def, 'detail', id],

    count: () => [...queryKeys.creditManagements._def, 'count'],
  },

  // =============================================
  // SAVINGS BANKS MODULE - ASSOCIATES FOR CREDIT MANAGEMENT
  // =============================================
  associatesForCreditManagement: {
    _def: ['associates-for-credit-management'] as const,

    all: () => [...queryKeys.associatesForCreditManagement._def],

    byCedula: (cedula: string) => [
      ...queryKeys.associatesForCreditManagement._def,
      'by-cedula',
      cedula,
    ],
  },

  // =============================================
  // SAVINGS BANKS MODULE - CREDIT MANAGEMENT PRODUCTS
  // =============================================
  creditManagementProducts: {
    _def: ['credit-management-products'] as const,

    all: () => [...queryKeys.creditManagementProducts._def],

    listAll: () => [...queryKeys.creditManagementProducts._def, 'list-all'],
  },

  // =============================================
  // SAVINGS BANKS MODULE - CREDITS PAID
  // =============================================
  creditsPaid: {
    _def: ['credits-paid'] as const,

    all: () => [...queryKeys.creditsPaid._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.creditsPaid._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.creditsPaid._def, 'detail', id],
  },

  // =============================================
  // SAVINGS BANKS MODULE - ASSOCIATES FOR CREDITS PAID
  // =============================================
  associatesForCreditsPaid: {
    _def: ['associates-for-credits-paid'] as const,

    all: () => [...queryKeys.associatesForCreditsPaid._def],

    byCedula: (cedula: string) => [
      ...queryKeys.associatesForCreditsPaid._def,
      'by-cedula',
      cedula,
    ],
  },

  // =============================================
  // SAVINGS BANKS MODULE - TYPE CREDITS
  // =============================================
  typeCredits: {
    _def: ['type-credits'] as const,

    all: () => [...queryKeys.typeCredits._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.typeCredits._def,
      'list',
      params,
    ],

    allList: () => [...queryKeys.typeCredits._def, 'all-list'],
  },

  // =============================================
  // SAVINGS BANKS MODULE - TYPE LOANS
  // =============================================
  typeLoans: {
    _def: ['type-loans'] as const,

    all: () => [...queryKeys.typeLoans._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.typeLoans._def,
      'list',
      params,
    ],

    paginated: (params?: Record<string, unknown>) => [
      ...queryKeys.typeLoans._def,
      'paginated',
      params,
    ],
  },

  // =============================================
  // SAVINGS BANKS MODULE - LOANS MANAGEMENT
  // =============================================
  loansManagement: {
    _def: ['loans-management'] as const,

    all: () => [...queryKeys.loansManagement._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.loansManagement._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.loansManagement._def, 'detail', id],

    count: () => [...queryKeys.loansManagement._def, 'count'],

    associatesByCedula: (cedula: string) => [
      ...queryKeys.loansManagement._def,
      'associates-by-cedula',
      cedula,
    ],
    associatesByCedulaAll: () => [
      ...queryKeys.loansManagement._def,
      'associates-by-cedula',
    ],
  },

  // =============================================
  // SAVINGS BANKS MODULE - LOANS PAID
  // =============================================
  loansPaid: {
    _def: ['loans-paid'] as const,

    all: () => [...queryKeys.loansPaid._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.loansPaid._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.loansPaid._def, 'detail', id],

    associateByIndividual: (cedula: string) => [
      ...queryKeys.loansPaid._def,
      'associate-individual-by-cedula',
      cedula,
    ],
    associateByIndividualAll: () => [
      ...queryKeys.loansPaid._def,
      'associate-individual-by-cedula',
    ],
  },

  // =============================================
  // SAVINGS BANKS MODULE - PARTNERS
  // =============================================
  associates: {
    _def: ['associates'] as const,

    all: () => [...queryKeys.associates._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.associates._def,
      'list',
      params,
    ],

    detail: (id: number) => [...queryKeys.associates._def, 'detail', id],
  },

  // =============================================
  // SAVINGS BANKS MODULE - PARTNERS INQUIRY
  // =============================================
  inquiry: {
    _def: ['inquiry'] as const,

    associateDetails: (cedula: string | null) => [
      ...queryKeys.inquiry._def,
      'associate-details',
      cedula,
    ],

    haberesMovements: (associateId: number | null) => [
      ...queryKeys.inquiry._def,
      'haberes-movements',
      associateId,
    ],

    withdrawals: (associateId: number | null) => [
      ...queryKeys.inquiry._def,
      'withdrawals',
      associateId,
    ],

    transactionHistory: (associateId: number | null) => [
      ...queryKeys.inquiry._def,
      'transaction-history',
      associateId,
    ],

    loans: (associateId: number | null) => [
      ...queryKeys.inquiry._def,
      'loans',
      associateId,
    ],

    credits: (associateId: number | null) => [
      ...queryKeys.inquiry._def,
      'credits',
      associateId,
    ],

    loanDetails: (loanId: number | null) => [
      ...queryKeys.inquiry._def,
      'loan-details',
      loanId,
    ],

    creditDetails: (creditId: number | null) => [
      ...queryKeys.inquiry._def,
      'credit-details',
      creditId,
    ],

    withdrawalDetails: (withdrawalId: number | null) => [
      ...queryKeys.inquiry._def,
      'withdrawal-details',
      withdrawalId,
    ],
  },

  // =============================================
  // CONFIGURATIONS MODULE - COMPANY
  // =============================================
  company: {
    _def: ['company'] as const,

    all: () => [...queryKeys.company._def],
  },

  // =============================================
  // CONFIGURATIONS MODULE - SYSTEM PROPERTIES
  // =============================================
  systemProperties: {
    _def: ['system-properties'] as const,

    all: () => [...queryKeys.systemProperties._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.systemProperties._def,
      'list',
      params,
    ],
  },

  // =============================================
  // CONFIGURATIONS MODULE - TYPE PAYROLL
  // =============================================
  typePayroll: {
    _def: ['type-payroll'] as const,

    all: () => [...queryKeys.typePayroll._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.typePayroll._def,
      'list',
      params,
    ],

    paginated: (params?: Record<string, unknown>) => [
      ...queryKeys.typePayroll._def,
      'paginated',
      params,
    ],
  },

  // =============================================
  // COMMON MODULE - CATEGORY TYPES
  // =============================================
  categoryTypes: {
    _def: ['category-types'] as const,

    all: () => [...queryKeys.categoryTypes._def],

    list: (params?: Record<string, unknown>) => [
      ...queryKeys.categoryTypes._def,
      'list',
      params,
    ],

    paginated: (params?: Record<string, unknown>) => [
      ...queryKeys.categoryTypes._def,
      'paginated',
      params,
    ],

    group: (group: string) => [...queryKeys.categoryTypes._def, 'group', group],
  },

  // =============================================
  // COMMON MODULE - STATES
  // =============================================
  states: {
    _def: ['states'] as const,

    all: () => [...queryKeys.states._def],
  },

  // =============================================
  // COMMON MODULE - SETTINGS SYSTEM
  // =============================================
  settingsSystem: {
    _def: ['settings-system'] as const,

    all: () => [...queryKeys.settingsSystem._def],
  },

  // =============================================
  // COMMON MODULE - CURRENCIES
  // =============================================
  currencies: {
    _def: ['currencies'] as const,

    all: () => [...queryKeys.currencies._def],
  },

  // =============================================
  // COMMON MODULE - EXCHANGE RATE
  // =============================================
  exchangeRate: {
    _def: ['exchange-rate'] as const,

    all: () => [...queryKeys.exchangeRate._def],
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

// Banks Module Types
export type BankAccountsKeys = QueryKeys['bankAccounts'];
export type BankDirectoryKeys = QueryKeys['bankDirectory'];
export type BankMovementsKeys = QueryKeys['bankMovements'];
export type LinkablesKeys = QueryKeys['linkables'];

// Savings Banks Module Types
export type AssociatesForIndividualAssetLoadKeys =
  QueryKeys['associatesForIndividualAssetLoad'];
export type PaymentBatchesKeys = QueryKeys['paymentBatches'];
export type PaymentBatchSourcesKeys = QueryKeys['paymentBatchSources'];
export type LoansPaidKeys = QueryKeys['loansPaid'];

// Savings Banks Module Types
export type SettlementsKeys = QueryKeys['settlements'];
export type AssociatesForSettlementKeys = QueryKeys['associatesForSettlement'];

// Savings Banks Module Types
export type WithdrawalsKeys = QueryKeys['withdrawals'];
export type AssociatesForWithdrawalKeys = QueryKeys['associatesForWithdrawal'];
export type WithdrawalTypesKeys = QueryKeys['withdrawalTypes'];

// Savings Banks Module Types
export type CreditManagementsKeys = QueryKeys['creditManagements'];
export type AssociatesForCreditManagementKeys =
  QueryKeys['associatesForCreditManagement'];
export type CreditManagementProductsKeys =
  QueryKeys['creditManagementProducts'];

// Savings Banks Module Types
export type CreditsPaidKeys = QueryKeys['creditsPaid'];
export type AssociatesForCreditsPaidKeys =
  QueryKeys['associatesForCreditsPaid'];
export type LoansManagementKeys = QueryKeys['loansManagement'];
export type TypeLoansKeys = QueryKeys['typeLoans'];
