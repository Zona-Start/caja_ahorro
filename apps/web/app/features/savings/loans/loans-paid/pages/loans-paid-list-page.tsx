'use client';

import { Separator } from '@repo/shadcn/separator';
import { LoansPaidHeader } from '../components/loans-paid-header';
import { LoansPaidList } from '../components/loans-paid-list';
import { LoansPaidTableAction } from '../components/loans-paid-tables/loans-paid-table-action';
import { useLoansPaidFilters } from '../hooks/use-loans-paid-filters';

export function LoansPaidListPage() {
  const { filters } = useLoansPaidFilters();

  return (
    <div className="space-y-4">
      <LoansPaidHeader />
      <Separator />
      <LoansPaidTableAction />
      <LoansPaidList
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

export default LoansPaidListPage;
