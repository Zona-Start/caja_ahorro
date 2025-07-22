import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getServiceAll,
  getServices,
  getServiceById,
} from '../actions/service-actions';

export function useServices(params = {}) {
  return useSafeQuery(['services', params], () => getServices(params));
}

export function useServicesAll() {
  return useSafeQuery(['services-all'], () => getServiceAll());
}

export function useServiceById(id: number) {
  return useSafeQuery(['service', id], () => getServiceById(id));
}
