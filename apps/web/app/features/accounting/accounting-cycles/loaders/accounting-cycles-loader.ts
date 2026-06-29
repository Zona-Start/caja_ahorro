import { type QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingCyclesService } from '../services/accounting-cycles-service';
import { accountingCyclesFilterSchema } from '../hooks/use-accounting-cycles-filters';

export const accountingCyclesLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const filters = accountingCyclesFilterSchema.parse(
      Object.fromEntries(url.searchParams),
    );

    await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.accountingCycles.list(filters),
      queryFn: () => AccountingCyclesService.getPaginated(filters),
    });

    return null;
  };
