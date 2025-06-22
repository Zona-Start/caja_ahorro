import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveIndividualLoadAction } from '../actions/individual-load.action';
import { LoadAssest } from '../schemas/individual-load-schema';

export function useIndividualLoadMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (loadAssest: LoadAssest) =>
      saveIndividualLoadAction(loadAssest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-individual-load-associates-by-cedula'] });
    },
  });

  return mutation;
}
