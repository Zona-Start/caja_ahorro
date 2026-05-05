import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { typeCreditsService } from '../services/type-credits-service';

export function useCreateTypeCreditMutation(): UseMutationResult<
  unknown,
  Error,
  unknown,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (typeCredit: unknown) => typeCreditsService.create(typeCredit),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.typeCredits.all(),
      });
      toast.success('Tipo de crédito creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el tipo de crédito');
    },
  });
}

export function useUpdateTypeCreditMutation(): UseMutationResult<
  unknown,
  Error,
  { id: number; data: unknown },
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) =>
      typeCreditsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.typeCredits.all(),
      });
      toast.success('Tipo de crédito actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el tipo de crédito');
    },
  });
}

export function useDeleteTypeCreditMutation(): UseMutationResult<
  unknown,
  Error,
  number,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => typeCreditsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.typeCredits.all(),
      });
      toast.success('Tipo de crédito eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el tipo de crédito');
    },
  });
}