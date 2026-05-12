import { QUERY_KEYS } from '@/lib/query-keys';
import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { SupplierMutation, Supplier } from '../schemas/suppliers.schema';
import { suppliersService } from '../services/suppliers-service';

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Se produjo un error al ejecutar la operación'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Se produjo un error al ejecutar la operación';
};

export function useSaveSupplierMutation(): UseMutationResult<
  Supplier,
  unknown,
  SupplierMutation
> {
  const queryClient = useQueryClient();
  const { success, error: errorToast } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => suppliersService.save(payload),
    onSuccess: (supplier, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.suppliers.detail(supplier.id),
      });

      success({
        title: variables.id ? 'Proveedor actualizado' : 'Proveedor creado',
        description: variables.id
          ? 'Los datos del proveedor se actualizaron correctamente.'
          : 'El proveedor fue creado correctamente.',
      });
    },
    onError: (err) => {
      errorToast(getErrorMessage(err));
    },
  });
}

export function useDeleteSupplierMutation(): UseMutationResult<
  { message: string },
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success, error: errorToast } = useToastSystem();

  return useMutation({
    mutationFn: (id) => suppliersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers.all });
      success('El proveedor fue eliminado correctamente.');
    },
    onError: (err) => {
      errorToast(getErrorMessage(err));
    },
  });
}
