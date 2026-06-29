import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
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
        queryKey: ['creditManagements'],
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
  string,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: string) =>
      creditManagementService.approveCreditManagement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creditManagements'],
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
  string,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: string) =>
      creditManagementService.deleteCreditManagement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creditManagements'],
      });
      toast.success('Crédito eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el crédito');
    },
  });
}
