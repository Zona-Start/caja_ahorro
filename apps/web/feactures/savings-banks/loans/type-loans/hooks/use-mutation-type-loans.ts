'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteTypeLoansAction,
  saveTypeLoansAction,
} from '../actions/type-loans-actions';
import { TypeLoan } from '../schemas/type-loans.schema';

/**
 * Hook para la mutación de tipos de préstamos
 * Utiliza la fábrica centralizada de claves para invalidaciones
 */
export function useTypeLoansMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  const mutation = useMutation({
    mutationFn: (data: TypeLoan) => saveTypeLoansAction(data),
    onSuccess: (data) => {
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.typeLoans.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.typeLoans.paginated() });
      queryClient.invalidateQueries({ queryKey: queryKeys.typeLoans.list() });
      
      // Mostrar mensaje de éxito
      toast.success('Tipo de Préstamo guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el tipo de préstamo');
      console.error('Error:', error);
    },
  });

  return mutation;
}

/**
 * Hook para eliminar tipos de préstamos
 * Utiliza la fábrica centralizada de claves para invalidaciones
 */
export function useDeleteTypeLoans() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteTypeLoansAction(id),
    onSuccess: () => {
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.typeLoans.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.typeLoans.paginated() });
      queryClient.invalidateQueries({ queryKey: queryKeys.typeLoans.list() });
      
      // Mostrar mensaje de éxito
      toast.success('Tipo de Préstamo eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el tipo de préstamo');
      console.error('Error:', error);
    },
  });
}
