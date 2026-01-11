import { relations } from 'drizzle-orm';
import {
  accountBalances,
  accountingCycles,
  accountingEntries,
  accountingEntryDetails,
  accountPlan,
  accountsPayable,
  associateAccountBalanceHistory,
  associateAccountMovements,
  associateAccounts,
  associates,
  bankAccounts,
  bankCategoryRule,
  bankDirectory,
  bankReconciliationDetails,
  bankReconciliations,
  bankTransactions,
  categoryType,
  company,
  creditAmortizationSchedule,
  creditItemSales,
  creditPayments,
  creditPaymentsDetails,
  credits,
  creditStatusHistory,
  creditsTypes,
  currencies,
  exchangeRates,
  fixedAssets,
  fixedAssetsPrices,
  internalTransactionBankLinks,
  inventoriesCategories,
  inventoryMovements,
  liquidationsAssociates,
  loanAmortizationSchedule,
  loanPayments,
  loanPaymentsDetails,
  loans,
  loanStatusHistory,
  loanTypes,
  localities,
  municipalities,
  parishes,
  paymentBatches,
  paymentBatchItems,
  permissions,
  productPrices,
  products,
  productServiceSuppliers,
  purchaseOrderItems,
  purchaseOrders,
  roles,
  rolesPermissions,
  servicePrices,
  services,
  sessions,
  states,
  supplierAdvances,
  supplierCreditNotes,
  supplierDebitNotes,
  supplierInvoiceItems,
  supplierInvoices,
  supplierPaymentLines,
  supplierPayments,
  suppliers,
  supplierTransactionApplications,
  supplierTransactions,
  systemSettings,
  typePayrolls,
  users,
  usersRole,
  withdrawalsAssociates,
  withdrawalTypes,
} from '../tables';
import { accountingRuleDetails, accountingRules } from '../tables/accounting';

/* ---------- 1.  RELACIONES DE CATEGORÍAS ---------- */
export const inventoriesCategoriesRelations = relations(
  inventoriesCategories,
  ({ many }) => ({
    products: many(products),
    fixedAssets: many(fixedAssets),
    services: many(services),
  }),
);

/* ---------- 2.  RELACIONES DE PRODUCTOS ---------- */
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(inventoriesCategories, {
    fields: [products.categoryId],
    references: [inventoriesCategories.id],
  }),
  prices: many(productPrices),
  suppliers: many(productServiceSuppliers),
  movements: many(inventoryMovements),
}));

/* ---------- 3.  RELACIONES DE PRECIOS (productos) ---------- */
export const productPricesRelations = relations(productPrices, ({ one }) => ({
  product: one(products, {
    fields: [productPrices.productId],
    references: [products.id],
  }),
  supplier: one(suppliers, {
    fields: [productPrices.suppliersId],
    references: [suppliers.id],
  }),
}));

/* ---------- 4.  RELACIONES DE SERVICIOS ---------- */
export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(inventoriesCategories, {
    fields: [services.categoryId],
    references: [inventoriesCategories.id],
  }),
  prices: many(servicePrices),
  suppliers: many(productServiceSuppliers),
}));

/* ---------- 5.  RELACIONES DE PRECIOS (servicios) ---------- */
export const servicePricesRelations = relations(servicePrices, ({ one }) => ({
  service: one(services, {
    fields: [servicePrices.serviceId],
    references: [services.id],
  }),
  supplier: one(suppliers, {
    fields: [servicePrices.suppliersId],
    references: [suppliers.id],
  }),
}));

/* ---------- 6.  RELACIONES DE ACTIVOS FIJOS ---------- */
export const fixedAssetsRelations = relations(fixedAssets, ({ one, many }) => ({
  category: one(inventoriesCategories, {
    fields: [fixedAssets.categoryId],
    references: [inventoriesCategories.id],
  }),
  prices: many(fixedAssetsPrices),
  suppliers: many(productServiceSuppliers),
  movements: many(inventoryMovements),
}));

/* ---------- 7.  RELACIONES DE PRECIOS (activos fijos) ---------- */
export const fixedAssetsPricesRelations = relations(
  fixedAssetsPrices,
  ({ one }) => ({
    fixedAsset: one(fixedAssets, {
      fields: [fixedAssetsPrices.fixedAssetsId],
      references: [fixedAssets.id],
    }),
    supplier: one(suppliers, {
      fields: [fixedAssetsPrices.suppliersId],
      references: [suppliers.id],
    }),
  }),
);

/* ---------- 8.  RELACIONES DEL PUENTE product_service_suppliers ---------- */
export const productServiceSuppliersRelations = relations(
  productServiceSuppliers,
  ({ one }) => ({
    product: one(products, {
      fields: [productServiceSuppliers.productId],
      references: [products.id],
    }),
    service: one(services, {
      fields: [productServiceSuppliers.serviceId],
      references: [services.id],
    }),
    fixedAsset: one(fixedAssets, {
      fields: [productServiceSuppliers.fixedAssetsId],
      references: [fixedAssets.id],
    }),
    supplier: one(suppliers, {
      fields: [productServiceSuppliers.suppliersId],
      references: [suppliers.id],
    }),
  }),
);

/* ---------- 10.  RELACIONES DE MOVIMIENTOS DE INVENTARIO (polimórficas) ---------- */
export const inventoryMovementsRelations = relations(
  inventoryMovements,
  ({ one }) => ({
    /* Relación condicional según itemType */
    product: one(products, {
      fields: [inventoryMovements.itemId],
      references: [products.id],
      relationName: 'productMovements',
    }),
    fixedAsset: one(fixedAssets, {
      fields: [inventoryMovements.itemId],
      references: [fixedAssets.id],
      relationName: 'fixedAssetMovements',
    }),
  }),
);

/* -------------------------------------------------
   PROVEEDOR
-------------------------------------------------- */
export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  company: one(company, {
    fields: [suppliers.companyId],
    references: [company.id],
  }),
  state: one(states, {
    fields: [suppliers.state],
    references: [states.id],
  }),

  purchaseOrders: many(purchaseOrders),
  invoices: many(supplierInvoices),
  accountsPayable: many(accountsPayable),
  advances: many(supplierAdvances),
  creditNotes: many(supplierCreditNotes),
  debitNotes: many(supplierDebitNotes),
  payments: many(supplierPayments),
  transactions: many(supplierTransactions),

  productPrices: many(productPrices),
  servicePrices: many(servicePrices),
  fixedAssetsPrices: many(fixedAssetsPrices),
  productLinks: many(productServiceSuppliers),
}));

/* -------------------------------------------------
   ORDENES DE COMPRA
-------------------------------------------------- */
export const purchaseOrdersRelations = relations(
  purchaseOrders,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [purchaseOrders.supplierId],
      references: [suppliers.id],
    }),
    items: many(purchaseOrderItems),
    invoices: many(supplierInvoices),
  }),
);

export const purchaseOrderItemsRelations = relations(
  purchaseOrderItems,
  ({ one }) => ({
    order: one(purchaseOrders, {
      fields: [purchaseOrderItems.purchaseOrderId],
      references: [purchaseOrders.id],
    }),
  }),
);

/* -------------------------------------------------
   FACTURAS PROVEEDOR
-------------------------------------------------- */
export const supplierInvoicesRelations = relations(
  supplierInvoices,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [supplierInvoices.supplierId],
      references: [suppliers.id],
    }),
    purchaseOrder: one(purchaseOrders, {
      fields: [supplierInvoices.purchaseOrderId],
      references: [purchaseOrders.id],
    }),
    company: one(company, {
      fields: [supplierInvoices.companyId],
      references: [company.id],
    }),
    items: many(supplierInvoiceItems),
    accountsPayable: one(accountsPayable),
    inventoryMovements: many(inventoryMovements),
  }),
);

export const supplierInvoiceItemsRelations = relations(
  supplierInvoiceItems,
  ({ one }) => ({
    invoice: one(supplierInvoices, {
      fields: [supplierInvoiceItems.invoiceId],
      references: [supplierInvoices.id],
    }),
    expenseAccount: one(accountPlan, {
      fields: [supplierInvoiceItems.expenseAccountId],
      references: [accountPlan.id],
    }),
  }),
);

/* -------------------------------------------------
   CUENTAS POR PAGAR
-------------------------------------------------- */
export const accountsPayableRelations = relations(
  accountsPayable,
  ({ one, many }) => ({
    company: one(company, {
      fields: [accountsPayable.companyId],
      references: [company.id],
    }),
    supplier: one(suppliers, {
      fields: [accountsPayable.supplierId],
      references: [suppliers.id],
    }),
    supplierInvoice: one(supplierInvoices, {
      fields: [accountsPayable.supplierInvoiceId],
      references: [supplierInvoices.id],
    }),
    paymentLines: many(supplierPaymentLines),
    creditNotes: many(supplierCreditNotes),
    debitNotes: many(supplierDebitNotes),
    transactionApplications: many(supplierTransactionApplications),
  }),
);

/* -------------------------------------------------
   ANTICIPOS
-------------------------------------------------- */
export const supplierAdvancesRelations = relations(
  supplierAdvances,
  ({ one }) => ({
    supplier: one(suppliers, {
      fields: [supplierAdvances.supplierId],
      references: [suppliers.id],
    }),
    transaction: one(supplierTransactions, {
      fields: [supplierAdvances.transactionId],
      references: [supplierTransactions.id],
    }),
  }),
);

/* -------------------------------------------------
   NOTAS DE CRÉDITO / DÉBITO
-------------------------------------------------- */
export const supplierCreditNotesRelations = relations(
  supplierCreditNotes,
  ({ one }) => ({
    supplier: one(suppliers, {
      fields: [supplierCreditNotes.supplierId],
      references: [suppliers.id],
    }),
    transaction: one(supplierTransactions, {
      fields: [supplierCreditNotes.transactionId],
      references: [supplierTransactions.id],
    }),
    accountsPayable: one(accountsPayable, {
      fields: [supplierCreditNotes.accountsPayableId],
      references: [accountsPayable.id],
    }),
  }),
);

export const supplierDebitNotesRelations = relations(
  supplierDebitNotes,
  ({ one }) => ({
    supplier: one(suppliers, {
      fields: [supplierDebitNotes.supplierId],
      references: [suppliers.id],
    }),
    transaction: one(supplierTransactions, {
      fields: [supplierDebitNotes.transactionId],
      references: [supplierTransactions.id],
    }),
    accountsPayable: one(accountsPayable, {
      fields: [supplierDebitNotes.accountsPayableId],
      references: [accountsPayable.id],
    }),
  }),
);

/* -------------------------------------------------
   PAGOS
-------------------------------------------------- */
export const supplierPaymentsRelations = relations(
  supplierPayments,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [supplierPayments.supplierId],
      references: [suppliers.id],
    }),
    bankAccount: one(bankAccounts, {
      fields: [supplierPayments.bankAccountId],
      references: [bankAccounts.id],
    }),
    lines: many(supplierPaymentLines),
  }),
);

export const supplierPaymentLinesRelations = relations(
  supplierPaymentLines,
  ({ one }) => ({
    payment: one(supplierPayments, {
      fields: [supplierPaymentLines.supplierPaymentId],
      references: [supplierPayments.id],
    }),
    accountsPayable: one(accountsPayable, {
      fields: [supplierPaymentLines.accountsPayableId],
      references: [accountsPayable.id],
    }),
  }),
);

/* -------------------------------------------------
   TRANSACCIONES (PARENT de NC/ND/ANTICIPOS)
-------------------------------------------------- */
export const supplierTransactionsRelations = relations(
  supplierTransactions,
  ({ one, many }) => ({
    company: one(company, {
      fields: [supplierTransactions.companyId],
      references: [company.id],
    }),
    supplier: one(suppliers, {
      fields: [supplierTransactions.supplierId],
      references: [suppliers.id],
    }),
    bankAccount: one(bankAccounts, {
      fields: [supplierTransactions.bankAccountId],
      references: [bankAccounts.id],
    }),
    advances: many(supplierAdvances),
    creditNotes: many(supplierCreditNotes),
    debitNotes: many(supplierDebitNotes),
    applications: many(supplierTransactionApplications),
  }),
);

export const supplierTransactionApplicationsRelations = relations(
  supplierTransactionApplications,
  ({ one }) => ({
    transaction: one(supplierTransactions, {
      fields: [supplierTransactionApplications.transactionId],
      references: [supplierTransactions.id],
    }),
    accountsPayable: one(accountsPayable, {
      fields: [supplierTransactionApplications.accountsPayableId],
      references: [accountsPayable.id],
    }),
  }),
);

/* -------------------------------------------------
   RELACIONES: accountPlan
-------------------------------------------------- */
export const accountPlanRelations = relations(accountPlan, ({ one, many }) => ({
  company: one(company, {
    fields: [accountPlan.companyId],
    references: [company.id],
  }),
  parent: one(accountPlan, {
    fields: [accountPlan.parentAccountId],
    references: [accountPlan.id],
    relationName: 'subAccounts',
  }),
  subAccounts: many(accountPlan, {
    relationName: 'subAccounts',
  }),
  entryDetails: many(accountingEntryDetails),
}));

/* -------------------------------------------------
   RELACIONES: accountingCycles
-------------------------------------------------- */
export const accountingCyclesRelations = relations(
  accountingCycles,
  ({ one, many }) => ({
    company: one(company, {
      fields: [accountingCycles.companyId],
      references: [company.id],
    }),
    closedByUser: one(users, {
      fields: [accountingCycles.closedByUser_id],
      references: [users.id],
    }),
    entries: many(accountingEntries),
  }),
);

/* -------------------------------------------------
   RELACIONES: accountingEntries
-------------------------------------------------- */
export const accountingEntriesRelations = relations(
  accountingEntries,
  ({ one, many }) => ({
    company: one(company, {
      fields: [accountingEntries.companyId],
      references: [company.id],
    }),
    cycle: one(accountingCycles, {
      fields: [accountingEntries.accountingCycleId],
      references: [accountingCycles.id],
    }),
    details: many(accountingEntryDetails),
  }),
);

/* -------------------------------------------------
   RELACIONES: accountingEntryDetails
-------------------------------------------------- */
export const accountingEntryDetailsRelations = relations(
  accountingEntryDetails,
  ({ one }) => ({
    entry: one(accountingEntries, {
      fields: [accountingEntryDetails.accountingEntryId],
      references: [accountingEntries.id],
    }),
    account: one(accountPlan, {
      fields: [accountingEntryDetails.accountPlanId],
      references: [accountPlan.id],
    }),
  }),
);

/* -------------------------------------------------
   RELACIONES: accountingRules
-------------------------------------------------- */
export const accountingRulesRelations = relations(
  accountingRules,
  ({ many }) => ({
    details: many(accountingRuleDetails),
  }),
);

export const accountingRuleDetailsRelations = relations(
  accountingRuleDetails,
  ({ one }) => ({
    rule: one(accountingRules, {
      fields: [accountingRuleDetails.ruleId],
      references: [accountingRules.id],
    }),
    account: one(accountPlan, {
      fields: [accountingRuleDetails.accountPlanId],
      references: [accountPlan.id],
    }),
  }),
);

/* -------------------------------------------------
   RELACIONES: accountBalances
-------------------------------------------------- */
export const accountBalancesRelations = relations(
  accountBalances,
  ({ one }) => ({
    accountPlan: one(accountPlan, {
      fields: [accountBalances.accountPlanId],
      references: [accountPlan.id],
    }),
    accountingCycle: one(accountingCycles, {
      fields: [accountBalances.accountingCyclesId],
      references: [accountingCycles.id],
    }),
    company: one(company, {
      fields: [accountBalances.companyId],
      references: [company.id],
    }),
  }),
);

/* -------------------------------------------------
   Relaciones de USERS
-------------------------------------------------- */
export const usersRelations = relations(users, ({ many, one }) => ({
  roles: many(usersRole),
  sessions: many(sessions),
  createdBy: one(users, {
    fields: [users.createdById],
    references: [users.id],
    relationName: 'user_created_by',
  }),
  updatedBy: one(users, {
    fields: [users.updatedById],
    references: [users.id],
    relationName: 'user_updated_by',
  }),
}));

/* -------------------------------------------------
   Relaciones de ROLES
-------------------------------------------------- */
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(usersRole),
  permissions: many(rolesPermissions),
}));

/* -------------------------------------------------
   Relaciones de PERMISSIONS
-------------------------------------------------- */
export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolesPermissions),
}));

/* -------------------------------------------------
   Relaciones de ROLES_PERMISSIONS (N:M)
-------------------------------------------------- */
export const rolesPermissionsRelations = relations(
  rolesPermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolesPermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolesPermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

/* -------------------------------------------------
   Relaciones de USER_ROLE (N:M)
-------------------------------------------------- */
export const usersRoleRelations = relations(usersRole, ({ one }) => ({
  user: one(users, {
    fields: [usersRole.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [usersRole.roleId],
    references: [roles.id],
  }),
}));

/* -------------------------------------------------
   Relaciones de SESSIONS
-------------------------------------------------- */
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

/* -------------------------------------------------
   RELACIONES: bankDirectory
-------------------------------------------------- */
export const bankDirectoryRelations = relations(bankDirectory, ({ many }) => ({
  bankAccounts: many(bankAccounts),
}));

/* -------------------------------------------------
   RELACIONES: bankAccounts
-------------------------------------------------- */
export const bankAccountsRelations = relations(
  bankAccounts,
  ({ one, many }) => ({
    company: one(company, {
      fields: [bankAccounts.companyId],
      references: [company.id],
    }),
    bankDirectory: one(bankDirectory, {
      fields: [bankAccounts.bankDirectoryId],
      references: [bankDirectory.id],
    }),
    linkedChartAccount: one(accountPlan, {
      fields: [bankAccounts.linkedChartAccountId],
      references: [accountPlan.id],
    }),
    transactions: many(bankTransactions),
    reconciliations: many(bankReconciliations),
  }),
);

/* -------------------------------------------------
   RELACIONES: bankTransactions
-------------------------------------------------- */
export const bankTransactionsRelations = relations(
  bankTransactions,
  ({ one, many }) => ({
    bankAccount: one(bankAccounts, {
      fields: [bankTransactions.bankAccountId],
      references: [bankAccounts.id],
    }),
    categoryRule: one(bankCategoryRule, {
      fields: [bankTransactions.category],
      references: [bankCategoryRule.id],
    }),
    reconciliation: one(bankReconciliations, {
      fields: [bankTransactions.bankReconciliationId],
      references: [bankReconciliations.id],
    }),
    internalLink: one(internalTransactionBankLinks, {
      fields: [bankTransactions.id],
      references: [internalTransactionBankLinks.bankTransactionId],
    }),
  }),
);

/* -------------------------------------------------
   RELACIONES: internalTransactionBankLinks
-------------------------------------------------- */
export const internalTransactionBankLinksRelations = relations(
  internalTransactionBankLinks,
  ({ one }) => ({
    bankTransaction: one(bankTransactions, {
      fields: [internalTransactionBankLinks.bankTransactionId],
      references: [bankTransactions.id],
    }),
    linkedByUser: one(users, {
      fields: [internalTransactionBankLinks.linkedBy],
      references: [users.id],
    }),
  }),
);

/* -------------------------------------------------
   RELACIONES: bankCategoryRule
-------------------------------------------------- */
export const bankCategoryRuleRelations = relations(
  bankCategoryRule,
  ({ one, many }) => ({
    defaultDebitAccount: one(accountPlan, {
      fields: [bankCategoryRule.defaultDebitAccountId],
      references: [accountPlan.id],
      relationName: 'debitRuleAccount',
    }),
    defaultCreditAccount: one(accountPlan, {
      fields: [bankCategoryRule.defaultCreditAccountId],
      references: [accountPlan.id],
      relationName: 'creditRuleAccount',
    }),
    transactions: many(bankTransactions),
  }),
);

/* -------------------------------------------------
   RELACIONES: bankReconciliations
-------------------------------------------------- */
export const bankReconciliationsRelations = relations(
  bankReconciliations,
  ({ one, many }) => ({
    bankAccount: one(bankAccounts, {
      fields: [bankReconciliations.bankAccountId],
      references: [bankAccounts.id],
    }),
    preparedByUser: one(users, {
      fields: [bankReconciliations.preparedByUserId],
      references: [users.id],
      relationName: 'preparedByUser',
    }),
    reviewedByUser: one(users, {
      fields: [bankReconciliations.reviewedByUserId],
      references: [users.id],
      relationName: 'reviewedByUser',
    }),
    details: many(bankReconciliationDetails),
    transactions: many(bankTransactions),
  }),
);

/* -------------------------------------------------
   RELACIONES: bankReconciliationDetails
-------------------------------------------------- */
export const bankReconciliationDetailsRelations = relations(
  bankReconciliationDetails,
  ({ one }) => ({
    reconciliation: one(bankReconciliations, {
      fields: [bankReconciliationDetails.bankReconciliationId],
      references: [bankReconciliations.id],
    }),
    bankTransaction: one(bankTransactions, {
      fields: [bankReconciliationDetails.bankTransactionId],
      references: [bankTransactions.id],
    }),
    accountingEntryDetail: one(accountingEntryDetails, {
      fields: [bankReconciliationDetails.accountingEntryDetailId],
      references: [accountingEntryDetails.id],
    }),
    adjustmentEntry: one(accountingEntries, {
      fields: [bankReconciliationDetails.adjustmentEntryId],
      references: [accountingEntries.id],
    }),
  }),
);

/* -------------------------------------------------
   RELACIONES: company
-------------------------------------------------- */
export const companyRelations = relations(company, ({ many }) => ({
  systemSettings: many(systemSettings),
  currencies: many(currencies),
  exchangeRates: many(exchangeRates),
  categoryTypes: many(categoryType),
  typePayrolls: many(typePayrolls),
  states: many(states),
  municipalities: many(municipalities),
  parishes: many(parishes),
  localities: many(localities),
  accountPlans: many(accountPlan),
}));

/* -------------------------------------------------
   RELACIONES: systemSettings
-------------------------------------------------- */
// export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
//   company: one(company, {
//     fields: [systemSettings.companyId],
//     references: [company.id],
//   }),
// }));

/* -------------------------------------------------
   RELACIONES: currencies
-------------------------------------------------- */
export const currenciesRelations = relations(currencies, ({ many }) => ({
  exchangeRatesFrom: many(exchangeRates, {
    relationName: 'fromCurrency',
  }),
  exchangeRatesTo: many(exchangeRates, {
    relationName: 'toCurrency',
  }),
}));

/* -------------------------------------------------
   RELACIONES: exchangeRates
-------------------------------------------------- */
export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  fromCurrency: one(currencies, {
    fields: [exchangeRates.fromCurrencyCode],
    references: [currencies.code],
    relationName: 'fromCurrency',
  }),
  toCurrency: one(currencies, {
    fields: [exchangeRates.toCurrencyCode],
    references: [currencies.code],
    relationName: 'toCurrency',
  }),
}));

/* -------------------------------------------------
   RELACIONES: categoryType
-------------------------------------------------- */
// export const categoryTypeRelations = relations(categoryType, ({ one }) => ({
//   company: one(company, {
//     fields: [categoryType.companyId],
//     references: [company.id],
//   }),
// }));

/* -------------------------------------------------
   RELACIONES: typePayrolls
-------------------------------------------------- */
export const typePayrollsRelations = relations(typePayrolls, ({ one }) => ({
  // company: one(company, {
  //   fields: [typePayrolls.companyId],
  //   references: [company.id],
  // }),
  associatedAccount: one(accountPlan, {
    fields: [typePayrolls.associatedAccount],
    references: [accountPlan.id],
    relationName: 'associatedAccountPlan',
  }),
  employerAccount: one(accountPlan, {
    fields: [typePayrolls.employerAccount],
    references: [accountPlan.id],
    relationName: 'employerAccountPlan',
  }),
  loanAccount: one(accountPlan, {
    fields: [typePayrolls.loanAccount],
    references: [accountPlan.id],
    relationName: 'loanAccountPlan',
  }),
}));

/* -------------------------------------------------
   RELACIONES: states
-------------------------------------------------- */
export const statesRelations = relations(states, ({ many }) => ({
  municipalities: many(municipalities),
  localities: many(localities),
}));

/* -------------------------------------------------
   RELACIONES: municipalities
-------------------------------------------------- */
export const municipalitiesRelations = relations(
  municipalities,
  ({ one, many }) => ({
    state: one(states, {
      fields: [municipalities.stateId],
      references: [states.id],
    }),
    parishes: many(parishes),
    localities: many(localities),
  }),
);

/* -------------------------------------------------
   RELACIONES: parishes
-------------------------------------------------- */
export const parishesRelations = relations(parishes, ({ one, many }) => ({
  municipality: one(municipalities, {
    fields: [parishes.municipalityId],
    references: [municipalities.id],
  }),
  localities: many(localities),
}));

/* -------------------------------------------------
   RELACIONES: localities
-------------------------------------------------- */
export const localitiesRelations = relations(localities, ({ one }) => ({
  state: one(states, {
    fields: [localities.stateId],
    references: [states.id],
  }),
  municipality: one(municipalities, {
    fields: [localities.municipalityId],
    references: [municipalities.id],
  }),
  parish: one(parishes, {
    fields: [localities.parishId],
    references: [parishes.id],
  }),
}));

/* -------------------------------------------------
   ASOCIADOS
-------------------------------------------------- */
export const associatesRelations = relations(associates, ({ one, many }) => ({
  company: one(company, {
    fields: [associates.companyId],
    references: [company.id],
  }),
  locality: one(states, {
    fields: [associates.localityId],
    references: [states.id],
  }),
  payrollType: one(typePayrolls, {
    fields: [associates.payrollTypeId],
    references: [typePayrolls.id],
  }),
  associatedType: one(categoryType, {
    fields: [associates.associatedTypeId],
    references: [categoryType.id],
  }),
  accounts: many(associateAccounts),
  loans: many(loans),
  credits: many(credits),
  liquidations: many(liquidationsAssociates),
}));

/* -------------------------------------------------
   CUENTAS DE ASOCIADO
-------------------------------------------------- */
export const associateAccountsRelations = relations(
  associateAccounts,
  ({ one, many }) => ({
    associate: one(associates, {
      fields: [associateAccounts.associateId],
      references: [associates.id],
    }),
    bank: one(bankDirectory, {
      fields: [associateAccounts.bankDirectoryId],
      references: [bankDirectory.id],
    }),
    movements: many(associateAccountMovements),
    balanceHistory: many(associateAccountBalanceHistory),
    withdrawals: many(withdrawalsAssociates),
    loanDisbursements: many(loans),
  }),
);

/* -------------------------------------------------
   MOVIMIENTOS DE CUENTA
-------------------------------------------------- */
export const associateAccountMovementsRelations = relations(
  associateAccountMovements,
  ({ one, many }) => ({
    account: one(associateAccounts, {
      fields: [associateAccountMovements.associateAccountId],
      references: [associateAccounts.id],
    }),
    exchangeRate: one(exchangeRates, {
      fields: [associateAccountMovements.exchangeRateId],
      references: [exchangeRates.id],
    }),
    balanceHistory: many(associateAccountBalanceHistory),
  }),
);

/* -------------------------------------------------
   HISTORIAL DE SALDOS
-------------------------------------------------- */
export const associateAccountBalanceHistoryRelations = relations(
  associateAccountBalanceHistory,
  ({ one }) => ({
    account: one(associateAccounts, {
      fields: [associateAccountBalanceHistory.associateAccountId],
      references: [associateAccounts.id],
    }),
    movement: one(associateAccountMovements, {
      fields: [associateAccountBalanceHistory.movementId],
      references: [associateAccountMovements.id],
    }),
  }),
);

/* -------------------------------------------------
   TIPOS DE RETIRO
-------------------------------------------------- */
export const withdrawalTypesRelations = relations(
  withdrawalTypes,
  ({ one, many }) => ({
    debitAccount: one(accountPlan, {
      fields: [withdrawalTypes.accountDebit],
      references: [accountPlan.id],
      relationName: 'withdrawalDebitAccount',
    }),
    expenseAccount: one(accountPlan, {
      fields: [withdrawalTypes.expenseAccount],
      references: [accountPlan.id],
      relationName: 'withdrawalExpenseAccount',
    }),
    frequencyCategory: one(categoryType, {
      fields: [withdrawalTypes.withdrawalFrequencyRelation],
      references: [categoryType.id],
    }),
    withdrawals: many(withdrawalsAssociates),
  }),
);

/* -------------------------------------------------
   RETIROS DE ASOCIADOS
-------------------------------------------------- */
export const withdrawalsAssociatesRelations = relations(
  withdrawalsAssociates,
  ({ one }) => ({
    account: one(associateAccounts, {
      fields: [withdrawalsAssociates.associateAccountId],
      references: [associateAccounts.id],
    }),
    withdrawalType: one(withdrawalTypes, {
      fields: [withdrawalsAssociates.withdrawalTypeId],
      references: [withdrawalTypes.id],
    }),
    commercialHouse: one(suppliers, {
      fields: [withdrawalsAssociates.commercialHouseId],
      references: [suppliers.id],
    }),
  }),
);

/* -------------------------------------------------
   TIPOS DE PRÉSTAMO
-------------------------------------------------- */
export const loanTypesRelations = relations(loanTypes, ({ one, many }) => ({
  loanAccount: one(accountPlan, {
    fields: [loanTypes.loanAccountChartId],
    references: [accountPlan.id],
    relationName: 'loanTypeLoanAccount',
  }),
  interestAccount: one(accountPlan, {
    fields: [loanTypes.interestEarnedAccountChartId],
    references: [accountPlan.id],
    relationName: 'loanTypeInterestAccount',
  }),
  specialQuotaAccount: one(accountPlan, {
    fields: [loanTypes.specialQuotaAccountChartId],
    references: [accountPlan.id],
    relationName: 'loanTypeSpecialQuotaAccount',
  }),
  expenseAccount: one(accountPlan, {
    fields: [loanTypes.expenseAccountChartId],
    references: [accountPlan.id],
    relationName: 'loanTypeExpenseAccount',
  }),
  payrollType: one(categoryType, {
    fields: [loanTypes.payrollTypeId],
    references: [categoryType.id],
  }),
  loans: many(loans),
}));

/* -------------------------------------------------
   PRÉSTAMOS
-------------------------------------------------- */
export const loansRelations = relations(loans, ({ one, many }) => ({
  associate: one(associates, {
    fields: [loans.associateId],
    references: [associates.id],
  }),
  company: one(company, {
    fields: [loans.companyId],
    references: [company.id],
  }),
  loanType: one(loanTypes, {
    fields: [loans.loanTypeId],
    references: [loanTypes.id],
  }),
  previousLoan: one(loans, {
    fields: [loans.previousLoanId],
    references: [loans.id],
    relationName: 'previousLoanRelation',
  }),
  disbursementAccount: one(associateAccounts, {
    fields: [loans.disbursementAccountId],
    references: [associateAccounts.id],
  }),
  approvedByUser: one(users, {
    fields: [loans.approvedByUserId],
    references: [users.id],
    relationName: 'loanApprovedByUser',
  }),
  disbursedByUser: one(users, {
    fields: [loans.disbursedByUserId],
    references: [users.id],
    relationName: 'loanDisbursedByUser',
  }),
  exchangeRate: one(exchangeRates, {
    fields: [loans.exchangeRateId],
    references: [exchangeRates.id],
  }),
  amortizationSchedule: many(loanAmortizationSchedule),
  statusHistory: many(loanStatusHistory),
  payments: many(loanPayments),
}));

/* -------------------------------------------------
   AMORTIZACIÓN DE PRÉSTAMO
-------------------------------------------------- */
export const loanAmortizationScheduleRelations = relations(
  loanAmortizationSchedule,
  ({ one, many }) => ({
    loan: one(loans, {
      fields: [loanAmortizationSchedule.loanId],
      references: [loans.id],
    }),
    paymentDetails: many(loanPaymentsDetails),
  }),
);

/* -------------------------------------------------
   HISTORIAL DE ESTADO DE PRÉSTAMO
-------------------------------------------------- */
export const loanStatusHistoryRelations = relations(
  loanStatusHistory,
  ({ one }) => ({
    loan: one(loans, {
      fields: [loanStatusHistory.loanId],
      references: [loans.id],
    }),
    changedByUser: one(users, {
      fields: [loanStatusHistory.changedByUserId],
      references: [users.id],
    }),
  }),
);

/* -------------------------------------------------
   PAGOS DE PRÉSTAMO
-------------------------------------------------- */
export const loanPaymentsRelations = relations(
  loanPayments,
  ({ one, many }) => ({
    loan: one(loans, {
      fields: [loanPayments.loanId],
      references: [loans.id],
    }),
    bank: one(bankDirectory, {
      fields: [loanPayments.bankId],
      references: [bankDirectory.id],
    }),
    details: many(loanPaymentsDetails),
  }),
);

export const loanPaymentsDetailsRelations = relations(
  loanPaymentsDetails,
  ({ one }) => ({
    payment: one(loanPayments, {
      fields: [loanPaymentsDetails.loanPaymentId],
      references: [loanPayments.id],
    }),
    installment: one(loanAmortizationSchedule, {
      fields: [loanPaymentsDetails.installmentId],
      references: [loanAmortizationSchedule.id],
    }),
  }),
);

/* -------------------------------------------------
   TIPOS DE CRÉDITO
-------------------------------------------------- */
export const creditsTypesRelations = relations(
  creditsTypes,
  ({ one, many }) => ({
    creditAccount: one(accountPlan, {
      fields: [creditsTypes.creditAccountChartId],
      references: [accountPlan.id],
      relationName: 'creditTypeCreditAccount',
    }),
    interestAccount: one(accountPlan, {
      fields: [creditsTypes.interestEarnedAccountChartId],
      references: [accountPlan.id],
      relationName: 'creditTypeInterestAccount',
    }),
    specialQuotaAccount: one(accountPlan, {
      fields: [creditsTypes.specialQuotaAccountChartId],
      references: [accountPlan.id],
      relationName: 'creditTypeSpecialQuotaAccount',
    }),
    expenseAccount: one(accountPlan, {
      fields: [creditsTypes.expenseAccountChartId],
      references: [accountPlan.id],
      relationName: 'creditTypeExpenseAccount',
    }),
    payrollType: one(categoryType, {
      fields: [creditsTypes.payrollTypeId],
      references: [categoryType.id],
    }),
    credits: many(credits),
  }),
);

/* -------------------------------------------------
   CRÉDITOS
-------------------------------------------------- */
export const creditsRelations = relations(credits, ({ one, many }) => ({
  associate: one(associates, {
    fields: [credits.associateId],
    references: [associates.id],
  }),
  company: one(company, {
    fields: [credits.companyId],
    references: [company.id],
  }),
  creditType: one(creditsTypes, {
    fields: [credits.creditTypeId],
    references: [creditsTypes.id],
  }),
  previousCredit: one(credits, {
    fields: [credits.previousCreditId],
    references: [credits.id],
    relationName: 'previousCreditRelation',
  }),
  approvedByUser: one(users, {
    fields: [credits.approvedByUserId],
    references: [users.id],
    relationName: 'creditApprovedByUser',
  }),
  exchangeRate: one(exchangeRates, {
    fields: [credits.exchangeRateId],
    references: [exchangeRates.id],
  }),
  amortizationSchedule: many(creditAmortizationSchedule),
  statusHistory: many(creditStatusHistory),
  payments: many(creditPayments),
  itemSales: many(creditItemSales),
}));

/* -------------------------------------------------
   AMORTIZACIÓN DE CRÉDITO
-------------------------------------------------- */
export const creditAmortizationScheduleRelations = relations(
  creditAmortizationSchedule,
  ({ one, many }) => ({
    credit: one(credits, {
      fields: [creditAmortizationSchedule.creditId],
      references: [credits.id],
    }),
    paymentDetails: many(creditPaymentsDetails),
  }),
);

/* -------------------------------------------------
   HISTORIAL DE ESTADO DE CRÉDITO
-------------------------------------------------- */
export const creditStatusHistoryRelations = relations(
  creditStatusHistory,
  ({ one }) => ({
    credit: one(credits, {
      fields: [creditStatusHistory.creditId],
      references: [credits.id],
    }),
    changedByUser: one(users, {
      fields: [creditStatusHistory.changedByUserId],
      references: [users.id],
    }),
  }),
);

/* -------------------------------------------------
   PAGOS DE CRÉDITO
-------------------------------------------------- */
export const creditPaymentsRelations = relations(
  creditPayments,
  ({ one, many }) => ({
    credit: one(credits, {
      fields: [creditPayments.creditId],
      references: [credits.id],
    }),
    bank: one(bankDirectory, {
      fields: [creditPayments.bankId],
      references: [bankDirectory.id],
    }),
    details: many(creditPaymentsDetails),
  }),
);

export const creditPaymentsDetailsRelations = relations(
  creditPaymentsDetails,
  ({ one }) => ({
    payment: one(creditPayments, {
      fields: [creditPaymentsDetails.creditPaymentId],
      references: [creditPayments.id],
    }),
    installment: one(creditAmortizationSchedule, {
      fields: [creditPaymentsDetails.installmentId],
      references: [creditAmortizationSchedule.id],
    }),
  }),
);

/* -------------------------------------------------
   LIQUIDACIONES
-------------------------------------------------- */
export const liquidationsAssociatesRelations = relations(
  liquidationsAssociates,
  ({ one }) => ({
    associate: one(associates, {
      fields: [liquidationsAssociates.associateId],
      references: [associates.id],
    }),
  }),
);

/* -------------------------------------------------
   VENTAS DE ÍTEMS EN CRÉDITO
-------------------------------------------------- */
export const creditItemSalesRelations = relations(
  creditItemSales,
  ({ one }) => ({
    credit: one(credits, {
      fields: [creditItemSales.creditId],
      references: [credits.id],
    }),
    days: one(categoryType, {
      fields: [creditItemSales.days],
      references: [categoryType.id],
    }),
  }),
);

/* -------------------------------------------------
   LOTES DE PAGO (BATCH)
-------------------------------------------------- */
export const paymentBatchesRelations = relations(
  paymentBatches,
  ({ one, many }) => ({
    company: one(company, {
      fields: [paymentBatches.companyId],
      references: [company.id],
    }),
    bank: one(bankDirectory, {
      fields: [paymentBatches.bankId],
      references: [bankDirectory.id],
    }),
    items: many(paymentBatchItems),
  }),
);

export const paymentBatchItemsRelations = relations(
  paymentBatchItems,
  ({ one }) => ({
    batch: one(paymentBatches, {
      fields: [paymentBatchItems.paymentBatchId],
      references: [paymentBatches.id],
    }),
    associateAccount: one(associateAccounts, {
      fields: [paymentBatchItems.associateAccountId],
      references: [associateAccounts.id],
    }),
  }),
);
