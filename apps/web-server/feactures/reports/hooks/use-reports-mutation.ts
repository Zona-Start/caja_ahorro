'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getAssociatedDebtsReportAction } from '../actions/reports-actions';

export function useReportDebtMutation() {
  const toast = useToastSystem();

  return useMutation({
    mutationFn: getAssociatedDebtsReportAction,

    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `deudas_${format(variables.startDate, 'yyyy-MM-dd')}_${format(
        variables.endDate,
        'yyyy-MM-dd',
      )}.xlsx`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Cleanup **siempre** (incluso si cancelan)
      window.URL.revokeObjectURL(url);

      toast.success('Reporte generado exitosamente');
    },

    onError: (error) => {
      console.error('Error generating report:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al generar el reporte',
      );
    },
  });
}
