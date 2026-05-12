import { QueryClient } from '@tanstack/react-query';
import { accountingRulesKeys } from '../keys/accounting-rules-keys';
import { AccountingRulesService } from '../services/accounting-rules-service';

export const accountingRulesListLoader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData({
    queryKey: accountingRulesKeys.list({ page: 1, limit: 10, search: '' }),
    queryFn: () => AccountingRulesService.getPaginated({ page: 1, limit: 10, search: '' }),
  });
  return null;
};
