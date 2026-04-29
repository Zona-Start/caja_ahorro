'use client';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCompanyAction,
  saveCompanyAction,
} from '../actions/company-actions';
import { CompanyFormValue } from '../schemas/company';

export function useCompany() {
  return useSafeQuery(queryKeys.company.all(), () => getCompanyAction());
}

export function useCompanyMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: CompanyFormValue) => saveCompanyAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.company.all() });
      toast.success('Información de la empresa guardada con éxito');
    },

    onError: () => {
      toast.error('Error al guardar la información de la empresa');
    },
  });
}
