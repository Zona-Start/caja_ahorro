import {
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  useQueryState,
} from 'nuqs';

export interface SupplierPaymentsFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  supplierIds?: string[];
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useSupplierPaymentsFilters() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(10));
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault(''));
  const [supplierIds, setSupplierIds] = useQueryState('supplierIds', parseAsArrayOf(parseAsString).withDefault([]));
  const [startDate, setStartDate] = useQueryState('startDate', parseAsString.withDefault(''));
  const [endDate, setEndDate] = useQueryState('endDate', parseAsString.withDefault(''));
  const [sortBy] = useQueryState('sortBy', parseAsString.withDefault('requestedAt'));
  const [sortOrder] = useQueryState('sortOrder', parseAsString.withDefault('desc'));

  const filters: SupplierPaymentsFilters = {
    page,
    limit,
    status: status || undefined,
    supplierIds: supplierIds.length > 0 ? supplierIds : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy: sortBy || 'requestedAt',
    sortOrder: sortOrder || 'desc',
  };

  const setFilters = (newFilters: Partial<SupplierPaymentsFilters>) => {
    if (newFilters.status !== undefined) setStatus(newFilters.status || null);
    if (newFilters.supplierIds !== undefined) setSupplierIds(newFilters.supplierIds.length > 0 ? newFilters.supplierIds : null);
    if (newFilters.startDate !== undefined) setStartDate(newFilters.startDate || null);
    if (newFilters.endDate !== undefined) setEndDate(newFilters.endDate || null);
    if (newFilters.page !== undefined) setPage(newFilters.page);
    else setPage(1);
  };

  const clearFilters = () => {
    setPage(1);
    setStatus(null);
    setSupplierIds(null);
    setStartDate(null);
    setEndDate(null);
  };

  return { filters, setFilters, clearFilters };
}
