'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSavingBankAction,
  saveSavingBankAction,
} from '../actions/saving-bank-actions';
import { SavingBankFormValue } from '../schemas/saving-bank';

export const SAVING_BANK_KEY = ['saving-bank'];

export function useSavingBank() {
  return useQuery({
    queryKey: SAVING_BANK_KEY,
    queryFn: getSavingBankAction,
  });
}

export function useSavingBankMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SavingBankFormValue) => saveSavingBankAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVING_BANK_KEY });
    },
  });
}
