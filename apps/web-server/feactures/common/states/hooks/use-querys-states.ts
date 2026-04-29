'use client';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getStatesAction } from '../actions/querys-states';

// Hook for all States
export function useStatesQuery() {
  return useSafeQuery(queryKeys.states.all(), () => getStatesAction());
}
