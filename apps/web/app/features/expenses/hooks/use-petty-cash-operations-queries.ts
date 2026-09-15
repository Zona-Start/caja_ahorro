import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { pettyCashKeys } from '../keys/expenses-keys';
import type {
  CloseSettlementForm,
  LiquidateVoucherForm,
  OpenSettlementForm,
  Settlement,
  Voucher,
  VoucherForm,
} from '../schemas/petty-cash-operations.schema';
import {
  pettyCashSettlementsService,
  pettyCashVouchersService,
  type SettlementsQueryParams,
  type VouchersQueryParams,
} from '../services/petty-cash-operations-service';

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Se produjo un error al ejecutar la operación'
    );
  }
  if (error instanceof Error) return error.message;
  return 'Se produjo un error al ejecutar la operación';
};

// ───────────── VALES ─────────────

export function useVouchersQuery(
  params: VouchersQueryParams,
): UseQueryResult<{
  data: Voucher[];
  meta: { totalCount: number; totalPages: number; page: number; limit: number };
}> {
  return useQuery({
    queryKey: [...pettyCashKeys.all, 'vouchers', params],
    queryFn: () => pettyCashVouchersService.getAllPaginated(params),
  });
}

export function useCreateVoucherMutation(): UseMutationResult<
  unknown,
  unknown,
  VoucherForm
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => pettyCashVouchersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pettyCashKeys.all });
      toastSuccess('Vale emitido correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useLiquidateVoucherMutation(): UseMutationResult<
  unknown,
  unknown,
  { id: string; payload: LiquidateVoucherForm }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ id, payload }) =>
      pettyCashVouchersService.liquidate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pettyCashKeys.all });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toastSuccess('Vale liquidado como gasto');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useVoidVoucherMutation(): UseMutationResult<
  unknown,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => pettyCashVouchersService.void(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pettyCashKeys.all });
      toastSuccess('Vale anulado, saldo devuelto al fondo');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

// ───────────── ARQUEO / RENDICIÓN ─────────────

export function useSettlementsQuery(
  params: SettlementsQueryParams,
): UseQueryResult<{
  data: Settlement[];
  meta: { totalCount: number; totalPages: number; page: number; limit: number };
}> {
  return useQuery({
    queryKey: [...pettyCashKeys.all, 'settlements', params],
    queryFn: () => pettyCashSettlementsService.getAllPaginated(params),
  });
}

export function useOpenSettlementMutation(): UseMutationResult<
  unknown,
  unknown,
  OpenSettlementForm
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => pettyCashSettlementsService.open(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pettyCashKeys.all });
      toastSuccess('Arqueo abierta/actualizado correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useRefreshSettlementMutation(): UseMutationResult<
  { data: Settlement },
  unknown,
  string
> {
  return useMutation({
    mutationFn: (id) => pettyCashSettlementsService.refresh(id),
  });
}

export function useCloseSettlementMutation(): UseMutationResult<
  unknown,
  unknown,
  { id: string; payload: CloseSettlementForm }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ id, payload }) =>
      pettyCashSettlementsService.close(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pettyCashKeys.all });
      toastSuccess('Arqueo cerrado correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}
