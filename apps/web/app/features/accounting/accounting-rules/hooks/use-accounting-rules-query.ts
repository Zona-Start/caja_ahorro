import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { AccountingRule } from '../schemas/accounting-rule.schema';
import { AccountingRulesService } from '../services/accounting-rules-service';

export function useAccountingRules(params: any): UseQueryResult<{
  data: AccountingRule[];
  meta: any;
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
