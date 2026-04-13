import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createBankReconciliationAction,
  addReconciliationDetailAction,
  processBankReconciliationAction,
} from '../actions/bank-reconciliation-actions';
import {
  BankReconciliation,
  AddReconciliationDetail,
} from '../schemas/bank-reconciliation.schema';

export const useMutationCreateReconciliation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BankReconciliation) =>
      createBankReconciliationAction(data),
    onSuccess: () => {
      toast.success('Conciliación iniciada con éxito');
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al iniciar conciliación');
    },
  });
};

export const useMutationAddDetail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: AddReconciliationDetail;
    }) => addReconciliationDetailAction(id, payload),
    onSuccess: (_, variables) => {
      toast.success('Detalle agregado con éxito');
      queryClient.invalidateQueries({
        queryKey: ['bank-reconciliations', variables.id],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al agregar detalle');
    },
  });
};

export const useMutationProcessReconciliation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => processBankReconciliationAction(id),
    onSuccess: (_, id) => {
      toast.success('Conciliación procesada y completada con éxito');
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliations'] });
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliations', id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al procesar conciliación');
    },
  });
};
