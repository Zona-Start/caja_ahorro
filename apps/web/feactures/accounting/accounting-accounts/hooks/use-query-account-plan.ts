import { useSafeQuery } from "@/hooks/use-safe-query";
import { getAccountPlansAction, getPaginatedAccountPlansAction } from "../actions/account-plan-actions";

// Hook for all accounts (no pagination)
export function useAccountingAccounts() {
    return useSafeQuery(['accounting_accounts'], 
        () => getAccountPlansAction()
    )
  }

// Hook for paginated accounts
export function usePaginatedAccounts(params = {}) {
    return useSafeQuery(['paginated_accounts', params], 
        () => getPaginatedAccountPlansAction(params)
    )
 
}
  
