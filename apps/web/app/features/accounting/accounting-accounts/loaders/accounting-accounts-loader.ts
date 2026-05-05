import { type QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingAccountsService } from '../services/accounting-accounts-service';
import { accountingAccountsFilterSchema } from '../hooks/use-accounting-accounts-filters';

export const accountingAccountsLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const filters = accountingAccountsFilterSchema.parse(
      Object.fromEntries(url.searchParams)
    );

    await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.accountingAccounts.list(filters),
      queryFn: () => AccountingAccountsService.getPaginated(filters),
    });

    return null;
  };
