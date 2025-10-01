'use client';

import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { searchParams } from '../../utils/searchparams';

export function useBankMovementTableFilters() {
  const [bankAccountId, setBankAccountId] = useQueryState(
    'bankAccountId',
    searchParams.bankAccountId.withOptions({ shallow: false })
  );

  const [startDate, setStartDate] = useQueryState(
    'startDate',
    searchParams.startDate.withOptions({ shallow: false }).withDefault('')
  );

  const [endDate, setEndDate] = useQueryState(
    'endDate',
    searchParams.endDate.withOptions({ shallow: false }).withDefault('')
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1)
  );

  const resetFilters = useCallback(() => {
    setBankAccountId(null);
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  }, [setBankAccountId, setStartDate, setEndDate, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!bankAccountId || !!startDate || !!endDate;
  }, [bankAccountId, startDate, endDate]);

  return {
    bankAccountId,
    setBankAccountId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
  };
}
