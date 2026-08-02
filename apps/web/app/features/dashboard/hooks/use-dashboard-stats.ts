import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '../keys/dashboard-keys';
import { dashboardService } from '../services/dashboard-service';

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: dashboardService.getStats,
  });
}
