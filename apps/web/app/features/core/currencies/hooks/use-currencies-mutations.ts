import { QUERY_KEYS } from '@/lib/query-keys';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { CurrencyMutation, Currency } from '../schemas/currencies.schema';
import { currenciesService } from '../services/currencies-service';

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Se produjo un error al ejecutar la operación'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Se produjo un error al ejecutar la operación';
};

export function useSaveCurrencyMutation(): UseMutationResult<
  Currency,
  unknown,
  CurrencyMutation
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => currenciesService.save(payload),
    onSuccess: (currency, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currencies.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.currencies.detail(currency.id),
      });

      toast({
        title: variables.id ? 'Moneda actualizada' : 'Moneda creada',
        description: variables.id
          ? 'Los datos de la moneda se actualizaron correctamente.'
          : 'La moneda fue creada correctamente.',
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

export function useDeleteCurrencyMutation(): UseMutationResult<
  { message: string },
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id) => currenciesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currencies.all });
      toast({
        title: 'Moneda eliminada',
        description: 'La moneda fue eliminada correctamente.',
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