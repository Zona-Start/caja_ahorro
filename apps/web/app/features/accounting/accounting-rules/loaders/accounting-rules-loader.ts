import { QueryClient } from '@tanstack/react-query';
import { accountingRulesKeys } from '@/features/accounting/accounting-rules/keys/accounting-rules-keys';
import { AccountingRulesService } from '@/features/accounting/accounting-rules/services/accounting-rules-service';
import { accountingAccountsKeys } from '@/features/accounting/accounting-accounts/keys/accounting-accounts-keys';
import { AccountingAccountsService } from '@/features/accounting/accounting-accounts/services/accounting-accounts-service';

export const accountingRulesLoader =
  (queryClient: QueryClient) => async () => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: accountingAccountsKeys.lists(),
        queryFn: () => AccountingAccountsService.getAll(),
      }),
      queryClient.ensureQueryData({
        queryKey: [...accountingRulesKeys.all, 'all'] as const,
        queryFn: () => AccountingRulesService.getAll(),
      }),
    ]);
    return null;
  };
