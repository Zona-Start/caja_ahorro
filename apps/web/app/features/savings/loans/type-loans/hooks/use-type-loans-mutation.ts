import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { typeLoansService } from '../services/type-loans-service';

export function useCreateTypeLoanMutation(): UseMutationResult<
  unknown,
  Error,
  unknown,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (typeLoan: unknown) => typeLoansService.create(typeLoan),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.typeLoans.all(),
      });
      toast.success('Tipo de préstamo creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el tipo de préstamo');
    },
  });
}

export function useUpdateTypeLoanMutation(): UseMutationResult<
  unknown,
  Error,
  { id: number; data: unknown },
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) =>
      typeLoansService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.typeLoans.all(),
      });
      toast.success('Tipo de préstamo actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el tipo de préstamo');
    },
  });
}

export function useDeleteTypeLoanMutation(): UseMutationResult<
  unknown,
  Error,
  number,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => typeLoansService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.typeLoans.all(),
      });
      toast.success('Tipo de préstamo eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el tipo de préstamo');
    },
  });
}