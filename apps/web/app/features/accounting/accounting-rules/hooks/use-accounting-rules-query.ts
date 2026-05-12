import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { AccountingRule } from '../schemas/accounting-rule.schema';
import { AccountingRulesService } from '../services/accounting-rules-service';

type PaginationMeta = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
};

export function useAccountingRules(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): UseQueryResult<{
  data: AccountingRule[];
  meta: PaginationMeta;
}> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingRules.lists(),
    queryFn: () => AccountingRulesService.getPaginated(params),
    enabled: !!params,
  });
}

export function useAccountingRule(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.accountingRules.detail(id.toString()),
    queryFn: () => AccountingRulesService.getById(id),
    enabled: !!id,
  });
}
