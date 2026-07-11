import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastSystem } from '@/hooks/use-toast-system';
import { purchaseOrdersKeys } from '../keys';
import { PurchaseOrdersApi } from '../services/purchase-orders-api';
import type { PurchaseOrder } from '../schemas/purchase-orders.schema';

export function usePurchaseOrderMutation() {
  const qc = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: async (payload: PurchaseOrder) => {
      const { id, ...body } = payload;
      if (id) {
        return PurchaseOrdersApi.update(id, body);
      }
      return PurchaseOrdersApi.create(body as PurchaseOrder);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: purchaseOrdersKeys.lists() });
      success(vars.id ? 'Orden actualizada exitosamente.' : 'Orden creada exitosamente.');
    },
    onError: (err: unknown) => {
      error(err instanceof Error ? err.message : 'Error al guardar la orden.');
    },
  });
}

export function useDeletePurchaseOrderMutation() {
  const qc = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: (id: string) => PurchaseOrdersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: purchaseOrdersKeys.lists() });
      success('Orden anulada exitosamente.');
    },
    onError: (err: unknown) => {
      error(err instanceof Error ? err.message : 'Error al anular la orden.');
    },
  });
}

export function useApprovePurchaseOrderMutation() {
  const qc = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: (id: string) => PurchaseOrdersApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: purchaseOrdersKeys.lists() });
      success('Orden aprobada exitosamente.');
    },
    onError: (err: unknown) => {
      error(err instanceof Error ? err.message : 'Error al aprobar la orden.');
    },
  });
}

export function useDownloadPurchaseOrderPdfMutation() {
  const { error } = useToastSystem();

  return useMutation({
    mutationFn: (id: string) => PurchaseOrdersApi.downloadPdf(id),
    onSuccess: (data) => {
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orden_compra.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: (err: unknown) => {
      error(err instanceof Error ? err.message : 'Error al descargar el PDF.');
    },
  });
}
