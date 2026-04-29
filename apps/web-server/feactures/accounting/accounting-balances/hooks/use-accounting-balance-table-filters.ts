'use client';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export function useAccountingBalanceTableFilters() {
  return useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(''),
      sortBy: parseAsString.withDefault('accountCode'),
      sortOrder: parseAsString.withDefault('asc'),
      accountingCycleId: parseAsString.withDefault(''),
      companyId: parseAsString.withDefault(''),
    },
    {
      history: 'push',
      shallow: false,
    },
  );
}
