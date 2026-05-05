import { type QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingBalancesService } from '../services/accounting-balances-service';
import { accountingBalancesFilterSchema } from '../hooks/use-accounting-balances-filters';

export const accountingBalancesLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const filters = accountingBalancesFilterSchema.parse(
      Object.fromEntries(url.searchParams)
    );

    await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.accountingBalances.list(filters),
      queryFn: () => AccountingBalancesService.getPaginated(filters),
    });

    return null;
  };
