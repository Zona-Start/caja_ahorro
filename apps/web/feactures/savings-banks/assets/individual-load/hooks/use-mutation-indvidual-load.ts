import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveIndividualLoadAction } from '../actions/individual-load.action';
import { LoadAssest } from '../schemas/individual-load-schema';

export function useIndividualLoadMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (loadAssest: LoadAssest) =>
      saveIndividualLoadAction(loadAssest),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.associatesForIndividualAssetLoad.all(),
      });
    },
    onError: () => {
      toast.error(
        'Error al realizar la carga individual. Contacte al Administrador',
      );
    },
  });
}
