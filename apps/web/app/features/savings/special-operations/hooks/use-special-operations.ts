import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type ExecuteSpecialOperationPayload,
  type SpecialOperationAccountConfigItem,
  type SpecialOperationType,
} from '../schemas/special-operations.schema';
import { specialOperationsKeys } from '../keys/special-operations-keys';
import { specialOperationsService } from '../services/special-operations-service';

export function useSpecialOperationsList(filters: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  operationType?: string;
}) {
  return useQuery({
    queryKey: specialOperationsKeys.list(filters),
    queryFn: () => specialOperationsService.getOperations(filters),
  });
}

export function useSpecialOperationDetail(id: string | null) {
  return useQuery({
    queryKey: specialOperationsKeys.detail(id ?? ''),
    queryFn: () => specialOperationsService.getOperation(id!),
    enabled: !!id,
  });
}

export function useSpecialOperationPreviewMutation() {
  return useMutation({
    mutationFn: (params: {
      file: File;
      operationType: SpecialOperationType;
      operationDate: string;
    }) =>
      specialOperationsService.preview(
        params.file,
        params.operationType,
        params.operationDate,
      ),
  });
}

export function useSpecialOperationAccountsQuery() {
  return useQuery({
    queryKey: specialOperationsKeys.accounts(),
    queryFn: () => specialOperationsService.getAccounts(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSpecialOperationConfigQuery(
  operationType: SpecialOperationType | null,
) {
  return useQuery({
    queryKey: specialOperationsKeys.config(operationType ?? ''),
    queryFn: () => specialOperationsService.getConfig(operationType!),
    enabled: !!operationType,
  });
}

export function useSaveSpecialOperationConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      operationType: SpecialOperationType;
      details: SpecialOperationAccountConfigItem[];
    }) =>
      specialOperationsService.saveConfig(
        params.operationType,
        params.details,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: specialOperationsKeys.config(variables.operationType),
      });
    },
  });
}

export function useExecuteSpecialOperationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ExecuteSpecialOperationPayload) =>
      specialOperationsService.execute(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: specialOperationsKeys.lists(),
      });
    },
  });
}

export function useDownloadSpecialOperationTemplateMutation() {
  return useMutation({
    mutationFn: () => specialOperationsService.downloadTemplate(),
  });
}
