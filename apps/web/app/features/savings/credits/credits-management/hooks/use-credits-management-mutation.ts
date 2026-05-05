import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { creditManagementService } from '../services/credits-management-service';

export function useCreateCreditManagementMutation(): UseMutationResult<
  unknown,
  Error,
  unknown,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (creditManagement: unknown) =>
      creditManagementService.createCreditManagement(creditManagement),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.creditManagements.all(),
      });
      toast.success('Crédito creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el crédito');
    },
  });
}

export function useApproveCreditManagementMutation(): UseMutationResult<
  unknown,
  Error,
  number,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => creditManagementService.approveCreditManagement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.creditManagements.all(),
      });
      toast.success('Crédito aprobado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al aprobar el crédito');
    },
  });
}

export function useDeleteCreditManagementMutation(): UseMutationResult<
  unknown,
  Error,
  number,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => creditManagementService.deleteCreditManagement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.creditManagements.all(),
      });
      toast.success('Crédito eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el crédito');
    },
  });
}