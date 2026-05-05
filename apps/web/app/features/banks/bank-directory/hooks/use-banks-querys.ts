import { useQuery } from '@tanstack/react-query';
import { banksService } from '../services/banks-service';

export const banksKeys = {
  all: ['banks'] as const,
};

export function useBanksQuery() {
  return useQuery({
    queryKey: banksKeys.all,
    queryFn: () => banksService.getAll(),
  });
}
