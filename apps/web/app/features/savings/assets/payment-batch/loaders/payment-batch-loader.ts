import { type ClientLoaderFunctionArgs } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { paymentBatchService } from '../services/payment-batch-service';

export const paymentBatchLoader =
  (queryClient: QueryClient) =>
  async ({ request }: ClientLoaderFunctionArgs) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    
    const filters = { page, limit };

    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.paymentBatches.list(JSON.stringify(filters)),
      queryFn: () => paymentBatchService.getPaymentBatches(filters),
    });
  };
