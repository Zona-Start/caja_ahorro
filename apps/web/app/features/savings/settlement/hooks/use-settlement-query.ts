import { QUERY_KEYS } from '@/lib/query-keys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settlementService } from '../services/settlement-service';
import { type Settlement } from '../schemas/settlement.schema';

export function useSettlementsQuery(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: QUERY_KEYS.settlements.list(filters),
    queryFn: () => settlementService.getSettlements(filters),
  });
}

export function useAssociateSettlementQuery(
  cedula: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: QUERY_KEYS.settlements.byCedula(cedula),
    queryFn: () => settlementService.getAssociatesByCedula(cedula),
    ...options,
  });
}

export function useSaveSettlementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Settlement) =>
      settlementService.createSettlement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.settlements.lists(),
      });
    },
  });
}

export function useApproveSettlementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settlementService.approveSettlement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.settlements.lists(),
      });
    },
  });
}

export function useDisburseSettlementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      formData,
    }: {
      id: string;
      formData: {
        bankAccountId: string;
        bankReference: string;
        transferDate: Date;
      };
    }) => settlementService.disburseSettlement(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.settlements.lists(),
      });
    },
  });
}
