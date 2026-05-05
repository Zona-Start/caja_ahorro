import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { bankAccountService, type BankAccount } from '../services/bank-account-service';

export function useBankAccountAll(): UseQueryResult<{ data: BankAccount[] }, Error> {
  return useQuery({
    queryKey: ['bankAccounts', 'all'],
    queryFn: () => bankAccountService.getAll(),
  });
}

export function useBankAccountById(
  id: number,
  options?: { enabled?: boolean }
): UseQueryResult<BankAccount, Error> {
  return useQuery({
    queryKey: ['bankAccounts', 'detail', id],
    queryFn: () => bankAccountService.getById(id),
    enabled: options?.enabled ?? !!id,
  });
}