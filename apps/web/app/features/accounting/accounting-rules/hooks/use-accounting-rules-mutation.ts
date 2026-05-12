import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingRulesService } from '../services/accounting-rules-service';
import type { AccountingRule } from '../schemas/accounting-rule.schema';

export function useAccountingRuleMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: AccountingRule) =>
      payload.id
        ? AccountingRulesService.update(payload)
        : AccountingRulesService.create(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingRules.all,
      });
      toast({
        title: variables.id ? 'Regla actualizada' : 'Regla creada',
        description: `La regla contable ha sido ${variables.id ? 'actualizada' : 'creada'} exitosamente.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Ha ocurrido un error al guardar la regla.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAccountingRuleMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => AccountingRulesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingRules.all,
      });
      toast({
        title: 'Regla eliminada',
        description: 'La regla contable ha sido eliminada exitosamente.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Ha ocurrido un error al eliminar la regla.',
        variant: 'destructive',
      });
    },
  });
}
