import { useSafeQuery } from '@/hooks/use-safe-query';
import { getPaginatedBankMovementsAction, getBankMovementByIdAction } from '../actions/bank-movement-actions';

export function usePaginatedBankMovements(params = {}) {
  return useSafeQuery(['paginated_bank_movements', params], () =>
    getPaginatedBankMovementsAction(params),
  );
}

export function useBankMovementById(id: number, options?: { enabled?: boolean }) {
    return useSafeQuery(
        ['bank_movement_by_id', id],
        () => getBankMovementByIdAction(id),
        {
            enabled: id ? options?.enabled : false,
            ...options,
        },
    );
}
