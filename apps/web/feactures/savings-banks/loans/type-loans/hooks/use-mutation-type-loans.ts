'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteTypeLoansAction,
  saveTypeLoansAction,
} from '../actions/type-loans-actions';
import { TypeLoan } from '../schemas/type-loans.schema';

export const TYPE_LOANS_KEY = ['type-loans'];
export const PAGINATED_TYPE_LOANS_KEY = ['paginated-type-loans'];

// Mutation hook
export function useTypeLoansMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: TypeLoan) => saveTypeLoansAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TYPE_LOANS_KEY });
      queryClient.invalidateQueries({
        queryKey: PAGINATED_TYPE_LOANS_KEY,
      });
      toast.success('Tipo de Prestamo guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el tipo de transación');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteTypeLoans() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTypeLoansAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TYPE_LOANS_KEY });
      queryClient.invalidateQueries({
        queryKey: PAGINATED_TYPE_LOANS_KEY,
      });
      toast.success('Tipo de Prestamo eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el tipo de prestamo');
      console.error('Error:', error);
    },
  });
}
