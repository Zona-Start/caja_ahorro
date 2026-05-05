import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { loansManagementService } from '../services/loans-management-service';

export function useCreateLoansManagementMutation(): UseMutationResult<
  unknown,
  Error,
  unknown,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (loansManagement: unknown) =>
      loansManagementService.createLoansManagement(loansManagement),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.loansManagement.all(),
      });
      toast.success('Préstamo creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el préstamo');
    },
  });
}

export function useApproveLoansManagementMutation(): UseMutationResult<
  unknown,
  Error,
  number,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => loansManagementService.approveLoansManagement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.loansManagement.all(),
      });
      toast.success('Préstamo aprobado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al aprobar el préstamo');
    },
  });
}

export function useDeleteLoansManagementMutation(): UseMutationResult<
  unknown,
  Error,
  number,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => loansManagementService.deleteLoansManagement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.loansManagement.all(),
      });
      toast.success('Préstamo eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el préstamo');
    },
  });
}