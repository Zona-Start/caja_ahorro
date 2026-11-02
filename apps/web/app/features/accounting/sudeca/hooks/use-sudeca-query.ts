import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type {
  SudecaReportType,
  SudecaResponse,
} from '../schemas/sudeca.schema';
import { sudecaService } from '../services/sudeca-service';

export function useSudecaReport(
  type: SudecaReportType,
  params: { accountingCycleId: string; quarter: number },
): UseQueryResult<SudecaResponse> {
  return useQuery({
    queryKey: ['sudeca', type, params],
    queryFn: () => sudecaService.getData(type, params),
    enabled: !!params.accountingCycleId && !!params.quarter,
  });
}
