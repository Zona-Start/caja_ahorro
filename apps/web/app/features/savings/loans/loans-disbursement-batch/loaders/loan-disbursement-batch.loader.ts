import { type ClientLoaderFunctionArgs } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { loanDisbursementBatchService } from '../services/loan-disbursement-batch-service';

export const loanDisbursementBatchLoader =
  (queryClient: QueryClient) =>
  async ({ request }: ClientLoaderFunctionArgs) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const status = url.searchParams.get('status') || '';
    const search = url.searchParams.get('search') || '';
    
    const filters = { page, limit, status, search };

    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.loanDisbursementBatches.list(JSON.stringify(filters)),
      queryFn: () => loanDisbursementBatchService.getLoanDisbursementBatches(filters),
    });
  };
