import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { creditsPaidService } from '../services/credits-paid-service';

export function useCreateCreditPaymentMutation(): UseMutationResult<
  unknown,
  Error,
  unknown,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (payment: unknown) =>
      creditsPaidService.createCreditPayment(payment),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.creditsPaid.all(),
      });
      toast.success('Pago registrado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al registrar el pago');
    },
  });
}