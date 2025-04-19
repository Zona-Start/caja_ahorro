'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSavingBankAction,
  saveSavingBankAction,
} from '../actions/saving-bank-actions';
import { SavingBankFormValue } from '../schemas/saving-bank';
import { useSafeQuery } from '@/hooks/use-safe-query';

export const SAVING_BANK_KEY = ['saving-bank'];

export function useSavingBank() {
  return useSafeQuery(['saving-bank'], ()=> getSavingBankAction())

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
