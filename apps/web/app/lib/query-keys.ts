import { accountingAccountsKeys } from '@/features/accounting/accounting-accounts/keys/accounting-accounts-keys';
import { accountingBalancesKeys } from '@/features/accounting/accounting-balances/keys/accounting-balances-keys';
import { accountingCyclesKeys } from '@/features/accounting/accounting-cycles/keys/accounting-cycles-keys';
import { accountingEntriesKeys } from '@/features/accounting/accounting-entries/keys/accounting-entries-keys';
import { accountingReportsKeys } from '@/features/accounting/accounting-reports/keys/accounting-reports-keys';
import { accountingRulesKeys } from '@/features/accounting/accounting-rules/keys/accounting-rules-keys';
import { CURRENCIES_KEYS as currenciesKeys } from '@/features/core/currencies/keys/currencies-keys';
import { PERMISSIONS_KEYS as permissionsKeys } from '@/features/core/permissions/keys/permissions-keys';
import { ROLES_KEYS as rolesKeys } from '@/features/core/roles/keys/roles-keys';
import { GLOBAL_SETTINGS_KEYS as globalSettingsKeys } from '@/features/core/settings/global/keys/global-settings-keys';
import { MODULE_SETTINGS_KEYS as moduleSettingsKeys } from '@/features/core/settings/module/keys/module-settings-keys';
import { TENANT_SETTINGS_KEYS as tenantSettingsKeys } from '@/features/core/settings/tenant/keys/tenant-settings-keys';
import { TENANTS_KEYS as tenantsKeys } from '@/features/core/tenants/keys/tenants-keys';
import { USERS_KEYS as usersKeys } from '@/features/core/users/keys/users-keys';

import { bankAccountKeys } from '@/features/banks/bank-account/keys/bank-account-keys';
import { bankDirectoryKeys } from '@/features/banks/bank-directory/keys/bank-directory-keys';
import { bankMovementsKeys } from '@/features/banks/bank-movements/keys/bank-movements-keys';
import { CATEGORIES_KEYS as coreCategoriesKeys } from '@/features/core/categories/keys/categories-keys';
import { statesKeys } from '@/features/core/states/keys/states.keys';
import { CATEGORIES_KEYS as inventoryCategoriesKeys } from '@/features/inventory/categories/keys/categories-keys';
import { inventoryFixedAssetsKeys } from '@/features/inventory/fixed-assets/keys/inventory-fixed-assets-keys';
import { inventoryMovementsKeys } from '@/features/inventory/movements/keys/movements-keys';
import { productsKeys } from '@/features/inventory/products/keys/products-keys';
import { inventoryServicesKeys } from '@/features/inventory/services/keys/inventory-services-keys';
import { accountsPayableKeys } from '@/features/purchasing/accounts-payable/keys/accounts-payable-keys';
import { purchaseOrdersKeys } from '@/features/purchasing/purchase-orders/keys/purchase-orders-keys';
import { SUPPLIER_INVOICES_KEYS as supplierInvoicesKeys } from '@/features/purchasing/supplier-invoices/keys/supplier-invoices-keys';
import { SUPPLIER_PAYMENTS_KEYS as supplierPaymentsKeys } from '@/features/purchasing/supplier-payments/keys/supplier-payments-keys';
import { SUPPLIERS_KEYS as suppliersKeys } from '@/features/purchasing/suppliers/keys/suppliers-keys';
import { individualLoadKeys } from '@/features/savings/assets/individual-load/keys/individual-load-keys';
import { paymentBatchKeys } from '@/features/savings/assets/payment-batch/keys/payment-batch-keys';
import { creditManagementKeys } from '@/features/savings/credits/credits-management/keys/credits-management-keys';
import { creditsPaidKeys } from '@/features/savings/credits/credits-paid/keys/credits-paid-keys';
import { loansManagementKeys } from '@/features/savings/loans/loans-management/keys/loans-management-keys';
import { loansPaidKeys } from '@/features/savings/loans/loans-paid/keys/loans-paid-keys';
import { associatesKeys } from '@/features/savings/partners/associates/keys/associates-keys';
import { inquiryKeys } from '@/features/savings/partners/inquiry/keys/inquiry-keys';
import { settlementKeys } from '@/features/savings/settlement/keys/settlement-keys';
import { WITHDRAWAL_TYPES_KEYS as withdrawalTypesKeys } from '@/features/savings/withdrawals/withdrawal-types/keys/withdrawal-types-keys';
import { withdrawalKeys } from '@/features/savings/withdrawals/withdrawal/keys/withdrawal-keys';

export const QUERY_KEYS = {
  tenants: tenantsKeys,
  users: usersKeys,
  roles: rolesKeys,
  permissions: permissionsKeys,
  globalSettings: globalSettingsKeys,
  moduleSettings: moduleSettingsKeys,
  tenantSettings: tenantSettingsKeys,
  currencies: currenciesKeys,
  accountingAccounts: accountingAccountsKeys,
  accountingBalances: accountingBalancesKeys,
  accountingCycles: accountingCyclesKeys,
  accountingEntries: accountingEntriesKeys,
  accountingReports: accountingReportsKeys,
  accountingRules: accountingRulesKeys,
  associates: associatesKeys,
  inquiry: inquiryKeys,
  withdrawalTypes: withdrawalTypesKeys,
  withdrawals: withdrawalKeys,
  individualLoad: individualLoadKeys,
  settlements: settlementKeys,
  paymentBatches: paymentBatchKeys,
  creditsPaid: creditsPaidKeys,
  creditManagements: creditManagementKeys,
  loansManagement: loansManagementKeys,
  loansPaid: loansPaidKeys,
  bankAccounts: bankAccountKeys,
  bankDirectory: bankDirectoryKeys,
  bankMovements: bankMovementsKeys,
  coreCategories: coreCategoriesKeys,
  inventoryCategories: inventoryCategoriesKeys,
  products: productsKeys,
  inventoryMovements: inventoryMovementsKeys,
  inventoryServices: inventoryServicesKeys,
  accountsPayable: accountsPayableKeys,
  inventoryFixedAssets: inventoryFixedAssetsKeys,
  suppliers: suppliersKeys,
  purchaseOrders: purchaseOrdersKeys,
  supplierInvoices: supplierInvoicesKeys,
  supplierPayments: supplierPaymentsKeys,
  states: statesKeys,
} as const;
