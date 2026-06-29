import { useToastSystem } from '@/hooks/use-toast-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { contributionBatchesService } from '../services/contribution-batches-service';

export function useReverseContributionBatch() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: string) => contributionBatchesService.reverse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.contributionBatches.all,
      });
      toast.success('Carga anulada correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al anular la carga');
    },
  });
}
