import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { loansManagementService } from '../services/loans-management-service';
import { loansManagementKeys } from '../keys/loans-management-keys';

export function useCreateLoansManagementMutation(): UseMutationResult<
  unknown,
  Error,
  unknown,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (payload: unknown) =>
      loansManagementService.createLoansManagement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: loansManagementKeys.lists(),
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
  string,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: string) =>
      loansManagementService.approveLoansManagement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: loansManagementKeys.lists(),
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
  string,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: string) =>
      loansManagementService.deleteLoansManagement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: loansManagementKeys.lists(),
      });
      toast.success('Préstamo eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el préstamo');
    },
  });
}

export function useDisburseIndividualLoan(): UseMutationResult<
  unknown,
  Error,
  { loanId: string; bankAccountId: string; currencyCode: string; paymentMethod: string; disbursementDate: Date; bankReference?: string; description?: string },
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (payload: any) =>
      loansManagementService.disburseLoan(payload.loanId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: loansManagementKeys.lists(),
      });
      toast.success('Préstamo desembolsado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al desembolsar el préstamo');
    },
  });
}
