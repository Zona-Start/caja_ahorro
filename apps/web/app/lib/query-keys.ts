import { accountingAccountsKeys } from '@/features/accounting/accounting-accounts/keys/accounting-accounts-keys';
import { accountingBalancesKeys } from '@/features/accounting/accounting-balances/keys/accounting-balances-keys';
import { accountingCyclesKeys } from '@/features/accounting/accounting-cycles/keys/accounting-cycles-keys';
import { accountingEntriesKeys } from '@/features/accounting/accounting-entries/keys/accounting-entries-keys';
import { accountingReportsKeys } from '@/features/accounting/accounting-reports/keys/accounting-reports-keys';
import { accountingRulesKeys } from '@/features/accounting/accounting-rules/keys/accounting-rules-keys';
import { TENANTS_KEYS as tenantsKeys } from '@/features/core/tenants/keys/tenants-keys';
import { USERS_KEYS as usersKeys } from '@/features/core/users/keys/users-keys';
import { ROLES_KEYS as rolesKeys } from '@/features/core/roles/keys/roles-keys';
import { PERMISSIONS_KEYS as permissionsKeys } from '@/features/core/permissions/keys/permissions-keys';
import { GLOBAL_SETTINGS_KEYS as globalSettingsKeys } from '@/features/core/settings/global/keys/global-settings-keys';
import { MODULE_SETTINGS_KEYS as moduleSettingsKeys } from '@/features/core/settings/module/keys/module-settings-keys';
import { TENANT_SETTINGS_KEYS as tenantSettingsKeys } from '@/features/core/settings/tenant/keys/tenant-settings-keys';
import { CURRENCIES_KEYS as currenciesKeys } from '@/features/core/currencies/keys/currencies-keys';

import { individualLoadKeys } from '@/features/savings/assets/individual-load/keys/individual-load-keys';
import { paymentBatchKeys } from '@/features/savings/assets/payment-batch/keys/payment-batch-keys';
import { settlementKeys } from '@/features/savings/assets/settlement/keys/settlement-keys';
import { withdrawalTypesKeys } from '@/features/savings/assets/withdrawal-types/keys/withdrawal-types-keys';
import { withdrawalKeys } from '@/features/savings/assets/withdrawal/keys/withdrawal-keys';
import { associatesKeys } from '@/features/savings/partners/associates/keys/associates-keys';
import { inquiryKeys } from '@/features/savings/partners/inquiry/keys/inquiry-keys';

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
} as const;
