import { type ClientLoaderFunctionArgs } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { paymentBatchService } from '../services/payment-batch-service';
import { paymentBatchKeys } from '../keys/payment-batch-keys';

export const paymentBatchLoader =
  (queryClient: QueryClient) =>
  async ({ request }: ClientLoaderFunctionArgs) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || undefined;
    const status = url.searchParams.get('status') || undefined;

    const filters = { page, limit, search, status };

    return await queryClient.ensureQueryData({
      queryKey: paymentBatchKeys.list(filters),
      queryFn: () => paymentBatchService.getPaymentBatches(filters),
    });
  };
