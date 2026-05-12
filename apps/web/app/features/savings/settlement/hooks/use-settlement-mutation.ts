import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { settlementService } from '../services/settlement-service';
import type { Settlement } from '../schemas/settlement.schema';
import type { DisburseSettlementFormData } from '../schemas/disburse-settlement.schema';

export function useSettlementMutation(): UseMutationResult<
  unknown,
  Error,
  Settlement,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (settlement: Settlement) =>
      settlementService.saveSettlement(settlement),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.settlements.all(),
      });
      toast.success('Liquidación guardada exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar la liquidación');
    },
  });
}

export function useApproveSettlementMutation(): UseMutationResult<
  unknown,
  Error,
  number,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => settlementService.approveSettlement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.settlements.all(),
      });
      toast.success('Liquidación aprobada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al aprobar la liquidación');
    },
  });
}

export function useDisburseSettlementMutation(): UseMutationResult<
  unknown,
  Error,
  { id: number; formData: DisburseSettlementFormData },
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: DisburseSettlementFormData }) =>
      settlementService.disburseSettlement(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.settlements.all(),
      });
      toast.success('Desembolso procesado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al procesar el desembolso');
    },
  });
}