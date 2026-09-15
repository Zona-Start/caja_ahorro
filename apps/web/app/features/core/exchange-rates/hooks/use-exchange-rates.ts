import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type {
  LatestRate,
  ManualRateInput,
} from '../schemas/exchange-rates.schema';
import { exchangeRatesService } from '../services/exchange-rates-service';

const RATES_KEYS = {
  all: ['exchange-rates'] as const,
  latest: (currencyCode: 'USD' | 'EUR') =>
    ['exchange-rates', 'latest', currencyCode] as const,
};

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Se produjo un error al ejecutar la operación'
    );
  }
  if (error instanceof Error) return error.message;
  return 'Se produjo un error al ejecutar la operación';
};

export function useLatestRateQuery(
  currencyCode: 'USD' | 'EUR',
): UseQueryResult<LatestRate> {
  return useQuery({
    queryKey: RATES_KEYS.latest(currencyCode),
    queryFn: () => exchangeRatesService.getLatest(currencyCode),
  });
}

export function useSetManualRateMutation(): UseMutationResult<
  unknown,
  unknown,
  ManualRateInput
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => exchangeRatesService.setManual(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATES_KEYS.all });
      toast({
        title: 'Tasa de cambio fijada',
        description:
          'La tasa fue registrada manualmente y queda vigente para el día.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}
