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
  ExchangeRatesPage,
  LatestRate,
  ManualRateInput,
  SyncBcvResponse,
} from '../schemas/exchange-rates.schema';
import { exchangeRatesService } from '../services/exchange-rates-service';

const RATES_KEYS = {
  all: ['exchange-rates'] as const,
  list: (page: number, limit: number) =>
    ['exchange-rates', 'list', page, limit] as const,
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

export function useExchangeRatesQuery(
  page = 1,
  limit = 10,
): UseQueryResult<ExchangeRatesPage> {
  return useQuery({
    queryKey: RATES_KEYS.list(page, limit),
    queryFn: () => exchangeRatesService.getAll({ page, limit }),
  });
}

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
        description: 'La tasa fue registrada manualmente.',
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

export function useSyncBcvMutation(): UseMutationResult<
  SyncBcvResponse,
  unknown,
  void
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => exchangeRatesService.syncWithBcv(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: RATES_KEYS.all });
      const formatRate = (value: string) =>
        Number(value).toLocaleString('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        });
      toast({
        title: 'Tasas sincronizadas con el BCV',
        description: `USD: ${formatRate(data.rates.USD)} Bs. · EUR: ${formatRate(data.rates.EUR)} Bs. · Fecha valor: ${data.rateDate}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al sincronizar con el BCV',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}
