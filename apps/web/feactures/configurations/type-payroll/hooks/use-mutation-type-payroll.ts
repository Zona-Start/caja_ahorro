'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteTypePayrollAction,
  saveTypePayrollAction,
} from '../actions/type-payroll-actions';
import { TypePayrolls } from '../schemas/type-payroll.schema';

// Mutation hook
export function useTypePayrollMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  const mutation = useMutation({
    mutationFn: (data: TypePayrolls) => saveTypePayrollAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.typePayroll.all() });
      toast.success('Tipo de nomina guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el tipo de nomina');
    },
  });

  return mutation;
}

export function useDeleteTypePayroll() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteTypePayrollAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.typePayroll.all() });
      toast.success('Tipo de Nomina eliminada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el tipo de nomina');
    },
  });
}
