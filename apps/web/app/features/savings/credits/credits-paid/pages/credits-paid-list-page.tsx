'use client';

import { CreditsPaidHeader } from '../components/credits-paid-header';
import { CreditsPaidList } from '../components/credits-paid-list';
import { CreditsPaidTableAction } from '../components/credits-paid-tables/credits-paid-table-action';
import { useCreditsPaidFilters } from '../hooks/use-credits-paid-filters';

export default function CreditsPaidListPage() {
  const { filters } = useCreditsPaidFilters();

  return (
    <div className="space-y-4">
      <CreditsPaidHeader />
      <CreditsPaidTableAction />
      <CreditsPaidList
        page={filters.page}
        search={filters.search}
        limit={filters.limit}
        bank={filters.bank}
        type={filters.type}
        method={filters.method}
      />
    </div>
  );
}
