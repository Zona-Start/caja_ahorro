'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteTypePayrollAction,
  saveTypePayrollAction,
} from '../actions/type-payroll-actions';
import { TypePayrolls } from '../schemas/type-payroll.schema';

export const TYPE_PAYROLL_KEY = ['type-payroll'];
export const PAGINATED_TYPE_PAYROLL_KEY = ['paginated-type-payroll'];

// Mutation hook
export function useTypePayrollMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: TypePayrolls) => saveTypePayrollAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TYPE_PAYROLL_KEY });
      queryClient.invalidateQueries({
        queryKey: PAGINATED_TYPE_PAYROLL_KEY,
      });
      toast.success('Tipo de nomina guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el tipo de nomina');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteTypePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTypePayrollAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TYPE_PAYROLL_KEY });
      queryClient.invalidateQueries({
        queryKey: PAGINATED_TYPE_PAYROLL_KEY,
      });
      toast.success('Tipo de Nomina eliminada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el tipo de nomina');
      console.error('Error:', error);
    },
  });
}
