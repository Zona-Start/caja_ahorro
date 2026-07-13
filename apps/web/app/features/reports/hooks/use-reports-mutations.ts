import { toast } from '@repo/shadcn/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { reportsService } from '../services/reports-service';

function downloadPdf(data: ArrayBuffer, filename: string) {
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function useExportAssociatesPdfMutation() {
  return useMutation({
    mutationFn: (params: Record<string, string | undefined>) =>
      reportsService.exportAssociatesPdf(params),
    onSuccess: (data) => {
      const today = new Date().toISOString().split('T')[0];
      downloadPdf(data, `reporte_asociados_${today}.pdf`);
      toast({
        title: 'Reporte generado',
        description: 'El reporte PDF fue descargado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al generar el reporte.',
        variant: 'destructive',
      });
    },
  });
}

export function useExportHaberesPdfMutation() {
  return useMutation({
    mutationFn: (params: Record<string, string | undefined>) =>
      reportsService.exportHaberesPdf(params),
    onSuccess: (data) => {
      const today = new Date().toISOString().split('T')[0];
      downloadPdf(data, `reporte_haberes_${today}.pdf`);
      toast({
        title: 'Reporte generado',
        description: 'El reporte de haberes fue descargado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al generar el reporte.',
        variant: 'destructive',
      });
    },
  });
}

export function useExportWithdrawalsPdfMutation() {
  return useMutation({
    mutationFn: (params: Record<string, string | undefined>) =>
      reportsService.exportWithdrawalsPdf(params),
    onSuccess: (data) => {
      const today = new Date().toISOString().split('T')[0];
      downloadPdf(data, `reporte_retiros_haberes_${today}.pdf`);
      toast({
        title: 'Reporte generado',
        description: 'El reporte de retiros de haberes fue descargado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al generar el reporte.',
        variant: 'destructive',
      });
    },
  });
}

export function useExportLoansPdfMutation() {
  return useMutation({
    mutationFn: (params: Record<string, string | undefined>) =>
      reportsService.exportLoansPdf(params),
    onSuccess: (data) => {
      const today = new Date().toISOString().split('T')[0];
      downloadPdf(data, `reporte_prestamos_${today}.pdf`);
      toast({
        title: 'Reporte generado',
        description: 'El reporte de préstamos fue descargado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al generar el reporte.',
        variant: 'destructive',
      });
    },
  });
}

export function useExportQuotasPdfMutation() {
  return useMutation({
    mutationFn: (params: Record<string, string | undefined>) =>
      reportsService.exportQuotasPdf(params),
    onSuccess: (data) => {
      const today = new Date().toISOString().split('T')[0];
      downloadPdf(data, `reporte_cuotas_${today}.pdf`);
      toast({
        title: 'Reporte generado',
        description: 'El reporte de cuotas fue descargado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al generar el reporte.',
        variant: 'destructive',
      });
    },
  });
}

export function useExportCreditsPdfMutation() {
  return useMutation({
    mutationFn: (params: Record<string, string | undefined>) =>
      reportsService.exportCreditsPdf(params),
    onSuccess: (data) => {
      const today = new Date().toISOString().split('T')[0];
      downloadPdf(data, `reporte_creditos_${today}.pdf`);
      toast({
        title: 'Reporte generado',
        description: 'El reporte de créditos fue descargado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al generar el reporte.',
        variant: 'destructive',
      });
    },
  });
}

export function useExportCreditQuotasPdfMutation() {
  return useMutation({
    mutationFn: (params: Record<string, string | undefined>) =>
      reportsService.exportCreditQuotasPdf(params),
    onSuccess: (data) => {
      const today = new Date().toISOString().split('T')[0];
      downloadPdf(data, `reporte_cuotas_creditos_${today}.pdf`);
      toast({
        title: 'Reporte generado',
        description: 'El reporte de cuotas de créditos fue descargado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al generar el reporte.',
        variant: 'destructive',
      });
    },
  });
}

export function useExportVariationsPdfMutation() {
  return useMutation({
    mutationFn: (params: Record<string, string | undefined>) =>
      reportsService.exportVariationsPdf(params),
    onSuccess: (data) => {
      const today = new Date().toISOString().split('T')[0];
      downloadPdf(data, `reporte_variaciones_${today}.pdf`);
      toast({
        title: 'Reporte generado',
        description: 'El reporte de variaciones fue descargado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al generar el reporte.',
        variant: 'destructive',
      });
    },
  });
}
