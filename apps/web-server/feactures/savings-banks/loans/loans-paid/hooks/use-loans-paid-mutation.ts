'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  bulkUploadLoanPaidAction,
  deleteLoanPaidAction,
  downloadLoanPaidTemplateAction,
  exportLoanPaidPdfAction,
  saveLoanPaidAction,
} from '../actions/loans-paid-actions';
import { LoanPaid } from '../schemas/loans-paid.schema';

/**
 * Hook para crear/actualizar pagos de préstamos
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useLoanPaidMutation(): UseMutationResult<any, Error, LoanPaid> {
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
export function useDeleteLoanPaid(): UseMutationResult<any, Error, number> {
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

export function useBulkUploadLoanPaid(
  onSuccessCallback?: (data: any) => void,
): UseMutationResult<any, Error, FormData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => bulkUploadLoanPaidAction(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansPaid.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.all(),
      });
      if (onSuccessCallback) onSuccessCallback(data);
    },
  });
}

export function useDownloadTemplateLoanPaid(): UseMutationResult<
  any,
  Error,
  void
> {
  return useMutation({
    mutationFn: () => downloadLoanPaidTemplateAction(),
    onSuccess: (data) => {
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla-pagos-prestamos.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}

export function useExportLoanPaid() {
  return useMutation({
    mutationFn: (params: any) => exportLoanPaidPdfAction(params),
    onSuccess: (result: any) => {
      try {
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `reporte_pagos_prestamos_${Date.now()}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
      } catch (err) {
        console.error('Error al procesar el archivo PDF en el cliente:', err);
      }
    },
    onError: (error) => {
      console.error('Export Mutation Error:', error);
    },
  });
}
