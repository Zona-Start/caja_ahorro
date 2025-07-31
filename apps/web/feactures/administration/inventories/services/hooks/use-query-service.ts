import { useSafeQuery } from '@/hooks/use-safe-query';
import { getServices } from '../actions/service-actions';

export function useServices(params = {}) {
  return useSafeQuery(['services', params], () => getServices(params));
}

// export function useServicesAll() {
//   return useSafeQuery(['services-all'], () => getServiceAll());
// }
