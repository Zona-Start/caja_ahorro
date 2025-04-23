'use client';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCompanyAction,
  saveCompanyAction,
} from '../actions/company-actions';
import { CompanyFormValue } from '../schemas/company';

export const COMPANY_KEY = ['company'];

export function useCompany() {
  return useSafeQuery(['company'], () => getCompanyAction());
}

export function useCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompanyFormValue) => saveCompanyAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY });
    },
  });
}
