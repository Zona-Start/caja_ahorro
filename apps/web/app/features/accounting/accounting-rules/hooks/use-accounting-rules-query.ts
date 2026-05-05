import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingRulesService } from '../services/accounting-rules-service';

export function useAccountingRules(companyId: number = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.accountingRules.lists(),
    queryFn: () => AccountingRulesService.getAll(companyId),
    enabled: !!companyId,
  });
}

export function useAccountingRule(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.accountingRules.detail(id.toString()),
    queryFn: () => AccountingRulesService.getById(id),
    enabled: !!id,
  });
}
