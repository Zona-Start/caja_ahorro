'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteLoanPaidAction,
  saveLoanPaidAction,
} from '../actions/loans-paid-actions';
import { LoanPaid } from '../schemas/loans-paid.schema';

/**
 * Hook para crear/actualizar pagos de préstamos
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useLoanPaidMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  const mutation = useMutation({
    mutationFn: (loanPaid: LoanPaid) => saveLoanPaidAction(loanPaid),
    onSuccess: (_, data) => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansPaid.all(),
      });

      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.count(),
      });

      // Si hay ID, invalidar el detalle específico
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.loansPaid.detail(data.id),
        });
      }

      //toast.success('Pago de Préstamo guardado exitosamente');
    },
    onError: (error) => {
      toast.error(
        'Error al guardar el pago del préstamo, contacte al administrador',
      );
      console.error('Error:', error);
    },
  });

  return mutation;
}

/**
 * Hook para eliminar pagos de préstamos
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteLoanPaid() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteLoanPaidAction(id),
    onSuccess: (_, id) => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansPaid.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansPaid.detail(id),
      });

      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.all(),
      });

      toast.success('Pago de Préstamo anulado exitosamente');
    },
    onError: (error) => {
      if (error.message === 'The payment was not found.') {
        toast.error('No se encontró el pago.');
      } else if (error.message === 'This payment has already been cancelled.') {
        toast.error('Este pago ya ha sido cancelado.');
      } else {
        toast.error(
          'Error al anular el pago del préstamo, contacte al administrador',
        );
      }
      console.error('Error:', error);
    },
  });
}
