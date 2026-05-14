import { accountingRulesKeys } from '@/features/accounting/accounting-rules/keys/accounting-rules-keys';
import { useQuery } from '@tanstack/react-query';
import { AccountingRulesService } from '../services/accounting-rules-service';

export function useAllAccountingRules() {
  return useQuery({
    queryKey: [...accountingRulesKeys.all, 'all'] as const,
    queryFn: () => AccountingRulesService.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}
