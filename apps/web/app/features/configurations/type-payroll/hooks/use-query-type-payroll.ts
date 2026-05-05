import { useQuery } from '@tanstack/react-query';
import { typePayrollService } from '../services/type-payroll-service';

export const typePayrollKeys = {
  all: ['type-payroll'] as const,
};

export function useTypePayroll() {
  return useQuery({
    queryKey: typePayrollKeys.all,
    queryFn: () => typePayrollService.getAll(),
  });
}
