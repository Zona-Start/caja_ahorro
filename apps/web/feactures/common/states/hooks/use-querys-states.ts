'use client';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { getStatesAction } from '../actions/querys-states';

// Hook for all States
export function useStatesQuery() {
  return useSafeQuery(['states-query'], () => getStatesAction());
}
