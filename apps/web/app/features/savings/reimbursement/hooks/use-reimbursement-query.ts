import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  reimbursementService,
  type CreateReimbursementPayload,
  type ExcessResponse,
  type ReimbursementListItem,
} from '../services/reimbursement-service';

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || error.message || 'Se produjo un error';
  }
  if (error instanceof Error) return error.message;
  return 'Se produjo un error';
};

export function useExcessesQuery(
  cedula: string,
  enabled: boolean,
): UseQueryResult<ExcessResponse> {
  return useQuery({
    queryKey: ['reimbursements', 'excesses', cedula],
    queryFn: () => reimbursementService.getExcesses(cedula),
    enabled: enabled && !!cedula,
  });
}

export function useReimbursementsQuery(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['reimbursements', 'list', params],
    queryFn: () => reimbursementService.getAll(params),
  });
}

export function useBankAccountsQuery(enabled = true) {
  return useQuery({
    queryKey: ['reimbursements', 'bank-accounts'],
    queryFn: () => reimbursementService.getBankAccounts(),
    enabled,
  });
}

export function useCreateReimbursementMutation(): UseMutationResult<
  unknown,
  unknown,
  CreateReimbursementPayload
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (payload) => reimbursementService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
      toast({
        title: 'Reintegro creado',
        description: 'La solicitud de reintegro fue registrada.',
      });
    },
    onError: (error) =>
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      }),
  });
}

export function useReimbursementActionMutation(): UseMutationResult<
  unknown,
  unknown,
  {
    id: string;
    action: 'approve' | 'process' | 'disburse';
    bankId?: string;
    transactionReference?: string;
    paymentDate?: string;
  }
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, action, bankId, transactionReference, paymentDate }) => {
      if (action === 'approve') return reimbursementService.approve(id);
      if (action === 'process') return reimbursementService.process(id);
      return reimbursementService.disburse(id, {
        bankId,
        transactionReference,
        paymentDate,
      });
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
      const labels: Record<string, string> = {
        approve: 'Reintegro aprobado',
        process: 'Reintegro procesado a haberes',
        disburse: 'Reintegro desembolsado',
      };
      toast({ title: labels[vars.action] ?? 'Hecho' });
    },
    onError: (error) =>
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      }),
  });
}
