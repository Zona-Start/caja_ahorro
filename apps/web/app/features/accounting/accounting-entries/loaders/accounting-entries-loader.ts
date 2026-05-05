import { type QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingEntriesService } from '../services/accounting-entries-service';
import { accountingEntriesFilterSchema } from '../hooks/use-accounting-entries-filters';

export const accountingEntriesLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const filters = accountingEntriesFilterSchema.parse(
      Object.fromEntries(url.searchParams)
    );

    await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.accountingEntries.list(filters),
      queryFn: () => AccountingEntriesService.getPaginated(filters),
    });

    return null;
  };
