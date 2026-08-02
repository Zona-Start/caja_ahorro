import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { bankReconciliationKeys } from '../keys/bank-reconciliation-keys';
import { bankReconciliationService, type BankReconciliationQueryParams } from '../services/bank-reconciliation-service';

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ message?: string }>(error)) return error.response?.data?.message || error.message || 'Error al ejecutar la operación';
  if (error instanceof Error) return error.message;
  return 'Error al ejecutar la operación';
};

// ── Queries ──

export function useBankReconciliationsQuery(params: BankReconciliationQueryParams): UseQueryResult<any> {
  return useQuery({
    queryKey: bankReconciliationKeys.list(params),
    queryFn: () => bankReconciliationService.getAllPaginated(params),
  });
}

export function useBankReconciliationQuery(id: string, enabled = true): UseQueryResult<any> {
  return useQuery({
    queryKey: bankReconciliationKeys.detail(id),
    queryFn: () => bankReconciliationService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useStatementLinesQuery(reconciliationId: string, enabled = true): UseQueryResult<any> {
  return useQuery({
    queryKey: [...bankReconciliationKeys.detail(reconciliationId), 'statement-lines'] as const,
    queryFn: () => bankReconciliationService.getStatementLines(reconciliationId),
    enabled: enabled && !!reconciliationId,
  });
}

export function useBookTransactionsQuery(reconciliationId: string, enabled = true): UseQueryResult<any> {
  return useQuery({
    queryKey: [...bankReconciliationKeys.detail(reconciliationId), 'book-transactions'] as const,
    queryFn: () => bankReconciliationService.getBookTransactions(reconciliationId),
    enabled: enabled && !!reconciliationId,
  });
}

// ── Mutations ──

export function useCreateBankReconciliationMutation(): UseMutationResult<any, unknown, any> {
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();
  return useMutation({
    mutationFn: (p) => bankReconciliationService.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: bankReconciliationKeys.all }); toastSuccess('Conciliación creada'); },
    onError: (e) => toastError(getErrorMessage(e)),
  });
}

export function useProcessReconciliationMutation(): UseMutationResult<any, unknown, string> {
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();
  return useMutation({
    mutationFn: (id) => bankReconciliationService.processAndComplete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: bankReconciliationKeys.all }); toastSuccess('Conciliación procesada'); },
    onError: (e) => toastError(getErrorMessage(e)),
  });
}

export function useCancelReconciliationMutation(): UseMutationResult<any, unknown, string> {
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();
  return useMutation({
    mutationFn: (id) => bankReconciliationService.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: bankReconciliationKeys.all }); toastSuccess('Conciliación cancelada'); },
    onError: (e) => toastError(getErrorMessage(e)),
  });
}

export function useAddStatementLineMutation(): UseMutationResult<any, unknown, { reconciliationId: string; payload: any }> {
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();
  return useMutation({
    mutationFn: ({ reconciliationId, payload }) => bankReconciliationService.addStatementLine(reconciliationId, payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: bankReconciliationKeys.detail(v.reconciliationId) });
      toastSuccess('Línea de extracto agregada');
    },
    onError: (e) => toastError(getErrorMessage(e)),
  });
}

export function useAutoMatchMutation(): UseMutationResult<any, unknown, string> {
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();
  return useMutation({
    mutationFn: (id) => bankReconciliationService.autoMatch(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: bankReconciliationKeys.detail(id) });
      toastSuccess('Auto-conciliación ejecutada');
    },
    onError: (e) => toastError(getErrorMessage(e)),
  });
}

export function useManualMatchMutation(): UseMutationResult<any, unknown, { reconciliationId: string; payload: { statementLineIds: string[]; bankTransactionIds: string[] } }> {
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();
  return useMutation({
    mutationFn: ({ reconciliationId, payload }) => bankReconciliationService.manualMatch(reconciliationId, payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: bankReconciliationKeys.detail(v.reconciliationId) });
      toastSuccess('Conciliación manual realizada');
    },
    onError: (e) => toastError(getErrorMessage(e)),
  });
}

export function useGenerateBookEntryMutation(): UseMutationResult<any, unknown, { reconciliationId: string; payload: { statementLineId: string; description?: string } }> {
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();
  return useMutation({
    mutationFn: ({ reconciliationId, payload }) => bankReconciliationService.generateBookEntry(reconciliationId, payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: bankReconciliationKeys.detail(v.reconciliationId) });
      toastSuccess('Movimiento contable generado y conciliado');
    },
    onError: (e) => toastError(getErrorMessage(e)),
  });
}

export function useUnmatchLineMutation(): UseMutationResult<any, unknown, { reconciliationId: string; lineId: string }> {
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();
  return useMutation({
    mutationFn: ({ reconciliationId, lineId }) => bankReconciliationService.unmatchLine(reconciliationId, lineId),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: bankReconciliationKeys.detail(v.reconciliationId) });
      toastSuccess('Línea anulada y eliminada');
    },
    onError: (e) => toastError(getErrorMessage(e)),
  });
}

export function useUploadExcelMutation(): UseMutationResult<any, unknown, FormData> {
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();
  return useMutation({
    mutationFn: (fd) => bankReconciliationService.uploadExcel(fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: bankReconciliationKeys.all }); toastSuccess('Conciliación importada desde Excel'); },
    onError: (e) => toastError(getErrorMessage(e)),
  });
}

export const useAddManualMovementMutation = useAddStatementLineMutation;
