import { accountingAccountsKeys } from '@/features/accounting/accounting-accounts/keys/accounting-accounts-keys';
import { accountingBalancesKeys } from '@/features/accounting/accounting-balances/keys/accounting-balances-keys';
import { accountingCyclesKeys } from '@/features/accounting/accounting-cycles/keys/accounting-cycles-keys';
import { accountingEntriesKeys } from '@/features/accounting/accounting-entries/keys/accounting-entries-keys';
import { accountingReportsKeys } from '@/features/accounting/accounting-reports/keys/accounting-reports-keys';
import { accountingRulesKeys } from '@/features/accounting/accounting-rules/keys/accounting-rules-keys';

import { associatesKeys } from '@/features/savings/partners/associates/keys/associates-keys';
import { inquiryKeys } from '@/features/savings/partners/inquiry/keys/inquiry-keys';
import { withdrawalTypesKeys } from '@/features/savings/assets/withdrawal-types/keys/withdrawal-types-keys';
import { withdrawalKeys } from '@/features/savings/assets/withdrawal/keys/withdrawal-keys';
import { individualLoadKeys } from '@/features/savings/assets/individual-load/keys/individual-load-keys';
import { settlementKeys } from '@/features/savings/assets/settlement/keys/settlement-keys';
import { paymentBatchKeys } from '@/features/savings/assets/payment-batch/keys/payment-batch-keys';

export const QUERY_KEYS = {
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
