'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteAccountingConfigurationAction,
  saveAccountingConfigurationAction,
} from '../actions/accounting-configuration-actions';

export function useAccountingConfigurationMutation() {
  const queryClient = useQueryClient();

  const toast = useToastSystem();

  const mutation = useMutation({
    mutationFn: saveAccountingConfigurationAction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingConfigurations.all(),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingConfigurations.paginated(),
      });

      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.accountingConfigurations.detail(variables.id),
        });
      }
      toast.crud.create.success('Configuración contable');
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.crud.create.error('Configuración contable');
    },
  });

  return mutation;
}

export function useDeleteAccountingConfiguration() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: deleteAccountingConfigurationAction,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingConfigurations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingConfigurations.paginated(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingConfigurations.detail(id),
      });
      toast.crud.delete.success('Configuración contable');
    },
    onError: (error) => {
      toast.crud.delete.error('Configuración contable');
      console.error('Error:', error);
    },
  });
}
