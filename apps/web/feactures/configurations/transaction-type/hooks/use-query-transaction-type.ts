import { useSafeQuery } from "@/hooks/use-safe-query";
import { getPaginatedTransactionTypeAction, getTransactionTypeAction } from "../actions/transaction-type-actions";

// Hook for all accounts (no pagination)
export function useTransactionType() {
    return useSafeQuery(['transaction-type'], 
        () => getTransactionTypeAction()
    )
  }

// Hook for paginated accounts
export function usePaginatedTransactionType(params = {}) {
    return useSafeQuery(['paginated-transaction-type', params], 
        () => getPaginatedTransactionTypeAction(params)
    )
 
}
  
