import { useSafeQuery } from "@/hooks/use-safe-query";
import { getAccountingCyclesAction, getPaginatedAccountingCyclesAction } from "../actions/accounting-cycle-actions";

// Hook for all cycles (no pagination)
export function useAccountingCycles() {
    return useSafeQuery(['accounting_cycles'], 
        () => getAccountingCyclesAction()
    )
  }

// Hook for paginated cycles
export function usePaginatedAccountingCycles(params = {}) {
    return useSafeQuery(['paginated_accounting_cycles', params], 
        () => getPaginatedAccountingCyclesAction(params)
    )
 
}
