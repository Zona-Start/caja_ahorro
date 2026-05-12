import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingAccountsService } from '../services/accounting-accounts-service';
import type { AccountPlan } from '../schemas/account-plan.schema';

export function useAccountingAccountMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: AccountPlan) => AccountingAccountsService.save(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingAccounts.all,
      });
      
      if (variables.id) {
        toast({
          title: 'Cuenta contable actualizada',
          description: 'La cuenta contable ha sido actualizada exitosamente.',
        });
      } else {
        toast({
          title: 'Cuenta contable creada',
          description: 'La cuenta contable ha sido creada exitosamente.',
        });
      }
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Ha ocurrido un error al guardar la cuenta contable.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAccountingAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => AccountingAccountsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingAccounts.all,
      });
      toast({
        title: 'Cuenta contable eliminada',
        description: 'La cuenta contable ha sido eliminada exitosamente.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Ha ocurrido un error al eliminar la cuenta contable.',
        variant: 'destructive',
      });
    },
  });
}
